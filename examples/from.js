// In this walkthrough, we'll be creating a full-fledged `from`
// library with a fluent API using chainlang.

// ---

// Require chainlang
var chainlang = require('../chainlang');

// Declaring our `fromSpec` obect
var fromSpec = {};
 
// **take** returns either `count` elements of `_subject`,
// or `_subject.length` elements, whichever is lower.  
// <pre>
// from(array).take(count);
//</pre>
fromSpec.take = function take(count){
    var result = [];
    /* this._subject is initialized with the argument to from(...) */
    for(i = 0; i < this._subject.length && i < count; ++i){
        result.push(this._subject[i]);
    }
    
    /* `this._return` is used to break the chain and return a value */
    this._return(result);
};

// **take.all** returns all of the elements of `_subject`
// <pre>
// from(array).take.all();
// </pre>
fromSpec.take.all = function all(){
    this._return(this._subject);
}

// **take.first** returns the first element of `_subject`
// <pre>
// from(array).take.first();
// </pre>
fromSpec.take.first = function first(){
    if(!(this._subject.length >= 1)){
        this._return();
        return;
    }
    this._return(this._subject[0]);
}

// **take.last** returns the last element of `_subject`
// <pre>
// from(array).take.last();
// </pre>
fromSpec.take.last = function last(){
    if(!(this._subject.length >= 1)){
        this._return();
    }
    this._return(this._subject[this._subject.length - 1]);
}

// **where** accepts a function, `cond`, and uses it to
// filter the `_subject` array
// <pre>
// from(array).where(cond).take.all();
// </pre>
fromSpec.where = function where(cond){
    this._subject = this._subject.filter(cond);
};

// **select** accepts either a list of property
// names to project for each element, or a mapping
// function, `projector`, used to transform each
// element in the array.  
// <pre>
// from(array).select("name", "id").take.all();
// from(array).select(projectoreFn).take.all();
// from(array)
//     .where(function(el){ el != null; })
//     .select("name")
//     .take.all();
// from(array)
//     .select("name")
//     .where(function(el){ el != null; })
//     .take.all();
// </pre>
fromSpec.select = function select(projector){
    if(typeof projector !== "function"){
        projector = makeProjectorForKeys.apply(null, arguments);
    }

    var result = [];
    this._subject.forEach(function(el){
        result.push(projector(el))
    });
    this._subject = result;
};

function makeProjectorForKeys(){
    var args = arguments;
    
    return function keysProjector(el){
        var projection = {};
        for(var i = 0; i < args.length; ++i){
            projection[args[i]] = el[args[i]];
        }
        return projection;
    }
};

// **union** accepts a variable number of arrays, and appends each element
// of each array onto this._subject
// <pre>
// /* Getting all objects of array1, array2[, array3]...
//    with id == 2 */
// from(array1)
//     .union(array2[, array3]...)
//     .where(function(el){ return el.id == 2; })
//     .take.all();
// </pre>
fromSpec.union = function union(){
    for(var arg = 0; arg < arguments.length; ++arg){
        for(var el = 0; el < arguments[arg].length; ++el){
            this._subject.push(arguments[arg][el]);
        }
    }
};

// **join** performs a join of current `_subject` and `right` param.
// Join may be inner (the default), left, or right (see below). Note:
// you must call [on](#on) with some key to perform the join.
fromSpec.join = function join(right){
    this._data.left = this._subject;
    this._data.right = right;
    
    if(!this._data.joinType){
        // Default to inner join (just as with SQL)
        this._data.joinType = 'inner';
    }
    
    // Only want to expose children of join as the next possible
    // methods in the chain. (Every 'join' must be followed by an 'on')
    this._nextLink = "join";
}

// Join Wrappers
// -------------

// **left** is a wrapper for join that sets up a `joinType` variable.
// `joinType` tells the `on` method how to join two collections. In
//  this case, we select a left join.  
// Ex.
// <pre>
// from(array1).left.join(array2).on('id').take.all();
// from(array1).where(someCondIsTrue).left.join(array2).on('id').take(3);
// </pre>
fromSpec.left = {
    _wrapper: function(called, args){
        this._data.joinType = 'left';
        called.apply(null, args);
    },
    join: fromSpec.join
};

// **right** is a wrapper for join that sets up a `joinType` variable.
// `joinType` tells the `on` method how to join two collections. In
//  this case, we select a right join.  
// Ex.
// <pre>
// from(array1).right.join(array2).on('id').take.all();
// from(array1).where(someCondIsTrue).right.join(array2).on('id').take(3);
// </pre>
fromSpec.right = {
    _wrapper: function(called, args){
        this._data.joinType = 'right';
        called.apply(null, args);
    },
    join: fromSpec.join
};

// **inner** is a wrapper for join that sets up a `joinType` variable.
// `joinType` tells the `on` method how to join two collections. In
//  this case, we select a inner join. (Note: inner join is the default,
//  so `from(array1).inner.join(array2).on('id')` is equivalent to
//  `from(array1).join(array2).on('id')`  
// Ex.
// <pre>
// from(array1).left.join(array2).on('id').take.all();
// from(array1).where(someCondIsTrue).left.join(array2).on('id').take(3);
// </pre>
fromSpec.inner = {
    _wrapper: function(called, args){
        this._data.joinType = 'inner';
        called.apply(null, args);
    },
    join: fromSpec.join
}


// **on** accepts a `key` to join elements on, and an optional `isStrict` flag.
// If `isStrict` is false, the default, then comparisons are made with `==`. Otherwise,
// comparisons are with `===`. The result of on is a collection of objects with
// `left` and `right` fields, containing the elements from the "left" and "right"
// collections that were matched on their `key` fields. Joins may be left, right, or inner.
// Ex.
// <pre>
// from(array1).join(array2).on('id').take.all();
// from(array1).left.join(array2).on('val', true).take.first();
// </pre>
fromSpec.join.on = function on(key, isStrict){
    var outter,
        outterPrefix,
        inner,
        innerPrefix,
        result = [],
        resultItem = {}
        chain = this;

    if(chain._data.joinType === 'left'
        || chain._data.joinType === 'inner'){
        outter = chain._data.left;
        outterPrefix = 'left';
        inner = chain._data.right;
        innerPrefix = 'right'
    }
    else if(chain._data.joinType === 'right'){
        outter = chain._data.right;
        outterPrefix = 'right';
        inner = chain._data.left;
        innerPrefix = 'left'
    }  else {
        throw 'invalid join type';
    }

    var compare = isStrict ? strictCompare : looseCompare;
    
    var result = [];
    outter.forEach(function(outterEl){
        var matched = false;
        
        inner.forEach(function(innerEl){
            if(compare(outterEl[key], innerEl[key])){
                matched = true;
                
                resultItem = {};
                resultItem[innerPrefix] = {};
                resultItem[outterPrefix] = {};
                Object.keys(innerEl).forEach(function(innerKey){
                    resultItem[innerPrefix][innerKey] = innerEl[innerKey];
                });
                Object.keys(outterEl).forEach(function(outterKey){
                    resultItem[outterPrefix][outterKey] = outterEl[outterKey];
                });
                
                result.push(resultItem);
            }
        })
        
        if(!matched && !(chain._data.joinType === 'inner')){
            resultItem = {};
            resultItem[outterPrefix] = {};
            resultItem[innerPrefix] = null;
            Object.keys(outterEl).forEach(function(outterKey){
                resultItem[outterPrefix][outterKey] = outterEl[outterKey];
            });
            result.push(resultItem);
        }
    });
    
    this._subject = result;
};

function strictCompare(first, second){
    return first === second;
}

function looseCompare(first, second){
    return first == second;
}

module.exports = chainlang.create(fromSpec);

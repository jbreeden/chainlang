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

fromSpec.left = {
    _wrapper: function(called, args){
        this._data.joinType = 'left';
        called.apply(null, args);
    },
    join: join
};

fromSpec.right = {
    _wrapper: function(called, args){
        this._data.joinType = 'right';
        called.apply(null, args);
    },
    join: join
};

function join(right){
    this._data.left = this._subject;
    this._data.right = right;
    
    // Could have been called as `right.join`, but as long
    // as the next link is the join node we're golden.
    this._nextLink = "left.join";
}

join.on = function on(key, isStrict){
    var outter,
        outterPrefix,
        inner,
        innerPrefix,
        result = [],
        resultItem = {};

    if(this._data.joinType === 'left'){
        outter = this._data.left;
        outterPrefix = 'left';
        inner = this._data.right;
        innerPrefix = 'right'
    }
    else if(this._data.joinType === 'right'){
        outter = this._data.right;
        outterPrefix = 'right';
        inner = this._data.left;
        innerPrefix = 'left'
    } else{
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
        
        if(!matched){
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

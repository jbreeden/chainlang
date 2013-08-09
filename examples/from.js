// In this example, we'll be creating a full-fledged `from`
// library with a fluent API using chainlang.

// ---

// Require chainlang
var chainlang = require('../chainlang');

// Fluent API creation
// -------------------

// Declaring our `fromSpec` obect
var fromSpec = {};

// Binding an `append` method for phrase declaration
var phrase = chainlang.append.bind(fromSpec);

// **take** <br/>
// <pre>
// from(array).take(count);
//</pre>
phrase('take', function fromTake(count){
    /* `take` method breaks the chain and returns its own return value */
    this._link.breaks.chain();
    return take(this._subject, count);
});

// **take.all** <br/>
// <pre>
// from(array).take.all();
// </pre>
phrase('take.all', function fromTakeAll(){
    this._link.breaks.chain();
    return this._subject;
});

// **take.first** <br/>
// <pre>
// from(array).take.first();
// </pre>
phrase('take.first', function fromTakeFirst(){
    this._link.breaks.chain();
    return takeFirst(this._subject);
});

// **take.last** <br/>
// <pre>
// from(array).take.last();
// </pre>
phrase('take.last', function fromTakeLast(){
    this._link.breaks.chain();
    return takeLast(this._subject);
});

// **where** <br/>
// <pre>
// from(array).where(cond).take.all();
// </pre>
phrase('where', function fromWhere(cond){
    this._subject = this._subject.filter(cond);
});

// **select** <br/>
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
phrase('select', function fromSelect(projector) {
    this._subject = select(this._subject, projector);
});

// **union** <br/>
// <pre>
// /* Getting all objects of array1, array2[, array3]...
//    with id == 2 */
// from(array1)
//     .union(array2[, array3]...)
//     .where(function(el){ return el.id == 2; })
//     .take.all();
// </pre>
phrase('union', function fromUnion() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this._subject);
    this._subject = union.apply(null, args);
});

// **left.join** <br/>
// <pre>
// /* left join two collections on some field */
// from(array1)
//     .left.join(array2)
//     .on('fieldName')
//     .take.all();
// </pre>
phrase('left.join', function fromLeftJoin(right) {
    this._link.breaks.chain();
    this._data.joinType = 'left';
    this._data.right = right;
    
    return {
        on: on.bind(this)
    }
});

// **right.join** <br/>
// <pre>
// /* right join two collections on some field */
// from(array1)
//     .right.join(array2)
//     .on('fieldName')
//     .take.all();
// </pre>
phrase('right.join', function fromRightJoin(right) {
    this._link.breaks.chain();
    this._data.joinType = 'right';
    this._data.right = right;
    
    return {
        on: on.bind(this)  
    }
});

// **join** <br/>
// <pre>
// /* inner join two collections on some field */
// from(array1)
//     .join(array2)
//     .on('fieldName')
//     .take.all();
// </pre>
phrase('join', function fromJoinOn(right){
    this._link.breaks.chain();
    this._data.joinType = 'inner';
    this._data.right = right;
    
    return {
        on: on.bind(this)  
    }
});

function on(key){
    this._subject = join(
        this._subject, 
        this._data.right, 
        this._data.joinType, 
        key,
        false);
    
    return this;
}

// fromSpec now has this structure: <br/>
// <pre>
//{ take:
//   { [Function: fromTake]
//     all: [Function: fromTakeAll],
//     first: [Function: fromTakeFirst],
//     last: [Function: fromTakeLast] },
//  where: [Function: fromWhere],
//  select: [Function: fromSelect],
//  union: [Function: fromUnion],
//  left: { join: [Function: fromLeftJoin] },
//  right: { join: [Function: fromRightJoin] },
//  join: [Function: fromJoinOn] }
// </pre>

// Standard Api
// ------------

// *NOTE: It is generally a good idea to define your logic
// separately from your fluent api*

// ---

// **take** takes the first `count` elements from `collection`
function take(collection, count){
    var result = [];
    
    for(i = 0; i < collection.length && i < count; ++i){
        result.push(collection[i]);
    }
    
    return result;
}

// **takeFirst** returns the first element of `collection`
function takeFirst(collection){
    if(!(collection.length >= 1)){
        return;
    }
    return collection[0];
}

// **takeLast** returns the last element of `collection`
function takeLast(collection){
    if(!(collection.length >= 1)){
        return;
    }
    return collection[collection.length - 1];
}

// **select** accepts either a list of property
// names to project for each element, or a mapping
// function, `projector`, used to transform each
// element in the array.
function select(collection, projector){
    var keys = Array.prototype.slice.call(arguments, 1);
    if(typeof projector !== "function"){
        projector = makeProjectorForKeys.apply(null, keys);
    }

    var result = [];
    collection.forEach(function(el){
        result.push(projector(el))
    });
    return result;
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

// **union** accepts a variable number of arrays and returns
// an array with all elements from all array argument supplied
function union(){
    var result = [];
    var args = Array.prototype.slice.call(arguments);
    debugger;
    args.forEach(function(arg){
        arg.forEach(function(el){
            result.push(el);   
        })
    });
    
    return result;
};

// **join** joins `left` and `right` arrays with a join type
// of either 'left', 'right', or 'inner' defined by `joinType`,
// on the `key` field.
function join(left, right, joinType, key, isStrict){
    var outter,
        outterPrefix,
        inner,
        innerPrefix,
        result = [],
        resultItem = {};

    if(joinType === 'left'
        || joinType === 'inner'){
        outter = left;
        outterPrefix = 'left';
        inner = right;
        innerPrefix = 'right'
    }
    else if(joinType === 'right'){
        outter = right;
        outterPrefix = 'right';
        inner = left;
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
        
        if(!matched && !(joinType === 'inner')){
            resultItem = {};
            resultItem[outterPrefix] = {};
            resultItem[innerPrefix] = null;
            Object.keys(outterEl).forEach(function(outterKey){
                resultItem[outterPrefix][outterKey] = outterEl[outterKey];
            });
            result.push(resultItem);
        }
    });
    
    return result;
};

function strictCompare(first, second){
    return first === second;
}

function looseCompare(first, second){
    return first == second;
}

module.exports = chainlang.create(fromSpec);

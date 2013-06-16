/*
 * Author: Jared Breeden
 * File: chainlang.js
 */

var _ = require('underscore');

var chainlang = module.exports;

chainlang.create = function(lang){
    if(arguments.length !== 1){
        throw "chainlang.create expects one argument: An object containing the methods of the new chain language";
    }
    
    // Assigned to "this" on every Chain constructor call. Allows us to
    // apply methods of sub-properties onto the chain to allow consistent
    // access to _prev, _data, etc.
    var theChain = {};

    function Chain(obj){
        if(!(this instanceof Chain)){
            return new Chain(obj);
        }
        
        theChain = this;

        // TODO: Simply assign all properties of lang to the prototype,
        //       Then, we can use closure to call a proxied version of the functions
        //       binding the context to "theChain"
        for(var prop in Chain.prototype){
            if(typeof Chain.prototype[prop] == 'function'){
                continue;
            }

            this[prop] = {};
            for(var subProp in Chain.prototype[prop]){
                if(typeof Chain.prototype[prop][subProp] != 'function'){
                    continue;
                }

                theChain[prop][subProp] = createProxiedMethod(Chain.prototype[prop][subProp], theChain);
            }
        }

        theChain._obj = obj;
        theChain._data = {};
        theChain._prev = null;
    }
    
    for(var prop in lang){
        if(typeof lang[prop] == 'function'){
            Chain.prototype[prop] = createProxiedMethod(lang[prop]);
        }
        else{
            Chain.prototype[prop] = lang[prop];
        }
    }
    return Chain;
}

function callProxiedMethod(){
}


function createProxiedMethod(fn, self){
    if(!self){
        return function(){
            this._prev = fn.apply(this, arguments);
            return this;
        }
    }
    return function(){
        self._prev = fn.apply(self, arguments);
        return self;
    }
}
/*
 * Author: Jared Breeden
 * File: chainlang.js
 */

// TODO LIST:
// 1 - Eliminate constructor call requirement by appending
//     specialized versions of top-level fields to constructor itself.
//      (They will call the constructor and "apply", most likely)
// 2 - In examples, consider "shout" event library
// 3 - In examples, consider "assume" setup library...
//     ... Are there possible abstractions of common setup tasks?

var chainlang = module.exports;

chainlang.create = function(lang){
    if(arguments.length !== 1){
        throw "chainlang.create expects one argument: An object containing the methods of the new chain language";
    }

    // Static per-chain data    
    var theChain = createChainableProxy(lang);
    theChain.__break__ = false;
    theChain.__return__ = undefined;
    theChain._return = function(returnValue){
        theChain.__break__ = true;
        theChain.__return__ = returnValue;
    }

    function chain(obj){
        if(arguments.length > 1){
            throw "Chain constructors can only accept one argument";
        }

        // Each call to chain resets the context
        theChain._subject = obj;
        theChain._data = {};
        theChain._prev = null;
        
        return theChain;
    }

    return chain;
}

function createChainableProxy(language){
    var wrappers = [],
        chain = {};

    createChainableProxyNode(
        chain, /* Initial node is the chain itself */
        chain, 
        language,
        wrappers);

    return chain;
};

function createChainableProxyNode(node, chain, language, wrappers){
    // TODO: The stench is strong with this one

    for(var propName in language){
        if(propName[0] == "_"){
            continue; /* ignore special tokens */
        }

        var prop = language[propName];

        if(typeof prop === 'function'){
            node[propName] = createChainableProxiedMethod(chain, prop, wrappers);
        }
        else if(typeof prop === 'object'){
            if(prop['_invoke'] !== undefined 
               && (typeof prop['_invoke'] == 'function'))
            {
                node[propName] = createChainableProxiedMethod(chain, prop['_invoke'], wrappers);        
            }
            else
            {
                node[propName] = {};
            }

            var hasWrapper = 
                (prop['_wrapper'] !== undefined)
                && (typeof prop['_wrapper'] == 'function');

            if(hasWrapper){
                wrappers.push(prop['_wrapper']);
            }
            
            createChainableProxyNode(node[propName], chain, prop, wrappers);
            
            if(hasWrapper){
                wrappers.pop();
            }

        }
        else{
            node[propName] = prop;
        }
    }
}

function createChainableProxiedMethod(chain, fn, wrappers){
    var i,
        proxiedMethod,
        wrappers = captureArray(wrappers);

    proxiedMethod = function(){
        chain._prev = fn.apply(chain, arguments);
        return returnValue(chain);
    }

    if(wrappers.length > 0){
        for(i = wrappers.length - 1; i >= 0; i -= 1){
            proxiedMethod = createWrappedChainableMethod(chain, wrappers[i], proxiedMethod);
        }
    }

    return proxiedMethod;
}

function createWrappedChainableMethod(chain, wrapperFunction, innerFunction){
    return function(){
        args = arguments;
        chain._prev = wrapperFunction.call(chain, function(){
            return innerFunction.apply(chain, args);
        });
        return returnValue(chain);
    }
}

// Returns chain.__return__ if chain.__break__ is set,
// or else returns the chain
function returnValue(chain){
    if(chain.__break__){
        return chain.__return__;
    }
    return chain;
}

// "Captures" an array. (i.e. makes a new array with the same references
//  to avoid having the contents of a closed-over array changed externally)
function captureArray(array){
    var capturedArray = [];

    for(i = 0; i < array.length; i += 1){
        capturedArray[i] = array[i];
    }

    return capturedArray;
}
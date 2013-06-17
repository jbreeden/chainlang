/*
 * Author: Jared Breeden
 * File: chainlang.js
 */

var chainlang = module.exports;

chainlang.create = function(lang){
    if(arguments.length !== 1){
        throw "chainlang.create expects one argument: An object containing the methods of the new chain language";
    }
    
    var theChain = createChainableProxy(lang);

    function chain(obj){
        if(arguments.length > 1){
            throw "Chain constructors can only accept one argument";
        }

        // Each call to chain resets the context
        theChain._subject = obj;
        theChain._data = {};
        theChain._prev = null;
        theChain._return = undefined;
        
        return theChain;
    }

    return chain;
}

function createChainableProxy(language){
    var chain = {};

    createChainableProxyNode(
        chain, /* Initial node is the chain itself */
        chain, 
        language,
        [],
        []);
    return chain;
}

function createChainableProxyNode(node, chain, language, filters, wrappers){
    // TODO: The stench is strong with this one

    for(var propName in language){
        if(propName[0] == "_"){
            continue; /* ignore special tokens */
        }

        var prop = language[propName];

        if(typeof prop === 'function'){
            node[propName] = createChainableProxiedMethod(chain, prop, filters, wrappers);
        }
        else if(typeof prop === 'object'){
            if(prop['_invoke'] !== undefined 
               && (typeof prop['_invoke'] == 'function'))
            {
                node[propName] = createChainableProxiedMethod(chain, prop['_invoke'], filters, wrappers);        
            }
            else
            {
                node[propName] = {};
            }

            var hasFilter = 
                (prop['_filter'] !== undefined)
                && (typeof prop['_filter'] == 'function');

            var hasWrapper = 
                (prop['_wrapper'] !== undefined)
                && (typeof prop['_wrapper'] == 'function');

            if(hasFilter)
            {
                filters.push(prop['_filter']);
            }
            if(hasWrapper){
                wrappers.push(prop['_wrapper']);
            }
            
            createChainableProxyNode(node[propName], chain, prop, filters, wrappers);
            
            if(hasFilter){
                filters.pop();
            }
            if(hasWrapper){
                wrappers.pop();
            }
        }
        else{
            node[propName] = prop;
        }
    }
}

function createChainableProxiedMethod(chain, fn, filters, wrappers){
    var i,
        filters = captureArray(filters),
        wrappers = captureArray(wrappers);

    var proxiedMethod = function(){
        chain._prev = fn.apply(chain, arguments);

        for(var i = filters.length - 1; i >= 0; i -= 1){
            filters[i].apply(chain);
        }

        if(chain._return !== undefined){
            return chain._return;
        }

        return chain;
    }

    // TODO: Yikes.
    if(wrappers.length > 0){
        for(i = wrappers.length - 1; i >= 0; i -= 1){
            proxiedMethod = 
                (function(innerFunction, wrapperFunction){
                    return function(){
                        args = arguments;
                        chain._prev = wrapperFunction.call(chain, function(){
                            return innerFunction.apply(chain, args);
                        });

                        if(chain._return !== undefined){
                            return chain._return;
                        }

                        return chain;
                    }
                }(proxiedMethod, wrappers[i]));
        }
    }

    return proxiedMethod;
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
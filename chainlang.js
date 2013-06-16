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
    
    var theChain = createChainableProxy(lang);
    
    function chain(obj){
        // Each call to chain resets the context
        theChain._subject = obj;
        theChain._data = {};
        theChain._prev = null;
        return theChain;
    }

    return chain;
}

function createChainableProxy(language){
    var chain = {};
    createChainableProxyNode(
        chain, /* Initial node is the chain itself*/
        chain, 
        language);
    return chain;
}

function createChainableProxyNode(node, chain, language){
    for(var propName in language){
        var prop = language[propName];

        if(typeof prop == 'function'){
            node[propName] = createChainableProxiedMethod(chain, prop);
        }
        else{
            node[propName] = {};
            createChainableProxyNode(node[propName], chain, prop);
        }
    }
}

function createChainableProxiedMethod(chain, fn){
    return function(){
        chain._prev = fn.apply(chain, arguments);
        return chain;
    }
}
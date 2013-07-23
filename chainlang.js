/*
 * Author: Jared Breeden
 * File: chainlang.js
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Jared Breeden
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 */

(function(){
    // chainlang
    // ---------
    var chainlang;

    // Node-style export
    if(typeof module !== 'undefined' && module.exports){
        chainlang = module.exports;
    }
    else{
        chainlang = {};
        window.chainlang = chainlang;
    }

    // `chainlang.create` accepts a `lang` parameter and returns
    // a [`chain`](#chain) constructor that is used to begin chained
    // expressions.
    chainlang.create = function(lang){
        if(arguments.length !== 1){
            throw "chainlang.create expects one argument: An object containing the methods of the new chain language";
        }

        // `theChain` is a per-language singleton. That is, each chained
        // expression will access data from the same "chain" object. This 
        // means that chains cannot be arbitrarily saved to variables and 
        // interleaved with other chain expressions of the same language.
        var theChain = createChainableProxy(lang);

        theChain._link = {};
        theChain._link.breaks = {};
        theChain._link.breaks.chain = function(returnValue){
            theChain.__break__ = true;
        }
        
        theChain._link.binds = {};
        theChain._link.binds.to = function(nextLink){
            theChain.__nextLink__ = nextLink;
        }

        // ### chain expression constructor
        // ---
        // The `chain` function is the constructor for chained expressions
        // of the new `chainlang` type. 
        // <a id="chain"></a>
        function chain(obj){
            if(arguments.length > 1){
                throw "Chain constructors can only accept one argument";
            }

            // Resetting the properties on `theChain` for the new expression
            theChain._subject = obj;
            theChain._data = {};
            theChain._prev = null;
            theChain.__nextLink__ = undefined;
            theChain.__break__ = false;
            theChain.__stackHeight__ = 0;
            
            return theChain;
        }

        // Returning the `chain` constructor to the client of `chainlang.create`
        return chain;
    }

    // Privates
    // --------

    // This function kicks off the recursive traversal of the language
    // object to create an object with chainable methods. (These are
    // essentially "proxied" versions of the methods found on the language object.)
    function createChainableProxy(language){
        var wrappers = [],
            chain = {};

        createChainableProxyNode(
            chain,
            chain, 
            language,
            wrappers);

        return chain;
    };

    // This is the self-recursive method for construction of the chainable object
    function createChainableProxyNode(node, chain, language, wrappers){
        var hasWrapper = hasWrapperMethod(language);

        if(hasWrapper){
            wrappers.push(language['_wrapper']);
        }


        for(var propName in language){
            // Properties named with a leading underscore are reserved for chain-level
            // semi-hidden data to avoid conflicts with language methods. So, for now
            // we'll just ignore any we come across. May want to throw an error later.
            if(propName[0] == "_"){
                continue;
            }

            var prop = language[propName];
            if(prop === undefined || prop === null){
               continue;
            }
            
            var makeNode = true;
            if(typeof prop == "function"){
                node[propName] = createChainableProxiedMethod(chain, prop, wrappers);
            }
            else if(typeof prop == "object"){
                node[propName] = {};
            }
            else{
                makeNode = false;
                node[propName] = prop;
            }
            
            if(makeNode){
                createChainableProxyNode(node[propName], chain, prop, wrappers);
            }
        }

        if(hasWrapper){
            wrappers.pop();
        }
    }

    function hasWrapperMethod(obj){
        return (
            obj['_wrapper'] !== undefined
            && typeof obj['_wrapper'] === "function"
        );
    }

    function createChainableProxiedMethod(chain, fn, wrappers){
        var i,
            proxiedMethod,
            wrappers = captureArray(wrappers);

        proxiedMethod = function(){
            chain.__stackHeight__ = wrappers.length;
            chain._prev = fn.apply(chain, arguments);
            return returnValue(chain);
        }

        if(wrappers.length > 0){
            for(i = wrappers.length - 1; i >= 0; i -= 1){
                proxiedMethod = createWrappedChainableMethod({
                        chain: chain,
                        wrapperFunction: wrappers[i],
                        proxiedMethod: proxiedMethod,
                        stackHeight: i
                    });
            }
        }

        return proxiedMethod;
    }

    // `opt` options arguments should contain fields
    // `chain`, `wrapperFunction`, `proxiedMethod`, `stackHeight`
    function createWrappedChainableMethod(opt){
        return function(){
            opt.chain._prev = opt.wrapperFunction.call(opt.chain, opt.proxiedMethod, arguments);
            opt.chain.__stackHeight__ = opt.stackHeight;
            
            return returnValue(opt.chain);
        }
    }

    // Returns `chain.__return__` if `chain.__break__` is set,
    // or `chain.__nextLink__` if it is set, or else returns
    // the chain.
    function returnValue(chain){
        if (chain.__stackHeight__ === 0) {
            if (chain.__break__) {
                return chain._prev;
            }
            if (undefined != chain.__nextLink__) {
                var nextLink = chain.__nextLink__;
                chain.__nextLink__ = undefined;
                return nextLink;
            }
        }
        
        return chain;
    }

    // "Captures" an array. (i.e. makes a new array with the same references
    //  to avoid having the contents of a closed-over array changed externally)
    function captureArray(array) {
        var capturedArray = [];

        for(i = 0; i < array.length; i += 1){
            capturedArray[i] = array[i];
        }

        return capturedArray;
    }
}());
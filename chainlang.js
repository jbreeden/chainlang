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
    "use strict";
    
    // chainlang
    // ---------
    var chainlang;

    if (typeof module !== 'undefined' && module.exports) {
        // Node-style export
        chainlang = module.exports;
    } else {
        // Browser-syle export
        chainlang = {};
        window.chainlang = chainlang;
    }
    
    // chainlang.append
    // ----------------
    
    // Adds a `leaf` node to the `root` object at any depth, creating
    // the parent nodes along the way if they are undefined. <br/>
    // *Note: If no root parameter is supplied, append will
    //  assume that `this` is bound to the root object.*
    chainlang.append = function append(root, path, leaf) {
        if(arguments.length < 3){
            // Fix arguments
            leaf = arguments[1];
            path = arguments[0];
            root = this;
        }
        
        var descendants = path.split('.');
        
        var currentNode = root;
        var finalIndex = descendants.length - 1;
        
        for (var i = 0; i <= finalIndex; ++i) {
            var childName = descendants[i];
            var child = currentNode[childName];
            
            if (i !== finalIndex) {
                // Make the child if it doesn't exist
                currentNode[childName] = (undefined === child) ? {} : child; 
                currentNode = currentNode[childName];
            } else {
                currentNode[childName] = leaf;
            }
        }
    };
    
    // chainlang.create
    // ----------------

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
        
        chainlang.append(theChain, '_link.breaks.chain', function () {
            theChain.__break__ = true;
        });
        
        chainlang.append(theChain, '_link.binds.to', function (nextLink) {
            theChain.__nextLink__ = nextLink;
        });

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
            
            return theChain;
        }

        // Returning the `chain` constructor to the client of `chainlang.create`
        return chain;
    }

    // Privates
    // --------

    // This function kicks off the recursive traversal of the language
    // spec object to create an object with chainable methods. (These are
    // essentially "proxied" versions of the methods found on the language object.)
    function createChainableProxy(language){
        var chain = {};

        createChainableProxyNode(
            chain,
            chain, 
            language);

        return chain;
    };

    // This is the self-recursive method for construction of the chainable object
    function createChainableProxyNode(node, chain, language){
        Object.keys(language).forEach(function(key){
            // Properties named with a leading underscore are reserved for chain-level
            // semi-hidden data to avoid conflicts with language methods. So, for now
            // we'll just ignore any we come across. May want to throw an error later.
            if(key[0] == "_"){
                return;
            }

            var prop = language[key];
            if(prop === undefined || prop === null){
               return;
            }
            
            if(typeof prop == "function"){
                node[key] = createChainableProxiedMethod(chain, prop);
                createChainableProxyNode(node[key], chain, prop);
            }
            else if(typeof prop == "object"){
                node[key] = {};
                createChainableProxyNode(node[key], chain, prop);
            }
            else{
                node[key] = prop;
            }    
        });
    }

    function createChainableProxiedMethod(chain, fn){
        var i,
            proxiedMethod;

        proxiedMethod = function(){
            chain._prev = fn.apply(chain, arguments);
            return returnValue(chain);
        }

        return proxiedMethod;
    }

    // Returns `chain.__return__` if `chain.__break__` is set,
    // or `chain.__nextLink__` if it is set, or else returns
    // the chain.
    function returnValue(chain){
        if (chain.__break__) {
            return chain._prev;
        }
        if (undefined != chain.__nextLink__) {
            var nextLink = chain.__nextLink__;
            chain.__nextLink__ = undefined;
            return nextLink;
        }
        
        return chain;
    }
}());
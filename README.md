Chainlang
=========

Chainlang is a utility for easily creating chainable methods and complex fluent APIs in JavaScript.

Motivation
==========

Fuent APIs make code easier to read and understand. Replacing a large options object parameter with a convenient
fluent API can greatly simplify the use of many library functions. In an interactive environment like the
nodejs repl, or the Firebug console, programmers can take advantage of auto-completion and exploratory programming
to uncover the features of your fluent API without having to resort to the documentation.

Usage
=====

Creating a Chainable API
------------------------

Just pass any JavaScript object to `chainlang.create` to create a chainable api:

```
var adder = {
    add: function(val){ 
        this._subject += val; 
    },
    calc: function() { 
        return this._subject; 
    }
}

var to = chainlang.create(adder);

// Logs: 10
console.log(
    to(1).add(2).add(3).add(4).calc()
);
```

`chainlang.create` will return a function that starts your chain expression. The optional parameter
to this function will be saved in `this._subject` and accessible by all of your methods. If no value
is returned by a method in the chain, the chain object itself is implicitly returned so you may
continue to chain other methods.

Everything is Chainable
-----------------------

The object you pass to `chainlang.create` need not have all of it's method at the root level, as in
the example above. Any method on the object graph, no matter how deeply nested, will be chainable.

```
var even = {
    deeply: {
        nested: {
            methods: function(){
                return;   
            }
        }
    },
    are: {
        chainable: function(){
            console.log(true);   
        }
    }
};

var even = chainlang.create(even);

// Logs: true
even().deeply.nested.methods().are.chainable();
```

Skip The Initial Call
---------------------

As mentioned, `chainlang.create` returns a function that will start your chain. This function returns the
chain object that all of your subsequent method calls are applied to. While this is required to allow chaining,
the function call is only useful to clients if you want to capture some `_subject`. If you have no such need
the function call is extraneous. `chainlang` will allow you to skip this initial call, and still makes.

```
// TODO: Need example
```

Using `chainlang.append`
------------------------

`chainlang.append` is a simple function to help you build your language spec before passing it to
`chainlang.create`. With `chainlang.append`, you can declare leaf nodes of an object graph and
have the parent nodes filled in for you. So, the previous example could have been written like this:

```
var even = {};
chainlang.append(even, 'deeply.nested.methods', function(){ return; });
chainlang.append(even, 'are.chainable', function(){ console.log(true); });
even = chainlang.create(even);

// Logs: true
even().deeply.nested.methods().are.chainable();
```

If you bind `chainlang.append` to some object, the first parameter may be omitted

```
var even = {};
var define = chainlang.append.bind(even);

define('deeply.nested.methods', function(){ return; });
define('are.chainable', function(){ console.log(true); });

even = chainlang.create(even);

// Logs: true
even().deeply.nested.methods().are.chainable();
```

Sharing Data Between Links
--------------------------

Along with `this._subject`, all method calls have access to `this._data`. `this._data` is initially
empty, and is simply provided as a convenient place to store information between links in a chained
expression.

```
var spec = {};
var define = chainlang.append.bind(spec);

define('setData', function(val){ 
    this._data.field = val; 
});
define('logData', function(){ 
    console.log(this._data.field); 
});

var chain = chainlang.create(spec);

// Logs: 999
chain().setData(999).logData();
```

Keeping Your Privates Hidden
----------------------------

Sometimes it's desirable to hide some methods of your chainable api until it makes sense to use them.
`chainlang` provides no built-in support for this, but it is recommended that you simply hide these nodes
behind a field with a name like '_private'. That way, programmers using your api will not be tempted to use
these methods in a context where it does not make sense to do so. Also, keeping them *all* behind
a field like this, instand of simply prefixing them all with an '_' will prevent the auto-completion
results from being cluttered with fields that are supposed to be private in the first place. For example:

```
var delaySpec = {};
var define = chainlang.append.bind(delaySpec);

define('for', function(count){
    this._data.count = count;
    
    // exposing our private 'units' object now that we have a count
    return this._private.units;
});

define('_private.units.seconds.then', function(callback){
    setTimeout(callback, this._data.count * 1000);
});

define('_private.units.minutes.then', function(callback){
    setTimeout(callback, this._data.count * 1000 * 60)
});

var delay = chainlang.create(delaySpec);

// After 5 seconds, logs: '5 seconds elapsed'
delay().for(5).seconds.then(function(){
    console.log('5 seconds elapsed');
});

// After 5 minutes, logs: '5 minutes elapsed'
delay().for(5).minutes.then(function(){
    console.log('5 minutes elapsed');
});
```

In the previous example, it would not make sense to have an expression such as `delay().minutes.then(...)`.
The count needs to be declared before the units, so the units object is kept in private storage and exposed
by `return`ing it from the `for(count)` call.

Creating Modifiers
------------------

With fluent APIs, it can be useful to declare modifiers that alter the behavior of all methods that descend
from them in the object graph. For this, chainlang exposes the `chainlang.proxy` method. This allows you to
create a copy of an object with all of its methods proxied. This is the same technique used by
chainlang to create an object with chainable methods in `chainlang.create`.

```
var is = {};

// `is.even(...)` determines whether a value is even
is.even = function(){
    return (this._subject % 2 === 0);
};

// `isNot` has all the same methods of `is`, but negates their returns
var isNot = chainlang.proxy(is, function(fn){
    return function(){
        return !fn.apply(this, arguments);  
    };
});

is.not = isNot;

is = chainlang.create(is);

// Logs: true
console.log(
    is(68).even()
);

// Logs: false
console.log(
    is(68).not.even()
);
```

More Information
================

* [The chainlang spec](http://jbreeden.github.io/chainlang/spec/spec.html)
* [Example: Creating a full-feature fromjs library](http://jbreeden.github.io/chainlang/fromjs/from.html)
* [Annotated source of chainlang.js](http://jbreeden.github.io/chainlang/source/chainlang.html)

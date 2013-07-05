# !!! UNDER CONSTRUCTION !!!

Nevertheless, feel free to look around.

# Chainlang

Chainlang is a utility for easily creating chainable methods and complex fluent APIs (or fluent interfaces) in JavaScript.

# Gentle Introduction

With chainlang, you define the hierarchical structure of your fluent API as an object with methods. These methods may exist on the top level object, or be arbitrarily nested within child objects. After you've defined this structure representing your new "chain language" (we'll call it your "language spec") you pass it to `chainlang.create` which takes care of details like making methods chainable, or allowing links in a chained expression to share data.

So, for example, with a language defined like this:

```javascript
var fromSpec = {
    where: function(cond){
        this._subject = this._subject.filter(cond);
    },
    take: {
        all: function(){
            this._return(this._subject);
        }
    }
};

var from = chainlang.create(fromSpec);
```

we would then be able to:

```javascript
var numbers = [1, 2, 3, 4, 5, 6];

var evens = 
    from(numbers)
    .where(function(num){
        return num % 2 == 0; 
    }).take.all();

console.log(evens); // Logs: [ 2, 4, 6 ]
```

Granted, this isn't the most feature-filled API ever created ([yet](http://jbreeden.github.io/chainlang/fromjs/from.html)), but it was incredibly simple to define. There are no closures to capture the argument to the `from(...)` function, it is simply accessible by any method in our language spec, at any level in the hierarchy, as `this._subject`.

Also, no care was taken to return `this` from the methods of `fromSpec`. In fact, `fromSpec.where` returns a boolean, but we're still able to chain a call such as `from(numbers).where(cond).take.all()`. That's because `chainlang.create` creates a copy of its argument (the language spec) where all methods are proxied. The proxied methods all have their `this` context bound to a chain object, and they all return the same chain object.

So, what happens if you want to return a value? Just as in `fromSpec.take.all` above, you call `this._return` with some argument. This sets a flag on the chain object itself that tells the proxied methods to break the chain and return whatever value you've provided. (Note: this call does not actually cause your method to return, it just sets up a return value. If you call `this._return` again before your method finishes, you will overwrite the previous return value.)

# Features

## Basic Features

TODO (`_subject`, `_data`, `_prev`, `_return`)

## Advanced

TODO (`_nextLink`, `_wrapper`, automatic binding at arbitrary depth)

# More Information
* [Walkthrough: Creating a full-feature fromjs library](http://jbreeden.github.io/chainlang/fromjs/from.html)
* [Annotated source](http://jbreeden.github.io/chainlang/source/chainlang.html)
* [Spec](http://jbreeden.github.io/chainlang/spec/spec.html)

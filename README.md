# Chainlang

Chainlang is a utility for easily creating chainable methods and complex fluent APIs (or fluent interfaces) in JavaScript.

# Introduction

With chainlang, you define the hierarchical structure of your fluent API as a plain-old JavaScript object. After you've defined this structure (we'll call it your "language specification") you pass it to `chainlang.create` which takes care of details like making methods chainable or allowing links in a chained expression to share data, among other things.

So, for example, with a language defined like this:

```javascript
var fromSpec = {
    where: function(cond){
        this._subject = this._subject.filter(cond);
    },
    take: {
        all: function(){
            this._breaksChain();
            return this._subject;
        }
    }
};

var from = chainlang.create(fromSpec);
```

we would be able to:

```javascript
var numbers = [1, 2, 3, 4, 5, 6];

var evens = 
    from(numbers)
    .where(function(num){
        return num % 2 == 0; 
    }).take.all();

console.log(evens); // Logs: [ 2, 4, 6 ]
```

Granted, this isn't the most feature-filled API ever created ([yet](http://jbreeden.github.io/chainlang/fromjs/from.html)), but it was incredibly simple to define. There are no closures or other tricks to capture the argument to the `from(...)` function, it is simply accessible by any method in our language spec, at any level in the hierarchy, as `this._subject`.

Also note that no care was taken to return `this` from the methods of `fromSpec` as is typical with chainable methods. In fact, `fromSpec.where` doesn't return anything, but we're still able to chain together an expression such as `from(numbers).where(cond).take.all()`. That's because `chainlang.create` creates a copy of its argument (the language spec) where all methods are proxied. The proxied methods all have their `this` context permanently bound to a chain object, and they all return the chain object implicitly.

So, what happens if you want to return a value? Just as in `fromSpec.take.all` above, you call `this._breaksChain()`. This sets a flag on the chain object itself that tells the proxied methods to return their own return value instead of implicitly returning the chain object.

That's the basic idea.

# Features

Chainlang provides a small but powerful set of features to control the semantics of your generated API.
Some of these features, like the `_breaksChain` method discussed in the introduction, are fields or methods
accessible via `this` within the methods of your language specification object. Others, like `_wrapper`, are
special nodes that can be placed within your specification. (For an interesting use of `_wrapper` nodes, see
the section on "Join Wrappers" in the [full fromjs example](http://jbreeden.github.io/chainlang/fromjs/from.html))

To see all the available features, check out the [chainlang spec](http://jbreeden.github.io/chainlang/spec/spec.html).

# More Resources

* [Example: Creating a full-feature fromjs library](http://jbreeden.github.io/chainlang/fromjs/from.html)
* [Annotated source of chainlang.js](http://jbreeden.github.io/chainlang/source/chainlang.html)

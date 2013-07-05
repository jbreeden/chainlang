<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-42220461-1', 'jbreeden.github.io');
  ga('send', 'pageview');

</script>

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
            this._return(this._subject);
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

So, what happens if you want to return a value? Just as in `fromSpec.take.all` above, you call `this._return` with some argument. This sets a flag on the chain object itself that tells the proxied methods to break the chain and return whatever value you've provided.

That's the basic idea.

# Features

Chainlang provides a small but powerful set of features to control the semantics of your generated API. Some of these features, like the `_return` method discussed in the introduction, are fields or methods accessible via `this` within the methods of your language specification object. Others, like `_wrapper`s, are special nodes that can be placed within your specification. (For an interesting use of `_wrapper` nodes, see the section on "Join Wrappers" in the [full fromjs example](http://jbreeden.github.io/chainlang/fromjs/from.html))

### Basic

TODO (`_subject`, `_data`, `_prev`, `_return`)

### Advanced

TODO (`_nextLink`, `_wrapper`, automatic binding at arbitrary depth)

# More Information

Chainlang is still young, so the documentation is a bit sparse (I'm working on it). However, it is already useful and certainly mature enough to handle some constructive feedback! If you're interested in using chainlang, or providing some feedback on the direction it's taking, have a look at some of the documents below to get a fuller picture of what the library offers.

* [Example: Creating a full-feature fromjs library](http://jbreeden.github.io/chainlang/fromjs/from.html)
* [Annotated source of chainlang.js](http://jbreeden.github.io/chainlang/source/chainlang.html)
* [Spec](http://jbreeden.github.io/chainlang/spec/spec.html) (As in, `mocha --reporter doc ./test/test.chainlang.js`)

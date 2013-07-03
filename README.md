# !!! UNDER CONSTRUCTION !!!

Please, feel free to look around - so long as you don't judge me.

# chainlang

Chainlang is a utility for creating chainable methods and fluent interfaces.

# Features

They're sweet, I assure you... but I can't tell you about them yet.

For now, have a look at the [annotated source](http://jbreeden.github.io/chainlang/source.html)
and the [spec](http://jbreeden.github.io/chainlang/spec.html)

# Example

In this example, we'll implement a library dubbed `from` atop chainlang. The `from` library will provide basic
collection querying/projecting facilities in a yoda-sql style api. `from` is defined as follows:

```javascript
var chainlang = require('../chainlang.js');

var fromSpec = {};

fromSpec.where = function(cond){
    var result = this._subject.filter(cond);
    this._subject = result;
}

fromSpec.select = function(projector){
    // If called with keys, create projector
    if(typeof projector !== "function"){
        projector = makeProjectorForKeys.apply(null, arguments);
    }

    var result = [];
    this._subject.forEach(function(el){
        result.push(projector(el))
    });
    this._subject = result;
}

fromSpec.first = function(){
    if(!(this._subject.length >= 1)){
        return;
    }
    this._return(this._subject[0]);
}

fromSpec.last = function(){
    if(!(this._subject.length >= 1)){
        return;
    }
    this._return(this._subject[this._subject.length]);
}

fromSpec.all = function(){
    this._return(this._subject);
}

function makeProjectorForKeys(){
    var args = arguments;
    
    return function keysProjector(el){
        debugger;
        var projection = {};
        for(var i = 0; i < args.length; ++i){
            projection[args[i]] = el[args[i]];
        }
        return projection;
    }
}

module.exports = chainlang.create(fromSpec);
```

As you can see from the above definition, `from` provides filtering via `where` and projection via `select`. `select` 
accepts either a list of keys to project, or a mapping function that takes an element and returns the desired
projection. As with all chainable methods, these methods return the object they were called on so that more method
calls may be chained. So, to return the results of the filtering/projection, the methods `first`, `last`, and `all`
are provided. Each of these methods utilizes the semi-private `_return` method of the chain object, which is provided
to all chain languages created with `chainlang.create`. `_return` allows you to break the chain and return a value
of your choosing.

Ok, so `from` is small, but functional. Let's see it in action. Suppose we have a list of employees, the declaration of
which looks like this:

```javascript
var from = require('./from');

var employees = [
    {
        id: 1,
        name: "Thomas",
        role: "developer"
    },
    {
        id: 2,
        name: "David",
        role: "manager",
        minions: [1, 3]
    },
    {
        id: 3,
        name: "Mark",
        role: "developer"
    },
    {
        id: 4,
        name: "Brian",
        role: "developer"
    }
];
```

This list includes three developers and one manager, David. David has two employees, and their employee IDs are listed
in David's `minions` array. If we want to find all of David's minions, we could start by getting their IDs. Using
`from`, we can:

```javascript
var davidsMinionsIds = 
    from(employees)
    .where(function(employee){ 
        return employee.name == "David";
    })
    .select(function(employee){
        return employee.minions;
    })
    .first();
```

Thanks to `from`'s fluent api, this reads rather nicely as "from employees, where employee name is David, select
employee's minions." Since select returns an array that we know will only have one element, we use `first` to break
the chain and return the minion id array directly.

Now that we have David's minions' IDs, we can get their employee objects. To do this, we'll use another `from` query:

```javascript
var davidsMinions = 
    from(employees)
    .where(function(emp){
        return davidsMinionsIds.indexOf(emp.id) != -1;
    })
    .all();
```

(To be continued... and improved...)

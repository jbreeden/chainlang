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

// Accepts a variable number of arrays, and appends each element
// of each array onto this._subject
fromSpec.union = function(){
    for(var arg = 0; arg < arguments.length; ++arg){
        for(var el = 0; el < arguments[arg].length; ++el){
            this._subject.push(arguments[arg][el]);
        }
    }
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

fromSpec.take = function(count){
    this._return(this._subject.slice(0, count));
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

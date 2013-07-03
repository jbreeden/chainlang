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
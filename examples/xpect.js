var chainlang = require('../chainlang.js');

const SUCCESS = undefined;

var xpect = {};

xpect.to = {};
xpect.to.be = {
    _invoke: beEqual,
    ok: ok,
    an: expectAn(),
    a: expectA()
};
xpect.to.equal = xpect.to.be;

xpect.not = {};
xpect.not.to = xpect.to.not = {
    _wrapper: notWrapper,
    be: xpect.to.be,
    equal: xpect.to.equal
};

module.exports = chainlang.create(xpect);

function ok(){
    this._data.expectation = 
        createExpectation(this._subject, "to be", "truthy");

    if(!this._data.expectation.object){
        fail(expectation);
    }
    this._return(undefined);
}

function beEqual(expected){
    var expectation = this._data.expectation = 
        createExpectation(this._subject, "to be", expected);

    expectation.failIf(!(this._subject === expected));
    this._return(undefined);
}

function expectA(){
    return function(type){
        // Need to call with chain context
        expectType.call(this, type, 'a');
    }
}

function expectAn(){
    return function(type){
        // Need to call with chain context
        expectType.call(this, type, 'an');
    }
}

function expectType(type, indefiniteArticle){
    var expectation = this._data.expectation = 
        createExpectation(this._subject, "to be " + indefiniteArticle, type);

    type = (type === 'array') ? 'Array' : type;

    if((typeof this._subject !== type)
        && (this._subject.constructor.name !== type))
    {
        expectation.fail();
    }

    this._return(undefined);
}

function notWrapper(callback){
    try{
        result = callback();
    }
    catch(ex){
        this._return(undefined);
        return;
    }
    this._data.expectation.verb = "not " + this._data.verb;
    this._data.expectation.fail();
}

function createExpectation(object, verb, expected){
    var expectation = { object: object, verb: verb, expected: expected};

    expectation.failIf = function(cond){
        if(cond){
            this.fail();
        }
    };

    expectation.fail = function(){
        throw "xpected " + this.object + " " + this.verb + " " + this.expected;
    };

    return expectation;
}
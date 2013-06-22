var chainlang = require('../chainlang.js');

const SUCCESS = undefined;

var xpect = {};

xpect.to = {
    eql: eql
};
xpect.to.be = {
    _invoke: beEqual,
    ok: ok,
    an: expectAn(),
    a: expectA(),
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

function eql(expected){
    var expectation = this._data.expectation =
        createExpectation(this._subject, "to sort of equal", expected);

    if(!areEql(this._subject, expected)){
        expectation.fail();
    }
    this._return(undefined);
}

function objEquiv (a, b) {
    if (a === null || a === undefined || b === null || b === undefined)
      return false;
    // an identical "prototype" property.
    if (a.prototype !== b.prototype) return false;

    try{
      var ka = Object.keys(a),
        kb = Object.keys(b),
        key, i;
    } catch (e) {//happens when one is a string literal and the other isn't
      return false;
    }
    // having the same number of owned properties (keys incorporates hasOwnProperty)
    if (ka.length != kb.length)
      return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i])
        return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i];
      if (!areEql(a[key], b[key]))
         return false;
    }
    return true;
}

function areEql(actual, expected) {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
      return true;
    } else if ('undefined' != typeof Buffer
      && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {

      if (actual.length != expected.length) return false;

      for (var i = 0; i < actual.length; i++) {
        if (actual[i] !== expected[i]) return false;
      }

      return true;

    } else if (typeof actual != 'object' && typeof expected != 'object') {
      return actual == expected;
    } else {
      return objEquiv(actual, expected);
    }
};

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

    if((typeof this._subject === type)
        || (this._subject.constructor.name === type)
        || (this._subject.constructor === type))
    {
        this._return(undefined);
        return;
    }
    expectation.fail();
}

function notWrapper(nested){
    try{
        result = nested();
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
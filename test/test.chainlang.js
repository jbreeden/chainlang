var chainlang = require('../chainlang'),
    expect = require('expect.js'),
    _ = require('underscore'),
    sinon = require('sinon');

describe('chainlang.create(lang)', function(){
    it('requires exactly one argument', function(){
        expect(callCreateWithNoArgs).to.throwException();
        expect(callCreateWithTwoArgs).to.throwException();
    });

	it('returns a chain constructor for the new language', function(){
        var newLang = chainlang.create({});
        expect(newLang).to.be.a('function');
    });
});

describe('A chain constructor returned from chainlang.create', function(){
    it('constructs a chain object with a method by the same name for each method on the object passed to create', function(){
        var chainConstructor = chainlang.create(stubLang);
        var chain = chainConstructor();

        expect(allMethodKeysMatch(stubLang, chain)).to.be(true);
    });
});

describe('A chain object', function(){
    it('contains a _prev property that contains the return value of the last function in the chain', function(){
        var chain = chainlang.create(
            {
                returnsOne: function(){return 1;},
                returnsTwo: function(){return 2;}
            });

        chainObject = chain().returnsOne();
        expect(chainObject._prev).to.be(1);
        expect(chainObject.returnsTwo()._prev).to.be(2);
    });

    it('contains a _data property which can be used to pass data through the chain and is initally an empty object', function(){
        var chainObject = chainlang.create({})();
        expect(chainObject).to.have.key('_data');

        var hasOwnKey = false;
        for(var key in chainObject._data){
            if(chainObject._data.hasOwnProperty(key)){
                hasOwnKey = true;
            }
        }
        expect(hasOwnKey).to.be(false);
    });

    
});

var stubLang = 
{ 
    oneFn: function(){ return 1; },
    twoFn: function(){ return 2; },
    oneField: 1
};

function allMethodKeysMatch(obj1, obj2){
    var methodsInObj1 = getMethodNames(obj1);
    var methodsInObj2 = getMethodNames(obj2);

    var foundMismatch = 
        _.some(methodsInObj1, function(name){
            _.indexOf(methodsInObj2, name) == -1;
        });

    return !foundMismatch;
}

function getMethodNames(obj){
    _.pluck(_.filter(_.pairs(obj), pairRepresentsMethod), 0);
}

function pairRepresentsMethod(pair){
    return (typeof pair[1] === 'function') ? true : false;
}

function callCreateWithNoArgs(){
    return chainlang.create();
}

function callCreateWithTwoArgs(){
    return chainlang.create({}, {});
}
var chainlang = require('../chainlang'),
    expect = require('expect.js'),
    _ = require('underscore'),
    sinon = require('sinon');

describe('chainlang.create(lang)', function(){
    it('requires exactly one argument (representing the new chain language)', function(){
        expect(callCreateWithNoArgs).to.throwException();
        expect(callCreateWithTwoArgs).to.throwException();
    });

	it('returns a chain constructor for the new language', function(){
        var newLang = chainlang.create({});
        expect(newLang).to.be.a('function');
    });
});

describe('A chain constructor returned from chainlang.create', function(){
    it('Accepts an optional argument, and throws if more than one argument is provided', function(){
        var chain = chainlang.create({});

        expect(
            function(){chain();}
        ).not.to.throwException();
        expect(
            function(){chain({});}
        ).not.to.throwException();
        expect(
            function(){chain({}, {});}
        ).to.throwException();
    });

    it('constructs a chain object whose structure mirrors the language passed to chainlang.create', function(){
        var stubLang = {
            topLevelFn: function(){},
            topLevelProp: "someValue",
            secondLevel: {
                fn: function(){},
                prop: "someValue",
                thirdLevel: {
                    fn: function(){},
                    prop: "someValue"
                }
            }
        }

        var chainConstructor = chainlang.create(stubLang);
        var chain = chainConstructor();

        expect(allFieldsOfFirstAppearInSecond(stubLang, chain)).to.be(true);
    });
});

describe('A chain object', function(){
    it('contains a _prev property that always contains the return value of the last function in the chain', function(){
        var chain = chainlang.create(
            {
                returnsOne: function(){return 1;},
                returnsTwo: function(){return 2;}
            });

        link = chain().returnsOne();
        expect(link._prev).to.be(1);
        expect(link.returnsTwo()._prev).to.be(2);
    });

    it('contains a _data property (which can be used to pass data through the chain)', function(){
        var link = chainlang.create({})();
        expect(link).to.have.key('_data');

        var hasOwnKey = false;
        for(var key in link._data){
            if(link._data.hasOwnProperty(key)){
                hasOwnKey = true;
            }
        }
        expect(hasOwnKey).to.be(false);
    });

    it('contains a _subject property, which references the optional parameter to the chain constructor if supplied', function(){
        var chain = chainlang.create({});
        var actualSubject = {iAm: "theSubject"};

        expect(
            chain(actualSubject)._subject
        ).to.be.eql(actualSubject);
    });

    it('allows chaining of methods arbitrarily nested within properties of the language', function(){
        var chain = chainlang.create(
            {
                topLevelFn : function(){
                    return 1;
                },
                secondLevel : {
                    fn : function (){
                        return this._prev + 1;
                    },
                    thirdLevel : {
                        fn : function(){
                            return this._prev + 1;
                        }
                    }                    
                }
            });

        expect(
            chain().topLevelFn()._prev
        ).to.be(1);

        expect(
            chain().topLevelFn().secondLevel.fn()._prev
        ).to.be(2);

        expect(
            chain().topLevelFn().secondLevel.thirdLevel.fn()._prev
        ).to.be(2);

        expect(
            chain().topLevelFn().secondLevel.fn().secondLevel.thirdLevel.fn()._prev
        ).to.be(3);
    });

    it('is bound to "this" for every method call in the chain, even for methods of child objects', function(){
        var spy = sinon.spy();

        var chain = chainlang.create({
            topLevelFn: spy,
            secondLevel: {
                secondLevelFn: spy
            }
        });

        var link = chain().topLevelFn().secondLevel.secondLevelFn();

        expect(spy.thisValues[0]).to.be.eql(link);
        expect(spy.thisValues[1]).to.be.eql(link);
    });
});

describe('The _data property of a chain', function(){
    it('is initally an empty object', function(){
        var chain = chainlang.create({});
        expect(chain()._data).to.be.eql({});
    });

    it('persists for the life of the chain, and so can be used to share data between non-adjacent links in the chain', function(){
        var chain = chainlang.create({
            setsData : function(){
                this._data.field = 1;
            },
            doesNothing : function(){
                return;
            },
            readsAndReturnsData: function(){
                return this._data.field;
            }
        });

        expect(
            chain().setsData().doesNothing().readsAndReturnsData()._prev
        ).to.be(1);
    });
});

function allFieldsOfFirstAppearInSecond(obj1, obj2){
    var props1 = [];
    getAllPropertyNameStrings(props1, obj1, "");
    var props2 = [];
    getAllPropertyNameStrings(props2, obj2, "");

    var allMatch = true;
    props1.forEach(function(prop1){
        var foundMatch = false;
        props2.forEach(function(prop2){
            foundMatch = (foundMatch || (prop1 == prop2));
        });
        allMatch = allMatch && foundMatch;
    });

    return allMatch;
}

function getAllPropertyNameStrings(found, obj, prefix){
    prefix = prefix || "";
    for(var key in obj){
        if(obj.hasOwnProperty(key)){
            found.push(prefix + key);
            if((typeof obj[key] == 'object')){
                getAllPropertyNameStrings(found, obj[key], prefix + key + ".");    
            }
        }
    }
}

function callCreateWithNoArgs(){
    return chainlang.create();
}

function callCreateWithTwoArgs(){
    return chainlang.create({}, {});
}
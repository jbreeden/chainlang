var chainlang = require('../chainlang'),
    expect = require('expect.js'),
    _ = require('underscore'),
    sinon = require('sinon');

describe('chainlang.create(lang)', function(){
    it('requires exactly one argument (representing the new chain language)', function(){
        expect(callCreateWithNoArgs).to.throwException();
        expect(callCreateWithTwoArgs).to.throwException();
    });

	it('returns a chain function for the new language, used to start chained expressions', function(){
        var newLang = chainlang.create({});
        expect(newLang).to.be.a('function');
    });
});

describe('chainlang.append(obj, path, node)', function(){
    it('Adds descendant nodes and all required ancestors to an object (like mkdirp)', function(){
        var manualCreation = {};
        manualCreation.has = {};
        manualCreation.has.a = {};
        manualCreation.has.a.greatGrandchild = 1;
        
        var convenientCreation = {};
        chainlang.append(convenientCreation, 'has.a.greatGrandchild', 1);
        
        expect(manualCreation).to.eql(convenientCreation);
    });
});

describe('A chain function returned from chainlang.create', function(){
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

    it('Starts a chain of methods bound to a chain object with proxied version of all the language spec fields', function(){
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

        expect(allFieldsOfFirstAppearInSecond(stubLang, chainConstructor())).to.be(true);
    });
});

describe('A chain object', function(){
    it('Implicitly returns itself from all decendant methods', function(){
        var chain = chainlang.create({
            returnsScalar: function(){
                return 1;
            },
            levelTwo: {
                returnsScalar: function(){
                    return 2;
                }
            }
        });
        
        expect(
            chain().returnsScalar()
        ).to.eql(
            chain()
        );
        
        expect(
            chain().levelTwo.returnsScalar()
        ).to.eql(
            chain()
        );
    });
    
    it('contains a "this._link.breaks.chain" method that prevents the implicit return of the chain object', function(){
        var chain = chainlang.create({
            iBreakTheChain: function(){
                this._link.breaks.chain();
                return 'some scalar';
            }
        });
        
        expect(
            chain().iBreakTheChain()
        ).to.eql("some scalar")
    });

    it('contains a "_prev" property that always contains the return value of the last function in the chain', function(){
        var chain = chainlang.create(
            {
                returnsOne: function(){ return 1; },
                returnsTwo: function(){ return 2; },
                breaksAndReturnsPrev: function(){
                    this._link.breaks.chain();
                    return this._prev;
                }
            });

        expect(
            chain().returnsOne().breaksAndReturnsPrev()
        ).to.be(1);
        expect(
            chain().returnsTwo().breaksAndReturnsPrev()
        ).to.be(2);
    });

    it('contains a "_data" property which can be used to pass data through the chain and is initially empty', function(){
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

    it('contains a "_subject" property, which references the optional parameter to the chain function', function(){
        var chain = chainlang.create({
            getSubject: function(){
                this._link.breaks.chain();
                return this._subject;
            }
        });
        
        var actualSubject = {iAm: "theSubject"};

        expect(
            chain(actualSubject).getSubject()
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
        
        var theChain = chain();
        
        // Running some methods to spy on their `this` value
        chain().topLevelFn().secondLevel.secondLevelFn();

        expect(spy.thisValues[0]).to.be.eql(theChain);
        expect(spy.thisValues[1]).to.be.eql(theChain);
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

describe('Any node in the chain object graph', function(){
    it('may include child nodes, even if it is a method', function(){
        var spy = sinon.spy();
        
        var chainSpec = {};
        chainSpec.prop = spy; /* spy is a function, so prop is a method */
        chainSpec.prop.methodsStillAvailable = function(){
            this._link.breaks.chain();
            return true;
        }
        
        var chain = chainlang.create(chainSpec);

        chain().prop();

        expect(spy.called).to.be(true);
        expect(chain().prop.methodsStillAvailable()).to.be(true);
    });
});

describe('Any method in the language spec', function(){
    it('may call `this._link.binds.to` to return an object than the root of the chain object instead of the root', function(){
        var rangeSpec = {
            from: function(num){
                this._data.from = num;

                // `this._link.binds.to` itself to expose its children
                // as the next possible calls in the chain
                this._link.binds.to(this.from);
            }
        };

        rangeSpec.from.to = function(num){
            this._link.breaks.chain();

            var result = [];
            for(i = this._data.from; i <= num; ++i){
                result.push(i);
            }

            return result;
        }

        var range = chainlang.create(rangeSpec);

        expect(
            range().from(2).to(7)
        ).to.eql(
            [2, 3, 4, 5, 6, 7]
        );
    })
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

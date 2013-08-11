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
    
    it('is called implicitly by the first method invocation if not directly invoked', function(){
        var iGetCalledImplicitly = {
            ifYouCallMe: function(){
                return true;
            }
        };
        
        iGetCalledImplicitly = chainlang.create(iGetCalledImplicitly);
        
        expect(
            iGetCalledImplicitly.ifYouCallMe()
        ).to.be(true);
    });
});

describe('A chain object', function(){
    it('Implicitly returns itself from all decendant methods', function(){
        var chain = chainlang.create({
            returnsNothing: function(){
                return;
            },
            levelTwo: {
                returnsNothing: function(){
                    return;
                }
            }
        });
        
        expect(
            chain().returnsNothing()
        ).to.eql(
            chain()
        );
        
        expect(
            chain().levelTwo.returnsNothing()
        ).to.eql(
            chain()
        );
    });
    
    it('Will return any explicit return value instead of returning itself implicitly', function(){
        var chain = chainlang.create({
            returnsSomething: function(){
                return 'something';
            }
        });
        
        expect(
            chain().returnsSomething()
        ).to.eql("something")
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
                addOne : function(){
                    this._subject = this._subject + 1;
                },
                secondLevel : {
                    addOne : function (){
                        this._subject = this._subject + 1;
                    },
                    thirdLevel : {
                        addOne : function(){
                            this._subject = this._subject + 1;
                        }
                    }                    
                }
            });

        expect(
            chain(1).addOne()._subject
        ).to.be(2);

        expect(
            chain(1).addOne().secondLevel.addOne()._subject
        ).to.be(3);

        expect(
            chain(1).addOne().secondLevel.thirdLevel.addOne()._subject
        ).to.be(3);

        expect(
            chain(1).addOne().secondLevel.addOne().secondLevel.thirdLevel.addOne()._subject
        ).to.be(4);
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
            chain().setsData().doesNothing().readsAndReturnsData()
        ).to.be(1);
    });
});

describe('Any node in the chain object graph', function(){
    it('may include child nodes, even if it is a method', function(){
        var spy = sinon.spy();
        
        var chainSpec = {};
        chainSpec.prop = spy; /* spy is a function, so prop is a method */
        chainSpec.prop.methodsStillAvailable = function(){
            return true;
        }
        
        var chain = chainlang.create(chainSpec);

        chain().prop();

        expect(spy.called).to.be(true);
        expect(chain().prop.methodsStillAvailable()).to.be(true);
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

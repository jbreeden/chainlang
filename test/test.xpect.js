var xpect = require("../examples/xpect.js"),
    expect = require("expect.js");

describe("xpect vs expect api comparison", function(){

    //ok: asserts that the value is truthy or not

    test("xpect(1).to.be.ok()");
    test("xpect(true).to.be.ok()");
    test("xpect({}).to.be.ok()");
    test("xpect(0).to.not.be.ok()");

    //be / equal: asserts === equality

    test("xpect(1).to.be(1)");
    test("xpect(NaN).not.to.equal(NaN)");
    test("xpect(1).not.to.be(true)");
    test("xpect('1').to.not.be(1)");

    //eql: asserts loose equality that works with objects

    test("xpect({ a: 'b' }).to.eql({ a: 'b' })");
    test("xpect(1).to.eql('1')");

    //a/**an**: asserts typeof with support for array type and instanceof

    test("xpect(5).to.be.a('number')");
    test("xpect([]).to.be.an('array')");
    test("xpect([]).to.be.an('object')");
    

//    test("xpect(5).to.be.a(Number)");  ** EXPECT.JS DOES NOT SUCCEED AS EXPECTED **
    test("xpect([]).to.be.an(Array)");

    // test("xpect(program.version).to.match(/[0-9]+\.[0-9]+\.[0-9]+/)");
    
    // test("xpect([1, 2]).to.contain(1)");
    // test("xpect('hello world').to.contain('world')");
    
    // //length: asserts array .length

    // test("xpect([]).to.have.length(0)");
    // test("xpect([1,2,3]).to.have.length(3)");
    
    // //empty: asserts that an array is empty or not

    // test("xpect([]).to.be.empty()");
    // test("xpect({}).to.be.empty()");
    // test("xpect({ length: 0, duck: 'typing' }).to.be.empty()");
    // test("xpect({ my: 'object' }).to.not.be.empty()");
    // test("xpect([1,2,3]).to.not.be.empty()");
    
    // //property: asserts presence of an own property (and value optionally)

    // test("xpect(window).to.have.property('expect')");
    // test("xpect(window).to.have.property('expect', expect)");
    // test("xpect({a: 'b'}).to.have.property('a')");
    
    // //key/**keys**: asserts the presence of a key. Supports the only modifier

    // test("xpect({ a: 'b' }).to.have.key('a')");
    // test("xpect({ a: 'b', c: 'd' }).to.only.have.keys('a', 'c')");
    // test("xpect({ a: 'b', c: 'd' }).to.only.have.keys(['a', 'c'])");
    // test("xpect({ a: 'b', c: 'd' }).to.not.only.have.key('a')");
    
    // //throwException/**throwError**: asserts that the Function throws or not when called

    // test("xpect(fn).to.throwError()");
    // test(
    //       "expect(fn).to.throwException(function (e) {"
    //     +     "expect(e).to.be.a(SyntaxError);"
    //     + "});");

    // test("xpect(fn).to.throwException(/matches the exception message/)");
    // test("xpect(fn2).to.not.throwException()");
    
    // //withArgs: creates anonymous function to call fn with arguments

    // test("xpect(fn).withArgs(invalid, arg).to.throwException()");
    // test("xpect(fn).withArgs(valid, arg).to.not.throwException()");
    
    // //within: asserts a number within a range

    // test("xpect(1).to.be.within(0, Infinity)");
    
    // //greaterThan/**above**: asserts >

    // test("xpect(3).to.be.above(0)");
    // test("xpect(5).to.be.greaterThan(3)");
    
    // //lessThan/**below**: asserts <

    // test("xpect(0).to.be.below(3)");
    // test("xpect(1).to.be.lessThan(3)");
    
    // //fail: explicitly forces failure.

    // test("xpect().fail()");
    // test("xpect().fail('Custom failure message')");
});

function test(testCase){
    it(testCase, function(){
        compare(testCase);
    })
}

function compare(expr){
    expect(resultOf(expr)).to.be(resultOf("e" + expr));
}

function resultOf(exprString){
    try{
        eval(exprString);
        return "Success";
    }
    catch(ex){
        return "Exception";
    }
}
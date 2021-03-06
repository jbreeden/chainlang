var expect = require('expect.js');
var from = require('../examples/from');

describe('take', function(){
    it('returns at most "count" elements', function(){
        expect(

            from([1, 2, 3]).take(2)

        ).to.eql([1, 2]);
    });

    it('returns all the elements if count is higher than _subject.length', function(){
        expect(

            from([1, 2, 3]).take(5)

        ).to.eql([1, 2, 3]);
    })
});

describe('take.all', function(){
    it('returns all of the elements', function(){
        expect(

            from([1, 2, 3]).take.all()

        ).to.eql([1, 2, 3]);
    });
});

describe('take.first', function(){
    it('return the first element', function(){
        expect(

            from([1, 2, 3]).take.first()

        ).to.eql(1);
    });
});

describe('take.last', function(){
    it('return the last element', function(){
        expect(

            from([1, 2, 3]).take.last()

        ).to.eql(3);
    });
});

describe('where', function(){
    it('filters the elements of _subject by it\'s "cond" argument', function(){
        expect(

            from([1, 2, 3])
            .where(function(el){return el % 2 == 0;})
            .take.all()

        ).to.eql([2]);
    });
});

describe('select', function(){
    it('accepts a projector function to map each element to a new object', function(){
        expect(

            from([1, 2, 3])
            .select(function(el){
                return el * 2;
            }).take.all()

        ).to.eql([2, 4, 6]);
    });

    it('accepts any number of string arguments to project by field names', function(){
        expect(
            from([
                { name: 'john', id: 1},
                { name: 'larry', id: 2}
            ])
            .select("name")
            .take.all()
        ).to.eql([{name: 'john'}, {name: 'larry'}]);
    });
});

describe('union', function(){
    it('accepts any number of array arguments and concatenates all of their elements onto _subject', function(){
        expect(

            from([1, 2])
            .union([3, 4], [5, 6])
            .take.all()

        ).to.eql([1, 2, 3, 4, 5, 6]);
    });
});

describe('left.join(right).on(key)', function(){
    var left = [
        { id: 1, name: 'left'},
        { id: 2, name: 'left'}
    ];

    var right = [
        { id: 1, name: 'right'},
        { id: 3, name: 'right'}
    ];

    it('makes a left outter join of _subject with "right" where _subject[key] and right[key] match', function(){
        var result = 
            from(left)
            .left.join(right)
            .on('id')
            .take.all();
        
        expect(result.length).to.be(2);
        result.forEach(function(el){
            if(el.left.id == 1){
                expect(el.right.id).to.be(1);
            } else if (el.left.id == 2){
                expect(el.right).to.eql(null);
            }
            else{
                expect().fail("Join result should only have elements with left.id 1|2");
            }
        });
    });
});


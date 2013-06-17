var chainlang = require('./chainlang.js');

var chain = chainlang.create({
    not: {
        _filter: function(){
            this._return = !(this._return);
        },

        returnTrue: function(){
            this._return = true;
        }
    }
});

chain().not.returnTrue();
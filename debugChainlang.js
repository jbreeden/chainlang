var chainlang = require('./chainlang.js');

var chain = chainlang.create(
    {
        fn: function(){return 1;},
        prop: {
            propFn: function(){
                return this._prev + 1;
            }
        }
    });

chain().prop.propFn();
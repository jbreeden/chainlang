module.exports = createProxy;

function createProxy(obj, proxy, methodWrapper){
    // Normalize parameters
    if (arguments.length === 2 && typeof proxy === 'function') {
        // Proxy was omitted, create default object
        methodWrapper = proxy;
        proxy = {};
    } else if (arguments.length === 2 && typeof proxy === 'object') {
        // methodWrappCallback was omitted, create default. (Essentially a mixin)
        methodWrapper = defaultMethodWrapper;
    } else if (arguments.length === 1) {
        // Only the source object provided, use default proxy & method wrapper (Essentially a deep copy)
        methodWrapper = defaultMethodWrapper;
        proxy = {};
    }
    
    createProxyNode(obj, proxy, methodWrapper);
    
    return proxy;
}

function createProxyNode(obj, node, methodWrapper){
    Object.keys(obj).forEach(function(key){
        if(obj[key] === undefined || obj[key] === null){
           return;
        }

        if(typeof obj[key] == 'function'){
            node[key] = methodWrapper(obj[key], key);
            createProxyNode(obj[key], node[key], methodWrapper);
        }
        else if(typeof obj[key] == 'object'){
            node[key] = {};
            createProxyNode(obj[key], node[key], methodWrapper);
        }
        else{
            node[key] = obj[key];
        }
    });
}

function defaultMethodWrapper (fn) {
    return fn;
}

// If this module is run directly, we'll just execute a quick test

if(require.main === module){
    test();
}

function test(){
    var methodWrapper = function(fn, name){
        return function(){
            console.log(name + ' called with: \n' + 
                Array.prototype.slice.call(arguments).join('\n'));
            fn.apply(this, arguments);
        }
    };
    
    var target = {
        log: function(){ console.log('Target Method'); }
    };
    
    var proxy = createProxy(target, methodWrapper);
    
    target.log();
    proxy.log('some', 'args');
}
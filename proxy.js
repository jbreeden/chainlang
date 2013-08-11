var proxy = {};

module.exports = proxy;

proxy.createProxy = function createProxy(obj, proxy, methodWrapper){
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
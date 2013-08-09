var childProc = require('child_process');
var fs = require('fs');
var handlebars = require('handlebars');

namespace('docs', function(){
    desc('Makes sure folder ../chainlang-gh-pages exists. (This is where we will copy documentation)');
    directory('chainlang-gh-pages');

    desc('Makes sure folder ../chainlang-gh-pages/spec exists. (This location will hold mocha doc output from tests)');
    directory('chainlang-gh-pages/spec');

    desc('Makes sure folder ../chainlang-gh-pages/source exists. (This location will hold the docco output for chainlang)');
    directory('chainlang-gh-pages/source');
    
    desc('Makes sure folder ../chainlang-gh-pages/fromjs exists. (This location will hold the docco output for fromjs)');
    directory('chainlang-gh-pages/fromjs');
    
    desc('Makes all the documentation');
    task('all', ['chainlang-docco', 'chainlang-spec', 'fromjs-docco']);

    desc('Generates documentation for from.js with docco');
    task('fromjs-docco', ['chainlang-gh-pages', 'chainlang-gh-pages/fromjs'], function(){
        childProc.exec('docco -o ./chainlang-gh-pages/fromjs/ ./examples/from.js');
    });
    
    desc('Generates documentation for chainlang.js with docco');
    task('chainlang-docco', ['chainlang-gh-pages', 'chainlang-gh-pages/source'], function(){
        childProc.exec('docco -o ./chainlang-gh-pages/source/ ./chainlang.js');
    });

    desc('Makes gets the doc output from mocha for chainlang.js and adds some style');
    task('chainlang-spec', ['chainlang-gh-pages', 'chainlang-gh-pages/spec'], function(){
        
        var specHtml, template;

        // Get the mocha output
        childProc.exec('mocha --reporter doc ./test/test.chainlang.js', function(err, stdout, stderr){
            specHtml = stdout;
            compileHandlebarsTemplate();
        });

        // Compile the handlebars template
        function compileHandlebarsTemplate(){
            fs.readFile('./templates/mocha-doc-layout.handlebars', {encoding: 'utf8'}, function(error, contents){
                template = handlebars.compile(contents);
                writeFile();
            });
        }

        // Write the spec.html file
        function writeFile(){
            var html = template({body: specHtml});
            fs.writeFile('./chainlang-gh-pages/spec/spec.html', html, function(){
                process.exit(0);
            })
        }

    });
});

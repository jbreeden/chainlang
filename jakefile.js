var exec = require('child_process').exec;
var fs = require('fs');
var handlebars = require('handlebars');

namespace('docs', function(){
    desc('Makes sure folder ../chainlang-gh-pages exists. (This is where we will copy documentation)');
    directory('chainlang-gh-pages');

    directory('chainlang-gh-pages/spec');

    desc('Makes gets the doc output from mocha for chainlang.js and adds some style');
    task('spec', ['chainlang-gh-pages', 'chainlang-gh-pages/spec'], function(){
        
        var specHtml, template;

        // Get the mocha output
        exec('mocha --reporter doc ./test/test.chainlang.js', function(error, stdout, stderr){
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
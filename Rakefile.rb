require 'erb'

namespace :docs do
  directory 'chainlang-gh-pages'
  directory 'chainlang-gh-pages/spec'
  directory 'chainlang-gh-pages/source'
  directory('chainlang-gh-pages/fromjs');
  
  desc 'Makes all the documentation'
  task 'all' => ['chainlang-docco', 'chainlang-spec', 'fromjs-docco']

  desc 'Generates documentation for from.js with docco'
  task 'fromjs-docco' => ['chainlang-gh-pages', 'chainlang-gh-pages/fromjs'] do
    sh 'docco -o ./chainlang-gh-pages/fromjs/ ./examples/from.js'
  end
  
  desc 'Generates documentation for chainlang.js with docco'
  task 'chainlang-docco' => ['chainlang-gh-pages', 'chainlang-gh-pages/source'] do
    sh 'docco -o ./chainlang-gh-pages/source/ ./chainlang.js'
  end

  desc 'Generates spec page from mocha for chainlang.js'
  task 'chainlang-spec' => ['chainlang-gh-pages', 'chainlang-gh-pages/spec'] do
      body = `mocha --reporter doc ./test/test.chainlang.js`
      template = ERB.new(File.read('./templates/mocha-doc-layout.erb'))
      html = template.result(binding)
      puts html
      File.open('./chainlang-gh-pages/spec/spec.html', 'w') do |file|
        file.puts(html)
      end
  end
end
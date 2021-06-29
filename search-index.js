crystal_doc_search_index_callback({"repository_name":"for","body":"![for.cr CI](https://img.shields.io/github/workflow/status/wyhaines/for.cr/for.cr%20CI?style=for-the-badge&logo=GitHub)\n[![GitHub release](https://img.shields.io/github/release/wyhaines/for.cr.svg?style=for-the-badge)](https://github.com/wyhaines/for.cr/releases)\n![GitHub commits since latest release (by SemVer)](https://img.shields.io/github/commits-since/wyhaines/for.cr/latest?style=for-the-badge)\n\n# for\n\nThis little shard implements a couple macros for additional for-loop-like looping constructs.\n\nIt implements a simple declarative style for-like iteration loop called `iterate`, which traverses all of the elements of a collection, passing each in turn to the provided block. It also implements a C-style `for` looping construct, which can be assigned to a variable for execution later (or for repeated execution), with *initialization*, *test*, and *update* code lines, and a body that runs as a closure with its own lexical scope.\n\nThe C-style loop structure is useful. You can use it to make your code more terse. So, you can type this:\n\n```crystal\nrequire \"prime\"\nrequire \"for\"\n\nprime = uninitialized Int32\ndo_until({max = 2147483647}, ->(){prime.prime?}, {prime = rand(max)})\n\nputs \"random prime number: #{prime}\"\n```\n\nInstead of typing this (which is basically what is generated from the above code):\n\n\n```crystal\nrequire \"prime\"\nrequire \"for\"\n\nprime = uninitialized Int32\n->() do\n  max = 2147483647\n  loop do\n    prime = rand(max)\n    break if prime.prime?\n  end\nend.call\n\nputs \"random prime number: #{prime}\"\n```\n\nBecause *for* loops are encapsulated inside of a *Proc* closure, you can also assign them to variables, pass them around, call them at will, and reuse them. This has a lot of potential uses. Consider the following for one of them:\n\n```crystal\nrequire \"for\"\nrequire \"http/server\"\n\njobs = [] of HTTP::Server::Context\nhandlers = [] of Proc(Nil)\nqueue = Channel(Tuple(HTTP::Server::Context?, Channel(Nil))).new(1000)\n\n8.times do\n  handlers << for(\n    {counter = 1},\n    ->{ tup = queue.receive? },\n    {counter += 1},\n    run: false) do\n    puts \"REQ #{counter} -- #{tup[0]}\"\n    tup[1].send(nil)\n  end\nend\n\nserver = HTTP::Server.new do |context|\n  pong = Channel(Nil).new\n  queue.send({context, pong})\n  pong.receive # Worker has finished; return response\nend\n\nspawn(name: \"work loop\") do\n  handlers.each { |handler| spawn(name: \"worker\") { handler.call } }\nend\n\nserver.bind_tcp 8080\nserver.listen\n```\n\nThat code simulates an HTTP server that accepts requests, each of which represents a job of some sort to be handled by a worker, and 8 workers, implemented as C-style *for* loops running in fibers.\n\n\n## Installation\n\n1. Add the dependency to your `shard.yml`:\n\n   ```yaml\n   dependencies:\n     for:\n       github: wyhaines/for.cr\n   ```\n\n2. Run `shards install`\n\n## Usage\n\n```crystal\nrequire \"for\"\n```\n\nThis defines four macros at the top level.\n\n### using\n\nThe first is `using TARGET`, which is a syntactic sugar macro. `using foo` results in inserting `foo` where it is executed.\n\nThis means that the following are equivalent:\n\n```crystal\nfor(count, ary) { puts count }\n\nfor(count, using ary) { puts count }\n```\n\nAnd the following is acceptable syntax:\n\n```crystal\nary = (1..10).to_a\n\npp using ary\n```\n\n### iterate\n\nThe second is a *for* style loop, called *iterate*, that iterates over all of the members of a collection.\n\n```crystal\nary = [1, 2, 3]\n\niterate(num, using ary) { puts num }\n\n# This is the same as:\n\nary.each { |num| puts num }\n```\n\nThis works with any collection that has an `#each` method.\n\n### for\n\nThe third structure is a C-style *for* loop.\n\n_for(*initialization*, *test*, *update*) { # block contents to iterate on }_\n\nThe *initialization*, *test, and *update* items are code that will be evaluated\nduring the execution of the loop. The code should be provided as either a *String*\nor a *Proc(Nil, Nil)*.\n\nThe *initialization* code gets executed a single time, before the loop starts, and\ncan be used to setup any state that is required before the loop runs.\n\nThe *test* code will be evaluated at the start of each iteration. If it evaluates to\n*false*, then the loop body will execute. If it evaluates to *true* then the loop\nexits immediately.\n\nThe *update* code executes after the loop body, and can be used to change counters\nor other state that the *test* code may depend on to determine if the loop has finished\nexecution.\n\nThis structure could be legitimately useful. The loop so created is a closure, and\ncan be captured in a variable.\n\n```crystal\n# Specify code with strings.\nfor(%(t = 0), %( t < 10), %(t += 1)) do\n  # Do Stuff\nend\n```\n\n```crystal\n# Specify code with procs, and leverage the fact that it is a closure.\nt = uninitialized Int32\nfor(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }) do\n  # Do Stuff\nend\nputs t\n# => 10\n```\n\n```crystal\n# The *for* loop can be assigned to a variable and called later.\nary = (1..10).to_a\n\nt = uninitialized Int32\ntransform = for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }, run: false) { ary[t] = ary[t] * ary[t] }\n\n# Do some stuff here...\n\ntransform.call\n\npp ary\n# => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]\n```\n\n### do_until\n\nThe `do_until` loop is like the `for` loop, except that it is an exit-controlled loop. This means that the condition to test for exiting the loop is checked at the end of the loop body instead of at the beginning of the loop body. This guarantees that the loop body will execute at least one time. Additionally, the loop will be exited _when_ the condition is true.\n\nThus, it is functionally the opposite of a *for* loop.\n\n```crystal\nt = uninitialized Int32\ndo_until(->(){ t = 1 }, ->(){ t > 0 }, ->{ t += 1}) {puts t}\n\n# => 1\n\nputs t\n\n# => 2\n\n```\n\n# Other Information\n\nThere is also an [article on The Relicans that might have some additional context and details about how this shard works](https://www.therelicans.com/wyhaines/stretching-the-language-with-macros-implementing-a-for-loop-in-crystal-2c8k).\n## Contributing\n\n1. Fork it (<https://github.com/wyhaines/for.cr/fork>)\n2. Create your feature branch (`git checkout -b my-new-feature`)\n3. Commit your changes (`git commit -am 'Add some feature'`)\n4. Push to the branch (`git push origin my-new-feature`)\n5. Create a new Pull Request\n\n## Contributors\n\n- [Kirk Haines](https://github.com/wyhaines) - creator and maintainer\n\n![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/wyhaines/for.cr?style=for-the-badge)\n![GitHub issues](https://img.shields.io/github/issues/wyhaines/for.cr?style=for-the-badge)\ngit@github.com:h2o/picohttpparser.git","program":{"html_id":"for/toplevel","path":"toplevel.html","kind":"module","full_name":"Top Level Namespace","name":"Top Level Namespace","abstract":false,"superclass":null,"ancestors":[],"locations":[],"repository_name":"for","program":true,"enum":false,"alias":false,"aliased":null,"aliased_html":null,"const":false,"constants":[],"included_modules":[],"extended_modules":[],"subclasses":[],"including_types":[],"namespace":null,"doc":null,"summary":null,"class_methods":[],"constructors":[],"instance_methods":[],"macros":[{"id":"do_until(init=&quot;&quot;,test=&quot;&quot;,update=&quot;&quot;,run=true,&blk)-macro","html_id":"do_until(init=&amp;quot;&amp;quot;,test=&amp;quot;&amp;quot;,update=&amp;quot;&amp;quot;,run=true,&amp;blk)-macro","name":"do_until","doc":"The `do_until` loop is like the `for` loop, except that it is an exit-controlled loop.\nThis means that the condition to test for exiting the loop is checked at the end of the\nloop body instead of at the beginning of the loop body. This guarantees that the loop\nbody will execute at least one time. Additionally, the loop will be exited _when_ the\ncondition is true.\n\nThus, it is functionally the opposite of a *for* loop.\n\n```\nt = uninitialized Int32\ndo_until(->{ t = 1 }, ->{ t > 0 }, ->{ t += 1 }) { puts t }\n\n# => 1\n\nputs t\n\n# => 2\n```\n","summary":"<p>The <code><a href=\"toplevel.html#do_until(init=&quot;&quot;,test=&quot;&quot;,update=&quot;&quot;,run=true,&blk)-macro\">do_until</a></code> loop is like the <code><a href=\"toplevel.html#for(init=&quot;&quot;,test=&quot;&quot;,update=&quot;&quot;,run=true,&blk)-macro\">for</a></code> loop, except that it is an exit-controlled loop.</p>","abstract":false,"args":[{"name":"init","doc":null,"default_value":"\"\"","external_name":"init","restriction":""},{"name":"test","doc":null,"default_value":"\"\"","external_name":"test","restriction":""},{"name":"update","doc":null,"default_value":"\"\"","external_name":"update","restriction":""},{"name":"run","doc":null,"default_value":"true","external_name":"run","restriction":""}],"args_string":"(init = <span class=\"s\">&quot;&quot;</span>, test = <span class=\"s\">&quot;&quot;</span>, update = <span class=\"s\">&quot;&quot;</span>, run = <span class=\"n\">true</span>, &blk)","location":{"filename":"src/for/do_until.cr","line_number":20,"url":null},"def":{"name":"do_until","args":[{"name":"init","doc":null,"default_value":"\"\"","external_name":"init","restriction":""},{"name":"test","doc":null,"default_value":"\"\"","external_name":"test","restriction":""},{"name":"update","doc":null,"default_value":"\"\"","external_name":"update","restriction":""},{"name":"run","doc":null,"default_value":"true","external_name":"run","restriction":""}],"double_splat":null,"splat_index":null,"block_arg":{"name":"blk","doc":null,"default_value":"","external_name":"blk","restriction":""},"visibility":"Public","body":"  ->() do\n    \n{{ (init.is_a?(ProcLiteral) ? init.body : init).id }}\n\n    loop do\n      \n{{ blk.is_a?(Nop) ? \"\".id : blk.body.id }}\n\n      \n{{ (update.is_a?(ProcLiteral) ? update.body : update).id }}\n\n\n      break if \n{{ (test.is_a?(ProcLiteral) ? test.body : test).id }}\n\n    \nend\n  \nend\n{{ run ? \".call\".id : \"\".id }}\n\n\n"}},{"id":"for(init=&quot;&quot;,test=&quot;&quot;,update=&quot;&quot;,run=true,&blk)-macro","html_id":"for(init=&amp;quot;&amp;quot;,test=&amp;quot;&amp;quot;,update=&amp;quot;&amp;quot;,run=true,&amp;blk)-macro","name":"for","doc":"This `for` implementation provides a C-like looping structure.\n\n_for(*initialization*, *test*, *update*) { # block contents to iterate on }_\n\nThe *initialization*, *test, and *update* items are code that will be evaluated\nduring the execution of the loop. The code should be provided as either a *String*\nor a *Proc(Nil, Nil)*.\n\nThe *initialization* code gets executed a single time, before the loop starts, and\ncan be used to setup any state that is required before the loop runs.\n\nThe *test* code will be evaluated at the start of each iteration. If it evaluates to\n*false*, then the loop body will execute. If it evaluates to *true* then the loop\nexits immediately.\n\nThe *update* code executes after the loop body, and can be used to change counters\nor other state that the *test* code may depend on to determine if the loop has finished\nexecution.\n\nThis structure could be legitimately useful. The loop so created is a closure, and\ncan be captured in a variable.\n\n```\n# Specify code with strings.\nfor(%(t = 0), %( t < 10), %(t += 1)) do\n  # Do Stuff\nend\n```\n\n```\n# Specify code with procs, and leverage the fact that it is a closure.\nt = uninitialized Int32\nfor(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }) do\n  # Do Stuff\nend\nputs t\n# => 10\n```\n\n```\n# The *for* loop can be assigned to a variable and called later.\nary = (1..10).to_a\n\nt = uninitialized Int32\ntransform = for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }, run: false) { ary[t] = ary[t] * ary[t] }\n\n# Do some stuff here...\n\ntransform.call\n\npp ary\n# => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]\n```\n","summary":"<p>This <code><a href=\"toplevel.html#for(init=&quot;&quot;,test=&quot;&quot;,update=&quot;&quot;,run=true,&blk)-macro\">for</a></code> implementation provides a C-like looping structure.</p>","abstract":false,"args":[{"name":"init","doc":null,"default_value":"\"\"","external_name":"init","restriction":""},{"name":"test","doc":null,"default_value":"\"\"","external_name":"test","restriction":""},{"name":"update","doc":null,"default_value":"\"\"","external_name":"update","restriction":""},{"name":"run","doc":null,"default_value":"true","external_name":"run","restriction":""}],"args_string":"(init = <span class=\"s\">&quot;&quot;</span>, test = <span class=\"s\">&quot;&quot;</span>, update = <span class=\"s\">&quot;&quot;</span>, run = <span class=\"n\">true</span>, &blk)","location":{"filename":"src/for/for.cr","line_number":55,"url":null},"def":{"name":"for","args":[{"name":"init","doc":null,"default_value":"\"\"","external_name":"init","restriction":""},{"name":"test","doc":null,"default_value":"\"\"","external_name":"test","restriction":""},{"name":"update","doc":null,"default_value":"\"\"","external_name":"update","restriction":""},{"name":"run","doc":null,"default_value":"true","external_name":"run","restriction":""}],"double_splat":null,"splat_index":null,"block_arg":{"name":"blk","doc":null,"default_value":"","external_name":"blk","restriction":""},"visibility":"Public","body":"  ->() do\n    \n{{ (init.is_a?(ProcLiteral) ? init.body : init).id }}\n\n    while \n{{ (test.is_a?(ProcLiteral) ? test.body : test).id }}\n\n      \n{{ blk.is_a?(Nop) ? \"\".id : blk.body.id }}\n\n      \n{{ (update.is_a?(ProcLiteral) ? update.body : update).id }}\n\n    \nend\n  \nend\n{{ run ? \".call\".id : \"\".id }}\n\n\n"}},{"id":"iterate(*elements,&blk)-macro","html_id":"iterate(*elements,&amp;blk)-macro","name":"iterate","doc":"This is a *for* style loop that iterates over all of the members of a collection.\n\n```\nary = [1, 2, 3]\n\niterate(num, using ary) { puts num }\n\n# This is the same as:\n\nary.each { |num| puts num }\n```\n\nThis works with any collection that has an `#each` method.\n","summary":"<p>This is a <em>for</em> style loop that iterates over all of the members of a collection.</p>","abstract":false,"args":[{"name":"elements","doc":null,"default_value":"","external_name":"elements","restriction":""}],"args_string":"(*elements, &blk)","location":{"filename":"src/for/iterate.cr","line_number":15,"url":null},"def":{"name":"iterate","args":[{"name":"elements","doc":null,"default_value":"","external_name":"elements","restriction":""}],"double_splat":null,"splat_index":0,"block_arg":{"name":"blk","doc":null,"default_value":"","external_name":"blk","restriction":""},"visibility":"Public","body":"  \n{% target = elements[-1] %}\n\n  \n{{ target }}\n.each do |\n{{ (elements[0..-2].join(\", \")).id }}\n|\n    \n{{ blk.body.id }}\n\n  \nend\n\n"}},{"id":"using(target)-macro","html_id":"using(target)-macro","name":"using","doc":"Syntactic sugar macro. `using foo` results in inserting `foo` where it is executed.\nThis means that the following are equivalent:\n\n```\nfor(count, ary) { puts count }\n\nfor(count, using ary) { puts count }\n```\n","summary":"<p>Syntactic sugar macro.</p>","abstract":false,"args":[{"name":"target","doc":null,"default_value":"","external_name":"target","restriction":""}],"args_string":"(target)","location":{"filename":"src/for/using.cr","line_number":10,"url":null},"def":{"name":"using","args":[{"name":"target","doc":null,"default_value":"","external_name":"target","restriction":""}],"double_splat":null,"splat_index":null,"block_arg":null,"visibility":"Public","body":"  \n{{ target }}\n\n\n"}}],"types":[{"html_id":"for/For","path":"For.html","kind":"module","full_name":"For","name":"For","abstract":false,"superclass":null,"ancestors":[],"locations":[{"filename":"src/for/version.cr","line_number":1,"url":null}],"repository_name":"for","program":false,"enum":false,"alias":false,"aliased":null,"aliased_html":null,"const":false,"constants":[{"id":"VERSION","name":"VERSION","value":"\"0.2.1\"","doc":null,"summary":null}],"included_modules":[],"extended_modules":[],"subclasses":[],"including_types":[],"namespace":null,"doc":null,"summary":null,"class_methods":[],"constructors":[],"instance_methods":[],"macros":[],"types":[]}]}})
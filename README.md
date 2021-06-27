![for.cr CI](https://img.shields.io/github/workflow/status/wyhaines/for.cr/for.cr%20CI?style=for-the-badge&logo=GitHub)
[![GitHub release](https://img.shields.io/github/release/wyhaines/for.cr.svg?style=for-the-badge)](https://github.com/wyhaines/for.cr/releases)
![GitHub commits since latest release (by SemVer)](https://img.shields.io/github/commits-since/wyhaines/for.cr/latest?style=for-the-badge)

# for

This little shard implements a couple macros for additional for-loop-like looping constructs.

It implements a simple declarative style for-like iteration loop called `iterate`, which traverses all of the elements of a collection, passing each in turn to the provided block. It also implements a C-style `for` looping construct, which can be assigned to a variable for execution later (or for repeated execution), with *initialization*, *test*, and *update* code lines, and a body that runs as a closure with its own lexical scope.

The C-style loop structure is useful. You can use it to make your code more terse. So, you can type this:

```crystal
require "prime"
require "for"

prime = uninitialized Int32
do_until({max = 2147483647}, ->(){prime.prime?}, {prime = rand(max)})

puts "random prime number: #{prime}"
```

Instead of typing this (which is basically what is generated from the above code):


```crystal
require "prime"
require "for"

prime = uninitialized Int32
->() do
  max = 2147483647
  loop do
    prime = rand(max)
    break if prime.prime?
  end
end.call

puts "random prime number: #{prime}"
```

Because *for* loops are encapsulated inside of a *Proc* closure, you can also assign them to variables, pass them around, call them at will, and reuse them. This has a lot of potential uses. Consider the following for one of them:

```crystal
require "for"
require "http/server"

jobs = [] of HTTP::Server::Context
handlers = [] of Proc(Nil)
queue = Channel(Tuple(HTTP::Server::Context?, Channel(Nil))).new(1000)

8.times do
  handlers << for(
    {counter = 1},
    ->{ tup = queue.receive? },
    {counter += 1},
    run: false) do
    puts "REQ #{counter} -- #{tup[0]}"
    tup[1].send(nil)
  end
end

server = HTTP::Server.new do |context|
  pong = Channel(Nil).new
  queue.send({context, pong})
  pong.receive # Worker has finished; return response
end

spawn(name: "work loop") do
  handlers.each { |handler| spawn(name: "worker") { handler.call } }
end

server.bind_tcp 8080
server.listen
```

That code simulates an HTTP server that accepts requests, each of which represents a job of some sort to be handled by a worker, and 8 workers, implemented as C-style *for* loops running in fibers.


## Installation

1. Add the dependency to your `shard.yml`:

   ```yaml
   dependencies:
     for:
       github: wyhaines/for.cr
   ```

2. Run `shards install`

## Usage

```crystal
require "for"
```

This defines four macros at the top level.

### using

The first is `using TARGET`, which is a syntactic sugar macro. `using foo` results in inserting `foo` where it is executed.

This means that the following are equivalent:

```crystal
for(count, ary) { puts count }

for(count, using ary) { puts count }
```

And the following is acceptable syntax:

```crystal
ary = (1..10).to_a

pp using ary
```

### iterate

The second is a *for* style loop, called *iterate*, that iterates over all of the members of a collection.

```crystal
ary = [1, 2, 3]

iterate(num, using ary) { puts num }

# This is the same as:

ary.each { |num| puts num }
```

This works with any collection that has an `#each` method.

### for

The third structure is a C-style *for* loop.

_for(*initialization*, *test*, *update*) { # block contents to iterate on }_

The *initialization*, *test, and *update* items are code that will be evaluated
during the execution of the loop. The code should be provided as either a *String*
or a *Proc(Nil, Nil)*.

The *initialization* code gets executed a single time, before the loop starts, and
can be used to setup any state that is required before the loop runs.

The *test* code will be evaluated at the start of each iteration. If it evaluates to
*false*, then the loop body will execute. If it evaluates to *true* then the loop
exits immediately.

The *update* code executes after the loop body, and can be used to change counters
or other state that the *test* code may depend on to determine if the loop has finished
execution.

This structure could be legitimately useful. The loop so created is a closure, and
can be captured in a variable.

```crystal
# Specify code with strings.
for(%(t = 0), %( t < 10), %(t += 1)) do
  # Do Stuff
end
```

```crystal
# Specify code with procs, and leverage the fact that it is a closure.
t = uninitialized Int32
for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }) do
  # Do Stuff
end
puts t
# => 10
```

```crystal
# The *for* loop can be assigned to a variable and called later.
ary = (1..10).to_a

t = uninitialized Int32
transform = for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }, run: false) { ary[t] = ary[t] * ary[t] }

# Do some stuff here...

transform.call

pp ary
# => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

### do_until

The `do_until` loop is like the `for` loop, except that it is an exit-controlled loop. This means that the condition to test for exiting the loop is checked at the end of the loop body instead of at the beginning of the loop body. This guarantees that the loop body will execute at least one time. Additionally, the loop will be exited _when_ the condition is true.

Thus, it is functionally the opposite of a *for* loop.

```crystal
t = uninitialized Int32
do_until(->(){ t = 1 }, ->(){ t > 0 }, ->{ t += 1}) {puts t}

# => 1

puts t

# => 2

```

## Contributing

1. Fork it (<https://github.com/wyhaines/for.cr/fork>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Contributors

- [Kirk Haines](https://github.com/wyhaines) - creator and maintainer

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/wyhaines/for.cr?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/wyhaines/for.cr?style=for-the-badge)

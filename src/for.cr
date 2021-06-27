module For
  VERSION = "0.2.0"
end

# Syntactic sugar macro. `using foo` results in inserting `foo` where it is executed.
# This means that the following are equivalent:
#
# ```
# for(count, ary) { puts count }
#
# for(count, using ary) { puts count }
# ```
#
macro using(target)
  {{ target }}
end

# This is a *for* style loop that iterates over all of the members of a collection.
#
# ```
# ary = [1, 2, 3]
#
# iterate(num, using ary) { puts num }
#
# # This is the same as:
#
# ary.each { |num| puts num }
# ```
#
# This works with any collection that has an `#each` method.
#
macro iterate(*elements, &blk)
  {%
    target = elements[-1]
  %}
  {{ target }}.each do |{{ elements[0..-2].join(", ").id }}|
    {{ blk.body.id }}
  end
end

# This `for` implementation provides a C-like looping structure.
#
# _for(*initialization*, *test*, *update*) { # block contents to iterate on }_
#
# The *initialization*, *test, and *update* items are code that will be evaluated
# during the execution of the loop. The code should be provided as either a *String*
# or a *Proc(Nil, Nil)*.
#
# The *initialization* code gets executed a single time, before the loop starts, and
# can be used to setup any state that is required before the loop runs.
#
# The *test* code will be evaluated at the start of each iteration. If it evaluates to
# *false*, then the loop body will execute. If it evaluates to *true* then the loop
# exits immediately.
#
# The *update* code executes after the loop body, and can be used to change counters
# or other state that the *test* code may depend on to determine if the loop has finished
# execution.
#
# This structure could be legitimately useful. The loop so created is a closure, and
# can be captured in a variable.
#
# ```
# # Specify code with strings.
# for(%(t = 0), %( t < 10), %(t += 1)) do
#   # Do Stuff
# end
# ```
#
# ```
# # Specify code with procs, and leverage the fact that it is a closure.
# t = uninitialized Int32
# for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }) do
#   # Do Stuff
# end
# puts t
# # => 10
# ```
#
# ```
# # The *for* loop can be assigned to a variable and called later.
# ary = (1..10).to_a
#
# t = uninitialized Int32
# transform = for(->{ t = 0 }, ->{ t < 10 }, ->{ t += 1 }, run: false) { ary[t] = ary[t] * ary[t] }
#
# # Do some stuff here...
#
# transform.call
#
# pp ary
# # => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
# ```
#
macro for(init = "", test = "", update = "", run = true, &blk)
  ->() do
    {{ (init.is_a?(ProcLiteral) ? init.body : init).id }}
    while {{ (test.is_a?(ProcLiteral) ? test.body : test).id }}
      {{ blk.is_a?(Nop) ? "".id : blk.body.id }}
      {{ (update.is_a?(ProcLiteral) ? update.body : update).id }}
    end
  end{{ run ? ".call".id : "".id }}
end

# The `do_until` loop is like the `for` loop, except that it is an exit-controlled loop.
# This means that the condition to test for exiting the loop is checked at the end of the
# loop body instead of at the beginning of the loop body. This guarantees that the loop
# body will execute at least one time. Additionally, the loop will be exited _when_ the
# condition is true.
#
# Thus, it is functionally the opposite of a *for* loop.
#
# ```
# t = uninitialized Int32
# do_until(->{ t = 1 }, ->{ t > 0 }, ->{ t += 1 }) { puts t }
#
# # => 1
#
# puts t
#
# # => 2
# ```
#
macro do_until(init = "", test = "", update = "", run = true, &blk)
  ->() do
    {{ (init.is_a?(ProcLiteral) ? init.body : init).id }}
    loop do
      {{ blk.is_a?(Nop) ? "".id : blk.body.id }}
      {{ (update.is_a?(ProcLiteral) ? update.body : update).id }}

      break if {{ (test.is_a?(ProcLiteral) ? test.body : test).id }}
    end
  end{{ run ? ".call".id : "".id }}
end

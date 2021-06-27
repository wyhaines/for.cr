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

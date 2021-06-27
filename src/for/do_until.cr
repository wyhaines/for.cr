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
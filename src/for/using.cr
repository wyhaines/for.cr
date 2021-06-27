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

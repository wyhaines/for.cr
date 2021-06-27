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

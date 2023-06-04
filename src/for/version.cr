module For
  {% begin %}
  VERSION = {{ read_file("#{__DIR__}/../../VERSION").chomp }}
  {% end %}
end

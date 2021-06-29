require "../src/for"
require "http/server"

jobs = [] of HTTP::Server::Context
handlers = [] of Proc(Nil)
queue = Channel(Tuple(HTTP::Server::Context?, Channel(Nil))).new(1000)

4.times do
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

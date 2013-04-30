var MemcacheStream = require('../lib/memcachestream')
  , test = require('tap').test

test("send messages in memcache style", function(t) {
  var stream = require('stream').PassThrough()
    , memcache = MemcacheStream(stream)
    , chunk

  memcache.send(["set", "key", "value"])
  chunk = stream.read()
  t.equals(chunk.toString(), "set key value\r\n", "sends an array as a command")

  memcache.send("RAW STRING")
  chunk = stream.read()
  t.equals(chunk.toString(), "RAW STRING\r\n", "sends a raw string")

  memcache.send(Buffer("RAW BUFFER"))
  chunk = stream.read()
  t.equals(chunk.toString(), "RAW BUFFER\r\n", "sends a raw buffer")

  t.end()
})

test("receive memcache messages", function(t) {
  var stream = require('stream').PassThrough()
    , memcache = MemcacheStream(stream)

  stream.write("VALUE key value 11\r\n")
  memcache.recv(function(err, msg, key, value, length) {
    t.error(err, "should get no error")
    t.equals(msg, "VALUE")
    t.equals(key, "key")
    t.equals(value, "value")
    t.equals(length, "11")
  })

  stream.write("RAW\r\nBUFFER\r\n")
  memcache.recv(11, function(err, buffer) {
    t.error(err, "should get no error")
    t.equals(buffer.toString(), "RAW\r\nBUFFER", "captures buffer with delimiter")
  })

  stream.write("RAW BUFFER\r\n")
  memcache.recv(5, function(err, buffer) {
    t.equals(err.name, "WrongBufferLength", "gets right error")
    t.equals(buffer.toString(), "RAW BUFFER", "still gets the buffer")
  })

  stream.write("SERVER_ERROR entity too large\r\n")
  memcache.recv(function(err, buffer) {
    t.equals(err.name, "SERVER_ERROR", "gets error type")
    t.equals(err.message, "entity too large", "gets error message")
    t.type(buffer, 'undefined', 'no response')
    t.end()
  })
})

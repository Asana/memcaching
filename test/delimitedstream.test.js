var DelimitedStream = require('../lib/delimitedstream')
  , test = require('tap').test
  , PassThrough = require('stream').PassThrough

test("read delimited messages", function(t) {
  var stream = PassThrough()
    , testStream = DelimitedStream(stream, "----")

  testStream.recv(function(err, msg1) {
    t.error(err, "no error")
    t.equal(msg1.toString(), "msg1\r\nmsg1", "msg1 should be intact")
    testStream.recv(12, function(err, msg2) {
      t.error(err, "no error")
      t.equal(msg2.toString(), "msg2----msg2", "msg2 should be intact")
      t.end()
    })
  })

  setTimeout(function() {
    stream.write("msg1\r\nms")
    setTimeout(function() {
      stream.write("g1----msg2----msg2")
      setTimeout(function() {
        stream.write("----")
      }, 5)
    }, 5)
  }, 5)
})

test("process messages in-order", function(t) {
  var stream = PassThrough()
    , testStream = DelimitedStream(stream, " ")

  stream.write("hello ")

  testStream.recv(11, function(err, msg1) {
    t.error(err, "no error")
    t.equal(msg1.toString(), "hello world", "msg1 should arrive first")
  })

  testStream.recv(function(err, msg2) {
    t.error(err, "no error")
    t.equal(msg2.toString(), "this", "msg2 should arrive second")
    t.end()
  })

  setTimeout(function() {
    stream.write("world this is a stream of text")
  }, 5)
})

test("write delimited messages", function(t) {
  var stream = PassThrough()
    , testStream = DelimitedStream(stream, "----")

  testStream.send("foobar")
  testStream.send("hello")

  var chunk = stream.read().toString()

  t.equal(chunk, "foobar----hello----")
  t.end()
})

test("handle errors in the stream", function(t) {
  var stream = PassThrough()
    , testStream = DelimitedStream(stream, "----")

  testStream.recv(function(err, msg1) {
    t.error(err, "no error")
    t.equal(msg1.toString(), "msg1", "msg1 should be intact")
    testStream.recv(function(err, msg2) {
      t.equal(err, "something bad happened", "got error")
      t.type(msg2, 'undefined', "no response")
      t.end()
    })
  })

  stream.write("msg1----")
  stream.emit('error', "something bad happened")
})

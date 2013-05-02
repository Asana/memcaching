var GetCommand = require('../../lib/commands/get')
  , test = require('tap').test
  , Responder = require('../responder')

test("get", function(t) {
  var responder = new Responder

  GetCommand({
    verb: "get", keys: "foobar"
  }, responder.respond(
    null, 'VALUE', 'foobar', '0', '11'
  ).respond(function(bytes, cb) {
    t.same(bytes, 11)
    cb(null, "hello world")
  }).respond(
    null, "END"
  ), function(err, result) {
    t.error(err)
    t.same(responder.input, [['get', 'foobar']])
    t.same(result, [['foobar', 'hello world', 0]])
    t.end()
  })
})

test("mget", function(t) {
  var responder = new Responder

  GetCommand({
    verb: "get", keys: ["foo", "bar"]
  }, responder.respond(
    null, 'VALUE', 'foo', '0', '11'
  ).respond(function(bytes, cb) {
    t.same(bytes, 11)
    cb(null, "hello world")
  }).respond(
    null, 'VALUE', 'bar', '5', '2'
  ).respond(function(bytes, cb) {
    t.same(bytes, 2)
    cb(null, "hi")
  }).respond(
    null, "END"
  ), function(err, result) {
    t.error(err)
    t.same(responder.input, [['get', 'foo', 'bar']])
    t.same(result, [
           ['foo', 'hello world', 0],
           ['bar', 'hi', 5]
    ])
    t.end()
  })
})

test("gets", function(t) {
  var responder = new Responder

  GetCommand({
    verb: "gets", keys: "foobar"
  }, responder.respond(
    null, 'VALUE', 'foobar', '0', '11', '3341'
  ).respond(function(bytes, cb) {
    t.same(bytes, 11)
    cb(null, "hello world")
  }).respond(
    null, "END"
  ), function(err, result) {
    t.error(err)
    t.same(responder.input, [['gets', 'foobar']])
    t.same(result, [['foobar', 'hello world', 0, '3341']])
    t.end()
  })
})

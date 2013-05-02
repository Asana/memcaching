var IncrementCommand = require('../../lib/commands/incr')
  , test = require('tap').test
  , Responder = require('../responder')

test("decr", function(t) {
  var responder = Responder()

  IncrementCommand({
    verb: "decr", key: "foobar", increment: 2
  }, responder.respond(
    null, '9'
  ), function(err, msg) {
    t.error(err)
    t.same(responder.input, [["decr", "foobar", 2]])
    t.equals(msg, 9)
    t.end()
  })
})

test("incr", function(t) {
  var responder = Responder()

  IncrementCommand({
    verb: "incr", key: "foobar", increment: 2
  }, responder.respond(
    null, '13'
  ), function(err, msg) {
    t.error(err)
    t.same(responder.input, [["incr", "foobar", 2]])
    t.equals(msg, 13)
    t.end()
  })
})

test("incr noreply", function(t) {
  var responder = Responder()

  IncrementCommand({
    verb: "incr", key: "foobar", increment: 2, noreply: true
  }, responder, function(err, msg) {
    t.error(err)
    t.same(responder.input, [["incr", "foobar", 2, "noreply"]])
    t.false(msg)
    t.end()
  })
})

test("incr error", function(t) {
  var responder = Responder()

  IncrementCommand({
    verb: "incr", key: "foobar", increment: 2
  }, responder.respond(
    null, 'NOT_FOUND'
  ), function(err, msg) {
    t.same(responder.input, [["incr", "foobar", 2]])
    t.equals(err, "NOT_FOUND")
    t.error(msg)
    t.end()
  })
})

test("incr stream error", function(t) {
  var responder = Responder()

  IncrementCommand({
    verb: "incr", key: "foobar", increment: "blah blah"
  }, responder.respond(
    'CLIENT_ERROR invalid numeric delta argument'
  ), function(err, msg) {
    t.same(responder.input, [["incr", "foobar", "blah blah"]])
    t.equals(err, 'CLIENT_ERROR invalid numeric delta argument')
    t.error(msg)
    t.end()
  })
})

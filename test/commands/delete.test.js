var DeleteCommand = require('../../lib/commands/delete')
  , test = require('tap').test
  , Responder = require('../responder')

test("delete", function(t) {
  var responder = Responder()

  DeleteCommand({
    verb: "delete", key: "foobar"
  }, responder.respond(
    null, 'DELETED'
  ), function(err, msg) {
    t.same(responder.input, [["delete", "foobar"]])
    t.error(err)
    t.equals(msg, "DELETED")
    t.end()
  })
})

test("delete noreply", function(t) {
  var responder = Responder()

  DeleteCommand({
    verb: "delete", key: "foobar", noreply: "noreply"
  }, responder, function(err, msg) {
    t.same(responder.input, [["delete", "foobar", "noreply"]])
    t.error(err)
    t.false(msg)
    t.end()
  })
})

test("delete error", function(t) {
  var responder = Responder()

  DeleteCommand({
    verb: "delete", key: "foobar"
  }, responder.respond(
    null, "NOT_FOUND"
  ), function(err, msg) {
    t.same(responder.input, [["delete", "foobar"]])
    t.equals(err, "NOT_FOUND")
    t.false(msg)
    t.end()
  })
})

test("delete stream error", function(t) {
  var responder = Responder()

  DeleteCommand({
    verb: "delete", key: "foobar"
  }, responder.respond(
    "SERVER_ERROR"
  ), function(err, msg) {
    t.same(responder.input, [["delete", "foobar"]])
    t.equals(err, "SERVER_ERROR")
    t.false(msg)
    t.end()
  })
})

var TouchCommand = require('../../lib/commands')['touch']
  , test = require('tap').test
  , Responder = require('../responder')

test("touch", function(t) {
  var responder = new Responder

  TouchCommand({
    verb: "touch", key: "foobar", exptime: 3341
  }, responder.respond(
    null, 'TOUCHED'
  ), function(err, msg) {
    t.same(responder.input, [["touch", "foobar", 3341]])
    t.error(err)
    t.equals(msg, "TOUCHED")
    t.end()
  })
})

test("touch noreply", function(t) {
  var responder = new Responder

  TouchCommand({
    verb: "touch", key: "foobar", exptime: 3341, noreply: true
  }, responder, function(err, msg) {
    t.same(responder.input, [["touch", "foobar", 3341, "noreply"]])
    t.error(err)
    t.error(msg)
    t.end()
  })
})

test("touch error", function(t) {
  var responder = new Responder

  TouchCommand({
    verb: "touch", key: "foobar", exptime: 3341
  }, responder.respond(
    null, 'NOT_FOUND'
  ), function(err, msg) {
    t.same(responder.input, [["touch", "foobar", 3341]])
    t.equals(err, "NOT_FOUND")
    t.error(msg)
    t.end()
  })
})

test("touch stream error", function(t) {
  var responder = new Responder

  TouchCommand({
    verb: "touch", key: "foobar", exptime: 3341
  }, responder.respond(
    'SERVER_ERROR'
  ), function(err, msg) {
    t.same(responder.input, [["touch", "foobar", 3341]])
    t.equals(err, "SERVER_ERROR")
    t.error(msg)
    t.end()
  })
})

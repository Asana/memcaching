var SetCommand = require('../../lib/commands/set')
  , test = require('tap').test
  , Responder = require('../responder')

test("set", function(t) {
  var responder = Responder()

  SetCommand({
    verb: "set", key: "foobar", exptime: 3341, flags: 5, value: "hello world"
  }, responder.respond(
    null, 'STORED'
  ), function(err, msg) {
    t.same(responder.input, [["set", "foobar", 5, 3341, 11], "hello world"])
    t.error(err)
    t.equals(msg, "STORED")
    t.end()
  })
})

test("set noreply", function(t) {
  var responder = Responder()

  SetCommand({
    verb: "set", key: "foobar", exptime: 3341, flags: 5, value: "hello world", noreply: "noreply"
  }, responder, function(err, msg) {
    t.same(responder.input, [["set", "foobar", 5, 3341, 11, "noreply"], "hello world"])
    t.error(err)
    t.false(msg)
    t.end()
  })
})

test("set error", function(t) {
  var responder = Responder()

  SetCommand({
    verb: "cas", key: "foobar", exptime: 3341, flags: 5, cas: '123', value: "hello world"
  }, responder.respond(
    null, 'EXISTS'
  ), function(err, msg) {
    t.equals(err, 'EXISTS')
    t.false(msg)
    t.same(responder.input, [["cas", "foobar", 5, 3341, 11, '123'], "hello world"])
    t.end()
  })
})


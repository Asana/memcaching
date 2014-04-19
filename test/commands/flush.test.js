var FlushCommand = require('../../lib/commands')['flush_all']
  , test = require('tap').test
  , Responder = require('../responder')

test("flush", function(t) {
  var responder = new Responder

  FlushCommand({
    verb: "flush", exptime: 3341
  }, responder.respond(
    null, 'OK'
  ), function(err, msg) {
    t.same(responder.input, [["flush", 3341]])
    t.error(err)
    t.equals(msg, "OK")
    t.end()
  })
})

test("flush noreply", function(t) {
  var responder = new Responder

  FlushCommand({
    verb: "flush", exptime: 3341, noreply: true
  }, responder, function(err, msg) {
    t.same(responder.input, [["flush", 3341, "noreply"]])
    t.error(err)
    t.error(msg)
    t.end()
  })
})

test("flush error", function(t) {
  var responder = new Responder

  FlushCommand({
    verb: "flush", exptime: 3341
  }, responder.respond(
    null, 'something went wrong'
  ), function(err, msg) {
    t.same(responder.input, [["flush", 3341]])
    t.equals(err, "something went wrong")
    t.error(msg)
    t.end()
  })
})

test("flush stream error", function(t) {
  var responder = new Responder

  FlushCommand({
    verb: "flush", exptime: 3341
  }, responder.respond(
    'SERVER_ERROR'
  ), function(err, msg) {
    t.same(responder.input, [["flush", 3341]])
    t.equals(err, "SERVER_ERROR")
    t.error(msg)
    t.end()
  })
})


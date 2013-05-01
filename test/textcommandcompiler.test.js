var TextCommandCompiler = require('../lib/textcommandcompiler')
  , test = require('tap').test

function Responder() {
  this.input = []
  this.responders = []
}

Responder.prototype = {
  send: function(message) {
    console.log("send")
    this.input.push(message)
  },
  recv: function() {
    console.log("recv")
    var responder = this.responders.shift()
    return responder.apply(null, arguments)
  },
  respond: function(cb) {
    this.responders.push(cb)
  }
}

test("touch", function(t) {
  var cmd = TextCommandCompiler({
    verb: "touch", key: "foobar", exptime: 3341
  }, function(err, msg) {
    t.error(err)
    t.equals(msg, "OK")
    t.same(responder.input, [["touch", "foobar", 3341]])
  })

  var responder = new Responder
  responder.respond(function(cb) {
    cb(null, 'OK')
  })

  cmd(responder, function() {
    t.end()
  })
})

test("set", function(t) {
  var cmd = TextCommandCompiler({
    verb: "set", key: "foobar", exptime: 3341, flags: 5, value: "hello world"
  }, function(err, msg) {
    t.error(err)
    t.equals(msg, "STORED")
    t.same(responder.input, [["set", "foobar", 5, 3341, 11], "hello world"])
  })

  var responder = new Responder
  responder.respond(function(cb) {
    cb(null, 'STORED')
  })

  cmd(responder, function() {
    t.end()
  })
})

test("get", function(t) {
  var cmd = TextCommandCompiler({
    verb: "get", keys: "foobar"
  }, function(err, resp) {
    t.error(err)
    t.same(resp, [['foobar', 'hello world', 0, undefined]])
    t.same(responder.input, [['get', 'foobar']])
  })

  var responder = new Responder
  responder.respond(function(cb) {
    cb(null, 'VALUE', 'foobar', '0', '11')
  })
  responder.respond(function(bytes, cb) {
    t.same(bytes, 11)
    cb(null, "hello world")
  })
  responder.respond(function(cb) {
    cb(null, "END")
  })

  cmd(responder, function() {
    t.end()
  })
})

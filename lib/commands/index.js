var BasicCommand = require('./basic')
var SetCommand = require('./set')
var GetCommand = require('./get')

var DeleteCommand = BasicCommand("key", "DELETED")
var FlushCommand = BasicCommand("exptime", "OK")
var TouchCommand = BasicCommand("key exptime", "TOUCHED")
var IncrementCommand = BasicCommand("key increment", function(err, msg) {
  if (msg === "NOT_FOUND") throw msg
  return msg|0
})
var VersionCommand = BasicCommand("", function(err, msg, version) {
  if (err) return cb(err)
  if (msg !== 'VERSION') return cb(msg)
  cb(err, version)
})

module.exports = {
  set: SetCommand,
  add: SetCommand,
  replace: SetCommand,
  append: SetCommand,
  prepend: SetCommand,
  cas: SetCommand,

  get: GetCommand,
  gets: GetCommand,

  delete: DeleteCommand,

  incr: IncrementCommand,
  decr: IncrementCommand,

  touch: TouchCommand,

  stats: null,

  version: VersionCommand,

  flush_all: FlushCommand
}

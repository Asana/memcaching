var SetCommand = require('./commands/set')
var GetCommand = require('./commands/get')
var DeleteCommand = require('./commands/delete')
var IncrementCommand = require('./commands/incr')
var TouchCommand = require('./commands/touch')
var FlushCommand = require('./commands/flush')

module.exports = TextCommandCompiler

var commandMapping = {
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

  version: null,

  flush_all: FlushCommand
}

function TextCommandCompiler(params, cb) {
  var command = commandMapping[params.verb]

  if (!command) throw "Unsupported command: " + params.verb

  return function(stream, queue_done) {
    function done() {
      cb.apply(null, arguments)
      queue_done()
    }

    try {
      command(params, stream, done)
    } catch (e) {
      done(e)
    }
  }
}

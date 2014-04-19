var commands = require('./commands')

module.exports = TextCommandCompiler

function TextCommandCompiler(params, cb) {
  var command = commands[params.verb]

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

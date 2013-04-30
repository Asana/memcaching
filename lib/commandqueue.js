module.exports = CommandQueue

/**
 * CommandQueue manages a queue of commands to be executed on a resource.
 * Commands pushed in are themselves simply functions that take two arguments,
 * the resource and a callback for when they are finished.
 */
function CommandQueue(resource) {
  if (!(this instanceof CommandQueue))
    return new CommandQueue(resource)

  this.queue = []
  this.active = null
  this.resource = resource
}

CommandQueue.prototype = {}

/**
 * Add a command to be executed once the resource becomes available. If the queue
 * is not currently busy, immediately invoke this command.
 */
CommandQueue.prototype.push = function push(command) {
  this.queue.push(command)
  if (!this.active) this._next()
}

/**
 * Internal - run the next command, if there is one
 *
 * If there is no next command, this.active will be set to undefined, marking
 * the queue as idle
 */
CommandQueue.prototype._next = function _next() {
  var command = this.active = this.queue.shift()

  // If there is no command to run, we idle
  if (!command) return

  // When the command finishes, try to run the next command
  var me = this
  command(this.resource, function() {
    me._next()
  })
}


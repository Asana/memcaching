module.exports = Responder

function Responder() {
  if (!(this instanceof Responder))
    return new Responder

  this.input = []
  this.responders = []
}

Responder.prototype = {
  send: function(message) {
    this.input.push(message)
  },
  recv: function() {
    var responder = this.responders.shift()
    return responder.apply(null, arguments)
  },
  respond: function(response) {
    var args = arguments
    this.responders.push(
      typeof response === 'function' ?
      response :
      function(cb) { cb.apply(null, args) }
    )
    return this
  }
}

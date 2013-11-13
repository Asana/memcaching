module.exports = validate

function ValidationError(param, message) {
  if (!(this instanceof ValidationError))
    throw new ValidationError(param, message)

  this.param = param
  this.name = "Invalid arguments"
  this.message = param + " " + message
  Error.captureStackTrace(this, arguments.callee);
}
ValidationError.prototype = new Error

function MultipleValidationError(param, errors) {
  if (!(this instanceof MultipleValidationError))
    throw new MultipleValidationError(param, errors)

  this.param = param
  this.name = "Invalid arguments"
  this.params = []
  var details = []
  for (var i = 0; i < errors.length; i++) {
    this.params.push(errors[i].param)
    details.push("  " + errors[i].message.replace(/\n/g, "\n  "))
  }
  details.unshift("Validations failed for keys: " + this.params.join(' '))
  this.message = details.join("\n")
  this.errors = errors
  Error.captureStackTrace(this, arguments.callee);
}
MultipleValidationError.prototype = new ValidationError

function validate(param, value) {
  if (arguments.length === 0) throw "You must supply something to validate"
  if (arguments.length === 1) return validate.params(param)
  if (arguments.length === 2) return validate.param(param, value)
}

validate.params = function(params) {
  var errors = []
  for (var key in params) {
    if (!params.hasOwnProperty(key)) continue
    try {
      params[key] = validate.param(key, params[key])
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e
      errors.push(e)
    }
  }
  if (errors.length > 0) MultipleValidationError(null, errors)
  return params
}

validate.param = function(param, value) {
  if (!validate[param]) ValidationError(param, "is an unrecognized parameter")
  return validate[param](param, value)
}

validate.string = function(param, string) {
  if (typeof string !== 'string') ValidationError(param, "must be a string")
  if (string.match(/\s/)) ValidationError(param, "cannot contain whitespace")
  return string
}

validate.integer = function(param, integer) {
  if (integer != (integer|0)) ValidationError(param, "must be an integer")
  return integer|0
}

validate.stringArray = function(param, array) {
  if (!(array instanceof Array)) array = [array]

  var errors = []
  for (var i = 0; i < array.length; i++) {
    try {
      validate.key(param+'['+i+']', array[i])
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e
      errors.push(e)
    }
  }
  if (errors.length > 0) MultipleValidationError(param, errors)
  return array
},

    validate.buffer = function(param, buffer) {
      if (!Buffer.isBuffer(buffer)) {
        buffer = new Buffer("" + buffer)
      }
      return buffer
    }

validate.noreply = function(param, noreply) {
  return !!noreply
}

validate.cas = function(param, cas) {
  if (typeof cas !== 'string') ValidationError(param, "must be a string to avoid loss of precision, but got: " + cas + " type: " + (typeof cas))
  if (!cas.match(/^\d+$/)) ValidationError(param, "must be numeric")
  return cas
}

validate.key = validate.string
validate.verb = validate.string
validate.keys = validate.stringArray
validate.flags = validate.integer
validate.exptime = validate.integer
validate.value = validate.buffer
validate.increment = validate.integer

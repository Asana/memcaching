var validate = require('../lib/validate')
  , test = require('tap').test

test("validation cleanup", function(t) {
  var params = {
    keys: "hello",
    flags: 2,
    cas: "3321",
    value: 23,
    noreply: true
  }

  params = validate(params)

  t.same(params.keys, ["hello"])
  t.ok(Buffer.isBuffer(params.value))
  t.equal(params.value.toString(), '23')
  t.equal(params.cas, 3321)
  t.equal(params.noreply, "noreply")
  t.end()
})

test("validation errors", function(t) {
  function v(param, value, message) {
    var error
    try {
      validate(param, value)
    } catch (e) {
      error = e
    }
    t.type(error, Error)
    t.similar(error.message, message)
  }

  v('verb', 'se t', /whitespace/)
  v('key', {}, /string/)
  v('flags', {}, /integer/)
  v('blah', {}, /unrecognized/)
  v('keys', [' '], /keys\[0\].*whitespace/)
  t.end()
})

test("multiple validation errors", function(t) {
  var params = {
    verb: "se t",
    key: {},
    keys: ["foo bar", "hello", "hello world"],
    flags: "wrong flags",
    cas: 1.023,
    increment: "bah",
    blah: "foo"
  }

  var error
  try {
    validate(params)
  } catch (e) {
    error = e
  }
  t.type(error, Error)
  t.equals(error.name, "MultipleValidationError")
  t.same(error.params, ["verb", "key", "keys", "flags", "cas", "increment", "blah"])
  t.end()
})

var MemcacheClient = require('../lib/memcacheclient')
  , test = require('tap').test

console.log("This test requires a running memcache server on port 11211")

test("can talk to memcache", function(t) {
  var client = new MemcacheClient()
  client.set("foo", "bar", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "STORED", "should get result STORED for a SET")
  })
  client.set("foo", "baz", {noreply: true, flags: 1}, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get result undefined for NOREPLY")
  })
  client.get(["foo", "bar"], function(err, values) {
    t.error(err, "should get no error")
    t.type(values.foo, 'object', "should get results for key that was set")
    t.equals(values.foo.flags, 1, "should get correct flags")
    t.equals(values.foo.value.toString(), 'baz', "should get correct value")
    t.type(values.bar, 'undefined', "should get no result for key that wasn't set")
  })
  client.del("foo", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, 'DELETED', "should get DELETED on successful delete")
  })
  client.del("bar", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, 'NOT_FOUND', "should get NOT_FOUND on deleting non-existent key")
  })
  client.set("foo", "bär", {noreply: true}, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get no response on NOREPLY")
  })
  client.get("foo", function(err, value, meta) {
    t.error(err, "should get no error")
    t.equals(value, "bär", "should get the result as a string")
    t.equals(meta.flags, 0, "should get the right flags")
    t.end()
    client.close()
  })
})

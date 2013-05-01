var MemcacheClient = require('../lib/memcacheclient')
  , test = require('tap').test

console.log("This test requires a running memcache server on port 11211")

test("can talk to memcache", function(t) {
  var client = new MemcacheClient({ servers: {'127.0.0.1:11211': '10'} })
  client.prefix = "prefix:"
  client.set("foo", "bar", 3341, 0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "STORED", "should get result STORED for a SET")
  })
  client.set("foo", "baz", 3341, 1, true, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get result undefined for NOREPLY")
  })
  client.mget(["foo", "bar"], function(err, response) {
    t.error(err, "should get no error")
    t.equals(response.length, 1, "only get one response")
    t.same(response[0].slice(0,3), ["foo", "baz", 1])
  })
  client.remove("foo", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, 'DELETED', "should get DELETED on successful delete")
  })
  client.remove("bar", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, 'NOT_FOUND', "should get NOT_FOUND on deleting non-existent key")
  })
  client.set("foo", "bär", 3341, 0, true, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get no response on NOREPLY")
  })
  client.get("foo", function(err, response) {
    t.error(err, "should get no error")
    t.equals(response[0], "bär", "should get the result as a string")
    t.equals(response[1], 0, "should get the right flags")
    t.end()
    client.close()
  })
})

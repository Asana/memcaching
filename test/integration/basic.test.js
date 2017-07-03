var MemcacheClient = require('../../lib/memcacheclient')
  , MemcacheServer = require('./memcacheserver')
  , test = require('tap').test

test("can talk to memcache", function(t) {
  var server = new MemcacheServer()
  var client = new MemcacheClient({ unref: false })
  client.addServer(server.host)

  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
  })
  client.set("foo", "bar", 3341, 0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "STORED", "should get result STORED for a SET")
  })
  client.set("foo", "baz", 3341, 1, true, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get result undefined for NOREPLY")
  })
  client.mget(["foo", "bar"], function(err, result) {
    t.error(err, "should get no error")
    t.equals(result.length, 1, "only get one result")
    t.same(result[0], ["foo", "baz", 1])
  })
  client.get("bar", function(err, result) {
    t.error(err, "should get no error")
    t.type(result, "undefined", "no result")
  })
  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
  })
  client.mget(["foo", "bar"], function(err, result) {
    t.error(err, "should get no error")
    t.equals(result.length, 0, "no results after flush")
  })
  client.set("foo", "baz", 3341, 1, true, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get result undefined for NOREPLY")
  })
  client.remove("foo", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, 'DELETED', "should get DELETED on successful delete")
  })
  client.remove("bar", function(err, result) {
    t.equals(err, 'NOT_FOUND', "should get NOT_FOUND on deleting non-existent key")
    t.false(result)
  })
  client.set("foo", "bär", 3341, 0, true, function(err, result) {
    t.error(err, "should get no error")
    t.type(result, 'undefined', "should get no result on NOREPLY")
  })
  client.get("foo", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result[0], "bär", "should get the result as a string")
    t.equals(result[1], 0, "should get the right flags")
  })
  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
    client.end()
    server.end()
    t.end()
  })
})

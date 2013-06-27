var MemcacheClient = require('../../lib/memcacheclient')
  , test = require('tap').test

console.log("This test requires a running memcache server on port 11211")

test("can use prefixes correctly", function(t) {
  var client = new MemcacheClient({ unref: false })
  client.addServer({'127.0.0.1:11211': '10'})

  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
  })

  client.set("test:one", "1", 0, 0, function(err, result) {
    t.error(err, "should get no error")
  })
  client.set("test:two", "2", 0, 0, function(err, result) {
    t.error(err, "should get no error")
  })

  client.prefix = "test:"
  client.get("one", function(err, result) {
    t.error(err, "should get no error")
    t.same(result, ["1", 0])
  })
  client.mget(["one", "two", "three"], function(err, result) {
    t.error(err, "should get no error")
    t.same(result, [["one", "1", 0], ["two", "2", 0]])
  })
  client.set("three", "3", 0, 0, function(err, result) {
    t.error(err, "should get no error")
  })

  client.prefix = null
  client.get("one", function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, undefined)
  })
  client.mget(["test:one", "test:two", "one", "two"], function(err, result) {
    t.error(err, "should get no error")
    t.same(result, [["test:one", "1", 0], ["test:two", "2", 0]])
  })

  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
    client.end()
    t.end()
  })
})

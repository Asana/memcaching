var MemcacheClient = require('../../lib/memcacheclient')
  , test = require('tap').test

console.log("This test requires a running memcache server on port 11211")

test("can use cas with memcache", function(t) {
  var client = new MemcacheClient({ servers: {'127.0.0.1:11211': '10'} })

  client.flush(0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "OK", "should get result OK for a FLUSH")
  })
  client.set("foo", "bar", 3341, 0, function(err, result) {
    t.error(err, "should get no error")
    t.equals(result, "STORED", "should get result STORED for a SET")
  })
  client.cas("foo", "baz", 3341, 1, '12345', function(err, result) {
    t.equals(err, "EXISTS", "should error")
    t.error(result)
  })
  client.mgets(["foo", "bar"], function(err, result) {
    t.error(err, "should get no error")
    t.equals(result.length, 1, "only get one result")
    t.same(result[0].slice(0,3), ["foo", "bar", 0])

    var cas = result[0][3]
    t.type(cas, 'string', "cas must be a string")

    client.cas("foo", "baz", 3341, 1, cas, function(err, result) {
      t.error(err, "should get no error")
      t.equals(result, "STORED")
    })
    client.flush(0, function(err, result) {
      t.error(err, "should get no error")
      t.equals(result, "OK", "should get result OK for a FLUSH")
      client.close()
      t.end()
    })
  })
})

var ModulaServerDistribution = require('../lib/modula_server_distribution')
  , test = require('tap').test

test("ModulaServerDistribution", function(t) {
  var keys = [], servers = new ModulaServerDistribution
  for (var i = 0; i < 10; i++) keys.push("test" + i)

  function keyMap() {
    return keys.map(function (key) {
      return servers.get(key)
    }).join('')
  }

  servers.add(0)
  t.same(keyMap(), "0000000000")

  servers.add(1)
  t.same(keyMap(), "0010010001")

  servers.add(2)
  t.same(keyMap(), "0000022002")

  servers.add(3)
  t.same(keyMap(), "2212230023")

  servers.add(4)
  t.same(keyMap(), "2424143004")

  t.end()
})

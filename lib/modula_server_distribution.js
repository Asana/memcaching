var crypto = require('crypto')

function ModulaServerDistribution(servers) {
  this.servers = servers || []
  this.algorithm = 'md5'
}

ModulaServerDistribution.prototype = {}

ModulaServerDistribution.prototype.add = function add(server) {
  this.servers.push(server)
}

ModulaServerDistribution.prototype.get = function get(key) {
  return this.servers[this._hash(key) % this.servers.length]
}

ModulaServerDistribution.prototype._hash = function hash(key) {
  var digest = this._digest("" + key)
  return digest.readUInt32LE(0)
}

ModulaServerDistribution.prototype._digest = function digest(string) {
  return crypto.createHash(this.algorithm).update(string).digest();
}

module.exports = ModulaServerDistribution

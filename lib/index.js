var fs = require('fs');
var cache = require("./cache.js");
var find = require("./find.js");

var defaults = JSON.parse(fs.readFileSync(__dirname + "/../defaults.json"));

exports.cache = function(opts) {
  opts = opts || {};
  opts.limit = opts.limit || defaults.limit;
  opts.cache = opts.cache || defaults.cache;
  opts.index = opts.index || defaults.index;
  return cache.update(opts.index, opts.cache, opts.limit);
};

exports.find = function(search, opts) {
  var path = opts.cache || defaults.cache;
  return cache.entries(path)
    .then(function(xpis) {
      return find(search, xpis);
    });
};

var RSVP = require('rsvp');
var JSEmitter = require('xpi').JSEmitter;
var promise = require("./promise.js");

// FIXME: produce something like a Promise<Stream<Match>> to output incremental results

// type Matches = { fileName: path, matches: [MatchResult] }
// type MatchResult = { entry: JSEmitterJavaScriptEvent, match: number }

// (string, [path]) -> Promise<[Matches]>
function find(test, xpis) {
  return promise.throttle(200, xpis.map(function(xpi) {
    return function() {
      return find1(test, xpi);
    };
  }))
  .then(function(matches) {
    return matches.filter(function(match) { return match });
  });
}

// (string, path) -> Promise<Matches?>
function find1(test, path) {
  var matches = [];
  return new RSVP.Promise(function(resolve, reject) {
    (new JSEmitter(path))
      .on('javascript', function(js) {
        var index = js.source.indexOf(test);
        if (index > -1) {
          matches.push({ entry: js, match: index });
        }
      })
      .on('end', function() {
        resolve(matches.length > 0 ? { fileName: path, matches: matches } : null);
      })
      .on('error', function(err) {
        resolve(null);
      });
  });
}

module.exports = find;

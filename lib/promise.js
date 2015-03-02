var fs = require('fs');
var RSVP = require('rsvp');

exports.throttle = function throttle(limit, thunks) {
  return new RSVP.Promise(function(resolve, reject) {
    var length = thunks.length;
    var remaining = length;
    var next = 0;
    var active = 0;
    var results = thunks.map(function() { });
    var rejected = false;

    function resolver(i) {
      return function(result) {
        if (rejected) return;
        results[i] = result;
        remaining--;
        active--;
        if (remaining === 0)
          resolve(results);
        else
          saturate();
      };
    }

    function saturate() {
      while (!rejected && active < limit && next < length) {
        thunks[next]()
          .then(resolver(next))
          .catch(function(err) { rejected = true; reject(err) });
        next++;
        active++;
      }
    }

    saturate();
  });
};

// function download(url) {
//   console.log("download: " + url);
//   return new RSVP.Promise(function(resolve, reject) {
//     request(url, function(err, response, body) {
//       console.log("done: " + url);
//       if (err) reject(err);
//       else resolve(body);
//     });
//   });
// }

// throttle(3, [
//   function() { return download("https://people.mozilla.org/~kmaglione/latest_addons.tsv") },
//   function() { return download("https://gist.github.com/dherman/c3e7c8b058d2311aaf8e") },
//   function() { return download("https://gist.github.com/dherman/cebed8a802b6173ff92c") },
//   function() { return download("https://gist.github.com/dherman/36e9dda91a9b192c7bff") },
//   function() { return download("http://mozilla.org") },
//   function() { return download("http://wikipedia.org") },
//   function() { return download("http://google.com") },
//   function() { return download("http://calculist.org") },
//   function() { return download("http://bugs.ecmascript.org") },
//   function() { return download("http://taskjs.org") }
// ]).then(function(results) {
//   console.log("done: " + results.length);
// });

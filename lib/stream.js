var stream = require('stream');

exports.sequence = function sequence(before, after) {
  var s = new stream.PassThrough();
  before
    .then(function(result) {
      after(result)
        .on('error', function(e) { s.emit('error', e) })
        .pipe(s);
    })
    .catch(function(error) {
      s.emit("error", error);
    });
  return s;
};

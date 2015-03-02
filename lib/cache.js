var csv = require('csv-stream');
var request = require('request');
var fs = require('fs');
var fsp = require('fs-promise');
var ProgressBar = require('progress');
var RSVP = require('rsvp');
var promise = require("./promise.js");
var stream = require("./stream.js");
var inherits = require('util').inherits;

inherits(ServerError, Error);

function indexDownloadStream(index, cache) {
  return new stream.sequence(fsp.mkdirp(cache), function() {
    var bar;
    var downloadStream =
      request(index)
        .on('response', function(response) {
          bar = new ProgressBar("downloading index [:bar] :percent :etas", {
            complete: "=",
            incomplete: " ",
            width: 60,
            total: Number(response.headers['content-length'])
          });
        })
        .on('data', function(chunk) { bar.tick(chunk.length); });

    downloadStream
      .pipe(fs.createWriteStream(cache + "/.index.tsv"));

    return downloadStream;
  });
}

function indexReadStream(index, cache) {
  try {
    return fs.createReadStream(null, {
      fd: fs.openSync(cache + "/.index.tsv", 'r'),
    });
  } catch (err) {
    return indexDownloadStream(index, cache);
  }
}

function requestIndex(index, cache) {
  var rows = [];
  return new RSVP.Promise(function(resolve, reject) {
    indexReadStream(index, cache)
      .pipe(csv.createStream({ delimiter: '\t' }))
      .on('data', function(row) {
        row.file_name = row.file_url.replace(/^.*\/([^\/]*)$/, "$1");
        rows.push(row);
      })
      .on('end', function() { resolve(rows) })
      .on('error', reject);
  });
}

function ServerError(url, response) {
  var message = "error downloading " + url + ": " + response.statusMessage + " (HTTP status code " + response.statusCode + ")";
  this.message = message;
  this.url = url;
  this.statusCode = response.statusCode;
  this.statusMessage = response.statusMessage;
  this.stack = (new Error(message)).stack;
}

function checkCache(cache) {
  return function(rows) {
    var bar = new ProgressBar("checking cache    [:bar] :percent :etas", {
      complete: "=",
      incomplete: " ",
      width: 60,
      total: rows.length
    });
    return RSVP.all(rows.map(function(row) {
      var cacheDir = cache + "/" + row.addon_id;
      var fileName = cacheDir + "/" + row.file_name;
      return fsp.exists(fileName).then(function(exists) {
        bar.tick(1);
        return exists ? null : { url: row.file_url, dir: cacheDir, file: fileName };
      });
    }));
  };
}

function downloadXPI(bar, descriptor) {
  return function() {
    return (new RSVP.Promise(function(resolve, reject) {
      request(descriptor.url)
        .on('response', function(response) {
          if (response.statusCode !== 200) {
            return reject(new ServerError(descriptor.url, response));
          }

          response
            .pipe(fs.createWriteStream(descriptor.file))
            .on('finish', function() {
              bar.tick(1);
              resolve();
            })
            .on('error', reject);
        })
        .on('error', reject);
    }))
  };
}

function captureXPIError(bar, descriptor, errors) {
  return function(err) {
    errors.push({
      url: descriptor.url,
      file: descriptor.file,
      dir: descriptor.dir,
      message: err.message,
      stack: err.stack
    });

    console.log("\n\nERROR:");
    console.log(JSON.stringify({
      url: descriptor.url,
      file: descriptor.file,
      dir: descriptor.dir,
      message: err.message,
      stack: err.stack
    }));
    console.log();

    bar.tick(1);
  };
}

function CacheFillJob(needed) {
  this.errors = [];
  this.progressBar = null;
}

CacheFillJob.prototype.finishEntry = function finishEntry() {
};

CacheFillJob.prototype.failEntry = function failEntry(descriptor, error) {
  var summary = {
    url: descriptor.url,
    file: descriptor.file,
    dir: descriptor.dir,
    message: error.message,
    stack: error.stack
  };
  
};

function downloadXPIs(limit) {
  return function(needed) {
    needed = needed.filter(function(x) { return x });
    var errors = [];
    var bar = new ProgressBar("downloading xpis  [:bar] :percent :etas", {
      complete: "=",
      incomplete: " ",
      width: 60,
      total: needed.length
    });
    return promise.throttle(limit, needed.map(function(descriptor) {
      return function() {
        return fsp.mkdirp(descriptor.dir)
                 .then(downloadXPI(bar, descriptor))
                 .catch(captureXPIError(bar, descriptor, errors));
      };
    }))
    .then(function() {
      return errors;
    });
  };
}

function logErrors(errors) {
  console.log("\n\n");
  console.log("Failures:");
  console.log(JSON.stringify(errors));
}

exports.update = function update(index, cache, limit) {
  return requestIndex(index, cache)
    .then(checkCache(cache))
    .then(downloadXPIs(limit))
    .then(logErrors);
};

function subdirs(dir) {
  return fsp.readdir(dir)
           .then(function(files) {
             return RSVP.all(files.map(function(file) {
               return fsp.stat(dir + "/" + file).then(function(stats) {
                 return stats.isDirectory() ? file : null;
               });
             }));
           })
          .then(function(dirs) {
            return dirs.filter(function(dir) { return dir });
          });
}

function ls(dir, predicate) {
  predicate = predicate || function(x) { return x };
  return fsp.readdir(dir)
           .then(function(files) {
             return files.filter(predicate);
           })
}

exports.entries = function entries(cache) {
  return subdirs(cache)
           .then(function(cacheEntries) {
             return RSVP.all(cacheEntries.map(function(entryDir) {
               return ls(cache + "/" + entryDir, function(file) {
                 return /\.(zip|jar|xpi)$/.test(file);
               })
               .then(function(entries) {
                 var xpis = entries.filter(function(entry) { return entry });
                 return xpis.length > 0 ? cache + "/" + entryDir + "/" + xpis[0] : null;
               });
             }))
           })
           .then(function(cacheEntryXPIs) {
             return cacheEntryXPIs.filter(function(xpi) { return xpi });
           });
};

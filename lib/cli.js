#!/usr/bin/env node

/*
usage:
    amo cache [-l <concurrency>] [-i <index>] [<path>]
    amo find [-c <cachedir>] <string>
    amo help

options:
    -l <concurrency>  Limit maximum number of concurrent downloads (default: 200)
    -i <index>        URL for tab-separated AMO index
                        (default: https://people.mozilla.org/~kmaglione/latest_addons.tsv)
    -c <cachedir>     Path to local filesystem cache (default: ./cache)
*/

var fs = require('fs');
var docopt = require('docopt').docopt;
var amo = require("./index.js");

var usage = require('fdocopt').extract(__filename);
var version = JSON.parse(fs.readFileSync(__dirname + "/../package.json")).version;

var options = docopt(usage, { version: version, help: false });

if (options.help) {
  console.log(usage);
  process.exit(1);
} else if (options.cache) {
  amo.cache({
    limit: Number(options['-l']),
    cache: options['<path>']
  }).catch(function(err) {
    console.log("\n\n");
    console.log(err.stack);
    process.exit(1);
  });
} else if (options.find) {
  amo.find(options['<string>'], { cache: options['-c'] })
     .then(function(matches) {
       console.log(JSON.stringify(matches));
     })
     .catch(function(err) {
       console.log("\n\n");
       console.log(err.stack);
       process.exit(1);
     });
}

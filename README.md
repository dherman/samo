# amo

Search and analyze Firefox's [amo](http://addons.mozilla.org) ecosystem.

[![NPM](https://nodei.co/npm/amo.png)](https://nodei.co/npm/amo/)

So far the only functionality implemented is searching for a literal string
across all JavaScript source in the ecosystem.

# Getting started

Install an `amo` binary on your system:
```
$ npm install -g amo
```

# Command-line

```
usage:
    amo cache [-l <concurrency>] [-i <index>] [<path>]
    amo find [-c <cachedir>] <string>
    amo help

options:
    -l <concurrency>  Limit maximum number of concurrent downloads (default: 200)
    -i <index>        URL for tab-separated AMO index
                        (default: https://people.mozilla.org/~kmaglione/latest_addons.tsv)
    -c <cachedir>     Path to local filesystem cache (default: ./cache)
```

# API

## amo.cache({ limit, cache, index })

Update the local filesystem cache.

## amo.find(search, { cache })

Search the local filesystem cache.

# License

MIT

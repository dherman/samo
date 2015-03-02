# samo

Search and analyze Firefox's [amo](http://addons.mozilla.org) ecosystem.

[![NPM](https://nodei.co/npm/samo.png)](https://nodei.co/npm/samo/)

So far the only functionality implemented is searching for a literal string
across all JavaScript source in the ecosystem.

![crown](crown.jpg)

# Getting started

Install a `samo` binary on your system:
```
$ npm install -g samo
```

# Command-line

```
usage:
    samo cache [-l <concurrency>] [-i <index>] [<path>]
    samo find [-c <cachedir>] <string>
    samo help

options:
    -l <concurrency>  Limit maximum number of concurrent downloads (default: 200)
    -i <index>        URL for tab-separated AMO index
                        (default: https://people.mozilla.org/~kmaglione/latest_addons.tsv)
    -c <cachedir>     Path to local filesystem cache (default: ./cache)
```

# API

## samo.cache({ limit, cache, index })

Update the local filesystem cache.

## samo.find(search, { cache })

Search the local filesystem cache.

# License

MIT

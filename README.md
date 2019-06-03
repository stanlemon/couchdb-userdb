# CouchDB User DB

A tool for managing user specific databases in an [Apache CouchDB](http://couchdb.apache.org) tool. If you are using CouchDB and are able to flip on the "user db" setting you have no need for this tool. If you're unable to do that, don't have the plug installed or are using a provider like [Cloudant](https://www.ibm.com/cloud/cloudant) than this tool can helpful you emulate the user db functionality.

This tool will look at the *_users* database and monitor for documents and cross reference them against user specific databases (eg. *userdb-7374616e31*). In the event that a document exists in *_users* but has no corresponding database, this tool will create it.  If a *user-XXXXXXX* database exists and no corresponding document exists in the *_users* database then the database will be deleted.

When this tool is first run it will do a check of all *_users* documents and all *user-XXXXXXX* databases.  Thereafter it will subscribe to CouchDB's change stream and watch for changes to *_users* documents and act accordingly.

## Getting Started

To use this script set an environment variable *COUCHDB_URL* to your couchdb instance, using basic auth (eg. http://username:password@mycouchdb.instance).  You can also set this environment variable on the commandline when you run the script.

```shell
COUCHDB_URL=http://username:password@mycouchdb.instance npx @stanlemon/couchdb-userdb 
```

## Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

You can deploy this script to Heroku and have it manage user databases for you. Use the link above, and then make sure you adjust your scaling to create a worker dyno. By default a web dyno will be created, but it will crash as port binding does not occur.

```shell
heroku ps:scale web=0 worker=1
```

You will also need to set the `COUCHDB_URL` config variable and then restart your dyno for it to take effect.

_This works great with CouchDB instances like the ones from Cloudant!_

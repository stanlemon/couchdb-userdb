const express = require("express");
const PouchDB = require("pouchdb");
const ExpressPouchDB = require("express-pouchdb");

const TestPouchDB = PouchDB.defaults({
    adapter: "memory"
});

PouchDB.plugin(require("pouchdb-adapter-memory"));

const app = express();

const port = 3131;
const url = "http://localhost:" + port + "/";

app.use(
    "/",
    ExpressPouchDB(TestPouchDB, {
        logPath: "/tmp/pouchdb.log"
    })
);

const server = app.listen(port, () => {
    console.log("Listening " + url);
});

// Create the main database that we'll use for our connection
const db = new TestPouchDB("_users");

module.exports = { url, app, server, db };

const waitForExpect = require("wait-for-expect");
const express = require("express");
const PouchDB = require("pouchdb");
const ExpressPouchDB = require("express-pouchdb");

const { syncUserDbs, followUserDbChanges } = require("../src/couchdb-userdb");

const TestPouchDB = PouchDB.defaults({
    adapter: "memory"
});

PouchDB.plugin(require("pouchdb-adapter-memory"));

describe("couchdb-userdb", () => {
    const app = express();
    let server;

    const port = 3131;
    const url = "http://localhost:" + port + "/";

    const nano = require("nano")(url);

    beforeAll(async done => {
        app.use(
            "/",
            ExpressPouchDB(TestPouchDB, {
                logPath: "/tmp/pouchdb.log"
            })
        );

        server = app.listen(port, () => {
            // Create the main database that we'll use for our connection
            const mainDB = new TestPouchDB("main");

            done();
        });
    });

    afterAll(done => {
        server.close(() => {
            setTimeout(() => done(), 500);
        });
    });

    it("creates a database when a user doc is inserted, then deletes is", async (done) => {
        const usersDb = nano.use('_users');

        const userDoc = await usersDb.insert({
            "_id": "org.couchdb.user:test",
            "name": "test",
            "roles": [],
            "type": "user",
            "email": "test@example.com",
            "password_scheme": "pbkdf2",
            "iterations": 10,
            "derived_key": "3493e76a83f0fefc0fd771238a347563703d5ad8",
            "salt": "3680546d94bedd4bd65cdb1fa7879c0e"
        });

        console.log('my user doc', userDoc);

        await waitForExpect(async () => {
            const testUserDb = await nano.use("userdb-74657374");

            await syncUserDbs(nano);

            const info = await testUserDb.info();

            expect(info !== 'no_db_file');
        });

        await usersDb.destroy(userDoc.id, userDoc.rev);

        await waitForExpect(async () => {
            const testUserDb = await nano.use("userdb-74657374");

            await syncUserDbs(nano);

            const info = await testUserDb.info();

            expect(info === 'no_db_file');
        });

        done();
    });
});
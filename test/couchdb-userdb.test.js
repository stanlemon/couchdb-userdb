const waitForExpect = require("wait-for-expect");

const { syncUserDbs, followUserDbChanges } = require("../src/couchdb-userdb");

const { url, server } = require("./pouchdb-server");

const checkStatus = require("./checkStatus");

const nano = require("nano")(url, {
    requestDefaults: {
        timeout: 500
    }
});

describe("couchdb-userdb", () => {
    beforeAll(async () => {
        await waitForExpect(async () => {
            console.log("Checking status...");
            const status = await checkStatus(url);
            expect(status).not.toBe(false);
        })
    });

    afterAll(done => {
        server.close(() => {
            setTimeout(() => done(), 500);
        });
    });

    it("creates a database when a user doc is inserted, then deletes is", async () => {
        const allDbs = await nano.db.list();

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
    });
});
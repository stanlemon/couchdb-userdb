function makeUserDbName(username) {
    return 'userdb-' + Buffer.from(username).toString('hex');
}

function makeUserName(userDb) {
    return Buffer.from(userDb.substring(7), 'hex').toString();
}

function syncUserDbs(couchdb) {
    const userDb = couchdb.use('_users');

    Promise.all([
        // List every database on the server
        couchdb.db.list(),
        // List every document in the _users db
        userDb.list({ include_docs: true }),
    ])
        .then(([allDbs, userDocs]) => {
            return [
                // Filter our databases down to just user database
                allDbs.filter(v => v.substr(0, 7) === 'userdb-'),
                // For each document in the user database
                userDocs.rows
                    // Remove the system documents, like _design and _auth
                    .filter(doc => doc.id.substr(0, 1) !== '_')
                    // Convert the username on the document to the hash we use for user dbs
                    .map(doc => doc.doc.name),
            ];
        })
        .then(([databases, usernames]) => {
            // Create user databases for those that don't exist yet
            usernames
                .filter(
                    username => !databases.includes(makeUserDbName(username))
                )
                .forEach(username => createUserDb(couchdb, username));

            // Delete extraneous databases, ones where we don't have a user document
            databases
                .filter(db => !usernames.includes(makeUserName(db)))
                .forEach(db => destroyUserDb(couchdb, makeUserName(db)));
        })
        .catch(err => {
            console.error('An error has occurred', err);
        });
}

function followUserDbChanges(couchdb) {
    const userDb = couchdb.use('_users');
    const feed = userDb.follow({ since: 'now' });

    // Look for changes on the users database and create user dbs as we see them
    feed.on('change', change => {
        // Remove 'org.couchdb.user:' from the start of the username
        const username = change.id.substr(17);
        const isDeleted = change.deleted || false;

        console.log('Change received for user ' + username);

        // User database does not exist and this is not a delete
        if (!isDeleted) {
            createUserDb(couchdb, username);
        }

        // User database exists and this is a delete
        if (isDeleted) {
            destroyUserDb(couchdb, username);
        }
    });

    feed.follow();
}

function destroyUserDb(couchdb, username) {
    const userDb = makeUserDbName(username);

    console.log('Destroying database ' + userDb + ' for ' + username);

    couchdb.db.destroy(userDb, (err, body) => {
        if (err) {
            console.log('Error occurred during destroy', err, body);
        }
    });
}

function createUserDb(couchdb, username) {
    const userDb = makeUserDbName(username);

    console.log('Creating database ' + userDb + ' for ' + username);

    couchdb.db.create(userDb, (err, body) => {
        // 412 is precondition failed, which means the database already exists
        if (err && err.statusCode === 412) {
            console.log('Database ' + userDb + ' already exists');
            return;
        }

        // An error has occurred
        if (err) {
            console.error('An error has ocurred', err, body);
            return;
        }

        const permissions = {
            // This is here specifically for Cloudant, which will use it's own permissions system without this attribute
            couchdb_auth_only: true,
            admins: {
                names: [],
                roles: [],
            },
            members: {
                names: [makeUserName(userDb)],
                roles: [],
            },
        };

        couchdb.use(userDb).insert(permissions, '_security', (err, body) => {
            if (err) {
                console.error('An error has ocurred', err, body);
                return;
            }

            console.log('Inserting permissions for ' + userDb);
        });
    });
}

function createUser(couchdb, username, password, roles = []) {
    const userDb = couchdb.db.use('_users');

    const user = {
        _id: 'org.couchdb.user:' + username,
        name: username,
        roles,
        type: 'user',
        password,
    };

    userDb.insert(user, (err, body) => {
        if (err) {
            if (err.statusCode === 409) {
                console.log('User already exists', err);
            } else {
                console.log('An error occurred ' + err);
            }
        }

        if (!err) {
            const { id } = body;
            console.log('User created ' + id);
        }
    });
}

module.exports = {
    syncUserDbs,
    followUserDbChanges,
    createUserDb,
    destroyUserDb,
    createUser,
};

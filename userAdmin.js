const {getAuth} = require("firebase-admin/auth");
const {getDatabase} = require("firebase-admin/database");

module.exports = {
    getUserByID: function(uid) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const ref = db.ref(`/customID/${uid}`);

            ref.once("value", (snapshot) => {
                let data = snapshot.toJSON();

                if (data) { uid = data; }
            }).then(r => {
                getAuth().getUser(uid)
                    .then((userRecord) => {
                        resolve(userRecord);
                    });
            });
        });
    }
}

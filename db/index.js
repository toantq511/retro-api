const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccount.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://retro-49d98.firebaseio.com",
});

const db = admin.firestore();

module.exports = { db, admin };

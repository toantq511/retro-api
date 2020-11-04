const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const serviceAccount = require("./config/serviceAccount.json");
const jwt = require("jsonwebtoken");
const authMdw = require("./middlewares/auth.mdw");
const app = express();

app.use(express.json());
app.use(cors());

// const PORT = process.env.PORT || 8080;

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://retro-49d98.firebaseio.com",
});

const db = admin.firestore();

app.post("/api/signup", (req, res) => {
	db.collection("users")
		.where("username", "==", req.body.username)
		.get()
		.then((snapshot) => {
			console.log(req.body);
			console.log(snapshot.docs.length);
			if (snapshot.docs.length > 0)
				return res.json({
					error: { code: 500, message: "Username already exist" },
				});
			else
				db.collection("users")
					.add({
						...req.body,
						password: bcrypt.hashSync(req.body.password),
						createdAt: new Date().getTime(),
					})
					.then((value) => {
						if (value.id) res.json({ data: value.id });
						else res.json({ error: { code: 500, message: "Sign up fail" } });
					})
					.catch((err) => {
						console.log(err);
						res.json({ error: { code: 500, message: "Sign up fail" } });
					});
		});
});

app.post("/api/login", (req, res) => {
	const { username, password } = req.body;
	db.collection("users")
		.where("username", "==", username)
		.get()
		.then((snapshot) => {
			if (snapshot.docs.length > 0) {
				const matched = snapshot.docs[0];
				if (bcrypt.compareSync(password, matched.data().password))
					res.json({
						data: {
							username: matched.data().username,
							name: matched.data().name,
							token: jwt.sign(matched.data(), process.env.JWTSECRET),
						},
					});
				else res.json({ error: { code: 401, message: "Password incorrect" } });
			} else res.json({ error: { code: 401, message: "Username not exist" } });
		});
});
app.use(authMdw.getAuthentication);

const createObject = (req, data) => ({
	...data,
	createdAt: new Date().getTime(),
	createdBy: req.user.username,
	updatedAt: new Date().getTime(),
	updatedBy: req.user.username,
});

const updateObject = (req, data) => ({
	...data,
	updatedAt: new Date().getTime(),
	updatedBy: req.user.username,
});

app.get("/api/board/:id/column", (req, res) => {
	db.collection("item")
		.where("boardId", "==", req.params.id)
		.get()
		.then((snapshot) => {
			const data = snapshot.docs;
			let col1 = 0;
			let col2 = 0;
			let col3 = 0;
			data.forEach((doc) => {
				const { column } = doc.data();
				if (column === 1) col1++;
				else if (column === 2) col2++;
				else if (column === 3) col3++;
			});
			res.json({ col1, col2, col3, total: data.length });
		});
});

app.post("/api/board", (req, res) => {
	db.collection("board")
		.add(createObject(req, req.body))
		.then((value) =>
			db
				.collection("board")
				.doc(value.id)
				.get()
				.then((doc) =>
					res.json({
						data: {
							...doc.data(),
							id: doc.id,
							items: { total: 0, col1: 0, col2: 0, col3: 0 },
						},
					})
				)
		);
});

app.get("/api/board", (req, res) => {
	const { username } = req.user;
	db.collection("board")
		.where("createdBy", "==", username)
		.get()
		.then(async (boardList) => {
			const data = await Promise.all(
				boardList.docs.map(async (board) => {
					const itemList = await db
						.collection("item")
						.where("boardId", "==", board.id)
						.get();
					const list = itemList.docs.map((item) => ({
						...item.data(),
						id: item.id,
					}));
					return {
						...board.data(),
						id: board.id,
						items: {
							total: list.length,
							col1: list.filter((item) => item.column === 1).length,
							col2: list.filter((item) => item.column === 2).length,
							col3: list.filter((item) => item.column === 3).length,
						},
					};
				})
			);
			res.json({ data });
		});
});

app.get("/api/board/:id", (req, res) => {
	db.collection("board")
		.doc(req.params.id)
		.get()
		.then(async (board) => {
			if (board.exists) {
				const itemList = await db
					.collection("item")
					.where("boardId", "==", board.id)
					.get();
				const list = itemList.docs.map((item) => ({
					...item.data(),
					id: item.id,
				}));
				res.json({
					data: {
						...board.data(),
						id: board.id,
						items: {
							1: list.filter((item) => item.column === 1),
							2: list.filter((item) => item.column === 2),
							3: list.filter((item) => item.column === 3),
						},
					},
				});
			} else res.json({ error: { code: 404, message: "Board not found" } });
		});
});

app.post("/api/item", (req, res) => {
	db.collection("item")
		.add(createObject(req, req.body))
		.then((value) =>
			db
				.collection("item")
				.doc(value.id)
				.get()
				.then((doc) => res.json({ data: { ...doc.data(), id: doc.id } }))
		);
});
app.put("/api/item/:id", (req, res) => {
	const { id } = req.params;
	db.collection("item")
		.doc(id)
		.update(updateObject(req, req.body))
		.then(() => {
			db.collection("item")
				.doc(id)
				.get()
				.then((doc) => res.json({ data: { ...doc.data(), id: doc.id } }));
		});
});

app.put("/api/board/:id", (req, res) => {
	const { id } = req.params;
	db.collection("board")
		.doc(id)
		.update(updateObject(req, req.body))
		.then(() => {
			db.collection("board")
				.doc(id)
				.get()
				.then((doc) => res.json({ data: { ...doc.data(), id: doc.id } }));
		});
});

app.put("/api/user/password", (req, res) => {
	const { username } = req.user;
	const { oldPass, newPass } = req.body;
	db.collection("users")
		.where("username", "==", username)
		.get()
		.then((snapshot) => {
			if (snapshot.docs.length > 1)
				return res.json({
					error: { code: 500, message: "Duplicate User" },
				});
			else {
				const doc = snapshot.docs[0];
				if (bcrypt.compareSync(oldPass, doc.data().password)) {
					doc.ref
						.update({
							password: bcrypt.hashSync(newPass),
						})
						.then(() => res.status(200).send());
				} else
					res.json({ error: { code: 400, message: "Old password not match" } });
			}
		});
});

app.put("/api/user", (req, res) => {
	const { username } = req.user;
	db.collection("users")
		.where("username", "==", username)
		.get()
		.then((snapshot) => {
			if (snapshot.docs.length > 1)
				return res.json({
					error: { code: 500, message: "Duplicate User" },
				});
			else {
				const matched = snapshot.docs[0];
				matched.ref.update(updateObject(req, req.body)).then(() => {
					db.collection("users")
						.doc(matched.id)
						.get()
						.then((doc) =>
							res.json({
								data: {
									username: doc.data().username,
									name: doc.data().name,
									token: jwt.sign(doc.data(), process.env.JWTSECRET),
								},
							})
						);
				});
			}
		});
});

app.listen(8080, () => console.log("Server on localhost:" + 8080));

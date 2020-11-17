const router = require("express").Router();
const { createDocument } = require("../utils");
const { db } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const tokenLife = parseInt(process.env.JWTLIFE || 100000);
const tokenSecret = process.env.JWTSECRET || "jwtjwt";
const refreshLife = parseInt(process.env.REFRESHLIFE || 1000000);
const refreshSecret = process.env.REFRESHSECRET || "jwtjwtdasdasdas";

router.post("/token", (req, res) => {
	res.json({ accessToken: jwt.sign(req.body, tokenSecret) });
});

router.post("/signup", (req, res) => {
	db.collection("user")
		.where("username", "==", req.body.username)
		.get()
		.then((snapshot) => {
			if (snapshot.docs.length > 0)
				return res.status(401).send({ message: "Username already exist" });
			else {
				db.collection("user")
					.add({
						...req.body,
						password: bcrypt.hashSync(req.body.password),
						createdAt: new Date().getTime(),
						updatedAt: new Date().getTime(),
					})
					.then((value) => {
						if (value.id) res.json({ data: value.id });
						else res.json({ error: { code: 500, message: "Sign up fail" } });
					})
					.catch((err) => {
						console.error(err);
						res.status(500).send({ message: "Sign up fail" });
					});
			}
		});
});

router.post("/login", (req, res) => {
	const { username, password } = req.body;
	db.collection("user")
		.where("username", "==", username)
		.get()
		.then((snapshot) => {
			if (snapshot.docs.length > 0) {
				const matched = snapshot.docs[0];
				if (bcrypt.compareSync(password, matched.data().password)) {
					const { password, ...user } = matched.data();
					res.cookie("access-token", jwt.sign(user, tokenSecret));
					res.json({
						user: {
							username: user.username,
							name: user.name,
						},
						accessToken: jwt.sign(user, tokenSecret),
					});
				} else res.status(401).send({ message: "Password incorrect" });
			} else res.status(401).send({ message: "Username not exist" });
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send({ message: "Login fail" });
		});
});

module.exports = router;

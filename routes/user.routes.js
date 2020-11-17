const router = require("express").Router();
const { db } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.put("/password", (req, res) => {
	const { username } = req.user;
	const { oldPass, newPass } = req.body;
	db.collection("user")
		.where("username", "==", username)
		.get()
		.then((list) => {
			if (list.docs.length > 1)
				return res.json({
					error: { code: 500, message: "Duplicate User" },
				});
			else {
				const doc = list.docs[0];
				if (doc)
					if (bcrypt.compareSync(oldPass, doc.data().password)) {
						doc.ref
							.update({
								password: bcrypt.hashSync(newPass),
							})
							.then(() => res.status(200).send())
							.catch((err) => {
								console.error(err);
								res.status(500).send({ message: "Update user fail" });
							});
					} else res.status(400).send({ message: "Old password not match" });
				else res.status(500).send({ message: "Edit Password fail" });
			}
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Edit Password fail" });
		});
});

router.put("/", (req, res) => {
	const { username } = req.user;
	db.collection("user")
		.where("username", "==", username)
		.get()
		.then((list) => {
			if (list.docs.length > 1)
				return res.json({
					error: { code: 500, message: "Duplicate User" },
				});
			else {
				const doc = list.docs[0];
				if (doc)
					doc.ref
						.update(req.body)
						.then(() => {
							const { password, ...user } = {
								...doc.data(),
								name: req.body.name,
							};
							res.json({
								user,
								token: jwt.sign(user, process.env.JWTSECRET || "jwtjwt"),
							});
						})
						.catch((err) => {
							console.error(err);
							res.status(500).send({ message: "Update user fail" });
						});
				else res.status(500).send({ message: "Edit Profile fail" });
			}
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Edit Profile fail" });
		});
});

module.exports = router;

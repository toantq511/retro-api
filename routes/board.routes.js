const router = require("express").Router();
const { createDocument, updateDocument } = require("../utils");
const { db, admin } = require("../db");

//Edit item
router.put("/item/:itemId", (req, res) => {
	const { itemId } = req.params;
	const [boardId, column] = itemId.split("-");
	db.collection("board")
		.doc(boardId)
		.get()
		.then((board) => {
			if (board.exists) {
				const list = board.data().items[column];
				board.ref
					.update(
						updateDocument(req, {
							[`items.${column}`]: list.map((item) =>
								item.id === itemId
									? updateDocument(req, { ...item, name: req.body.name })
									: item
							),
						})
					)
					.then(res.status(200).send());
			} else res.status(404).send("Board not found");
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Add Item fail" });
		});
});

//Delete item
router.delete("/item/:itemId", (req, res) => {
	const { itemId } = req.params;
	const [boardId, column] = itemId.split("-");
	db.collection("board")
		.doc(boardId)
		.get()
		.then((board) => {
			if (board.exists) {
				const list = board.data().items[column];
				board.ref
					.update(
						updateDocument(req, {
							[`items.${column}`]: list.filter((item) => item.id !== itemId),
						})
					)
					.then(res.status(200).send());
			} else res.status(404).send("Board not found");
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Delete Item fail" });
		});
});

//Add Item
router.post("/:boardId/:column", (req, res) => {
	const { boardId, column } = req.params;
	db.collection("board")
		.doc(boardId)
		.update(
			updateDocument(req, {
				[`items.${column}`]: admin.firestore.FieldValue.arrayUnion(
					createDocument(req, {
						id: `${boardId}-${column}-${new Date().getTime()}`,
						...req.body,
					})
				),
			})
		)
		.then(res.status(200).send())
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Add Item fail" });
		});
});

//Update Board
router.put("/:id", (req, res) => {
	const { id } = req.params;
	db.collection("board")
		.doc(id)
		.update(updateDocument(req, req.body))
		.then(res.status(200).send())
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Update board fail" });
		});
});
//Delete Board
router.delete("/:id", (req, res) => {
	const { id } = req.params;
	db.collection("board")
		.doc(id)
		.delete()
		.then(res.status(200).send())
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Delete board fail" });
		});
});

//Create Board
router.post("/", (req, res) => {
	db.collection("board")
		.add(
			createDocument(req, {
				...req.body,
				items: { col1: [], col2: [], col3: [] },
			})
		)
		.then(res.status(200).send())
		.catch((err) => {
			console.error(err);
			res.status(500).send({ message: "Add board fail" });
		});
});

module.exports = router;

const createDocument = (req, data) => ({
	...data,
	createdAt: new Date().getTime(),
	createdBy: req.user.username,
	updatedAt: new Date().getTime(),
	updatedBy: req.user.username,
});
const updateDocument = (req, data) => ({
	...data,
	updatedAt: new Date().getTime(),
	updatedBy: req.user ? req.user.username : "Anonymous User",
});

module.exports = {
	createDocument,
	updateDocument,
};

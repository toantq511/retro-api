const jwt = require("jsonwebtoken");

module.exports = {
	getAuthentication: (req, res, next) => {
		const authorization = req.headers.authorization;
		if (authorization && authorization.startsWith("Bearer ")) {
			const token = authorization.slice(7);
			try {
				const user = jwt.verify(token, process.env.JWTSECRET);
				req.user = user;
				next();
			} catch {
				res.status(401).send();
			}
		} else res.status(401).send();
	},
};

const express = require("express");
const cors = require("cors");
require("dotenv").config({ silent: process.env.NODE_ENV === "production" });

const app = express();
app.use(express.json());
app.use(cors());

const authMdw = require("./middlewares/auth.mdw");

app.use("/api/auth", require("./routes/auth.routes"));
app.use(
	"/api/board",
	authMdw.getAuthentication,
	require("./routes/board.routes")
);

app.get("/", (req, res) => res.send("Hello"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server on localhost:" + PORT));

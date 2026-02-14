const express = require("express");
const { deleteMe } = require("../controllers/user.controller");

const router = express.Router();

router.delete("/me", deleteMe);

module.exports = router;

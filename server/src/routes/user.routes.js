const express = require("express");
const { getMe, updateMe, deleteMe } = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", getMe);
router.patch("/me", updateMe);
router.delete("/me", deleteMe);

module.exports = router;

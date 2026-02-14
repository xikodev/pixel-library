const express = require("express");
const {
    startSession,
    startBrake,
    endBrake,
    endSession,
} = require("../controllers/session.controller");

const router = express.Router();

router.post("/start", startSession);
router.post("/:id/brake/start", startBrake);
router.post("/:id/brake/end", endBrake);
router.post("/:id/end", endSession);

module.exports = router;

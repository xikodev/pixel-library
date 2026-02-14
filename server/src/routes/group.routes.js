const express = require("express");
const {
    createGroup,
    rotateInviteCode,
    joinByInviteCode,
    removeMember,
} = require("../controllers/group.controller");

const router = express.Router();

router.post("/", createGroup);
router.post("/:id/invite", rotateInviteCode);
router.post("/join/:code", joinByInviteCode);
router.delete("/:id/members/:personId", removeMember);

module.exports = router;

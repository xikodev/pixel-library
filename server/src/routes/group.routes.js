const express = require("express");
const {
    getGroupDetails,
    deleteGroup,
    getMyGroups,
    createGroup,
    rotateInviteCode,
    joinByInviteCode,
    removeMember,
} = require("../controllers/group.controller");

const router = express.Router();

router.get("/me", getMyGroups);
router.get("/:id", getGroupDetails);
router.post("/", createGroup);
router.post("/:id/invite", rotateInviteCode);
router.post("/join/:code", joinByInviteCode);
router.delete("/:id/members/:personId", removeMember);
router.delete("/:id", deleteGroup);

module.exports = router;

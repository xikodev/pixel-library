const express = require("express");
const {
    getGroupDetails,
    deleteGroup,
    getMyGroups,
    createGroup,
    rotateInviteCode,
    joinByInviteCode,
    requestJoinByInviteCode,
    approveJoinRequest,
    rejectJoinRequest,
    removeMember,
} = require("../controllers/group.controller");

const router = express.Router();

router.get("/me", getMyGroups);
router.get("/:id", getGroupDetails);
router.post("/", createGroup);
router.post("/:id/invite", rotateInviteCode);
router.post("/join/:code", joinByInviteCode);
router.post("/request/:code", requestJoinByInviteCode);
router.post("/:id/requests/:personId/approve", approveJoinRequest);
router.delete("/:id/requests/:personId", rejectJoinRequest);
router.delete("/:id/members/:personId", removeMember);
router.delete("/:id", deleteGroup);

module.exports = router;

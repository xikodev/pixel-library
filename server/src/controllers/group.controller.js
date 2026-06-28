const crypto = require("crypto");
const { query, getConnection } = require("../config/db");

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

function randomInviteCode() {
    let code = "";
    const bytes = crypto.randomBytes(CODE_LENGTH);
    for (let i = 0; i < CODE_LENGTH; i += 1) {
        code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return code;
}

async function generateUniqueInviteCode() {
    for (let i = 0; i < 10; i += 1) {
        const inviteCode = randomInviteCode();
        const existing = await query("SELECT ID FROM STUDYGROUP WHERE inviteCode = ? LIMIT 1", [inviteCode]);

        if (existing.length === 0) {
            return inviteCode;
        }
    }

    throw new Error("Failed to generate unique invite code");
}

async function findActiveGroupSessions(groupId) {
    return query(
        "SELECT s.ID AS id, s.subject, s.startDateTime, s.personID AS personId, p.ID AS person_id, p.username, p.firstName, p.lastName, p.`character` AS `character` FROM SESSION s INNER JOIN PERSON p ON p.ID = s.personID WHERE s.studyGroupID = ? AND s.endDateTime IS NULL ORDER BY s.ID DESC",
        [groupId]
    );
}

async function findGroupById(groupId) {
    const groups = await query("SELECT ID AS id, name, inviteCode, adminID AS adminId FROM STUDYGROUP WHERE ID = ? LIMIT 1", [groupId]);
    return groups[0] || null;
}

async function findGroupByInviteCode(inviteCode) {
    const groups = await query("SELECT ID AS id, name, inviteCode, adminID AS adminId FROM STUDYGROUP WHERE inviteCode = ? LIMIT 1", [inviteCode]);
    return groups[0] || null;
}

async function createGroup(req, res, next) {
    const connection = await getConnection();

    try {
        const { name } = req.body;
        const adminId = Number(req.user.id);

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const inviteCode = await generateUniqueInviteCode();

        await connection.beginTransaction();

        const [groupResult] = await connection.query(
            "INSERT INTO STUDYGROUP (name, adminID, inviteCode) VALUES (?, ?, ?)",
            [name.trim(), adminId, inviteCode]
        );

        await connection.query(
            "INSERT INTO PARTOF (personID, groupID) VALUES (?, ?)",
            [adminId, groupResult.insertId]
        );

        await connection.commit();

        return res.status(201).json({
            id: groupResult.insertId,
            name: name.trim(),
            inviteCode,
            adminId,
        });
    } catch (error) {
        await connection.rollback();
        return next(error);
    } finally {
        connection.release();
    }
}

async function rotateInviteCode(req, res, next) {
    try {
        const groupId = Number(req.params.id);
        const userId = Number(req.user.id);

        if (!Number.isInteger(groupId)) {
            return res.status(400).json({ message: "Invalid group id" });
        }

        const group = await findGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.adminId !== userId) {
            return res.status(403).json({ message: "Only admin can generate invite links" });
        }

        const inviteCode = await generateUniqueInviteCode();
        await query("UPDATE STUDYGROUP SET inviteCode = ? WHERE ID = ?", [inviteCode, groupId]);

        return res.status(200).json({ id: groupId, inviteCode });
    } catch (error) {
        return next(error);
    }
}

async function joinByInviteCode(req, res, next) {
    try {
        const inviteCode = String(req.params.code || "").toUpperCase().trim();
        const personId = Number(req.user.id);

        if (!/^[A-Z]{8}$/.test(inviteCode)) {
            return res.status(400).json({ message: "Invite code must be 8 letters" });
        }

        const group = await findGroupByInviteCode(inviteCode);

        if (!group) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        const existingMembership = await query(
            "SELECT personID FROM PARTOF WHERE personID = ? AND groupID = ? LIMIT 1",
            [personId, group.id]
        );

        if (existingMembership.length > 0) {
            return res.status(200).json({ message: "Already a member", group });
        }

        await query("INSERT INTO PARTOF (personID, groupID) VALUES (?, ?)", [personId, group.id]);

        return res.status(200).json({ message: "Joined group", group });
    } catch (error) {
        return next(error);
    }
}

async function requestJoinByInviteCode(req, res, next) {
    try {
        const inviteCode = String(req.params.code || "").toUpperCase().trim();
        const personId = Number(req.user.id);

        if (!/^[A-Z]{8}$/.test(inviteCode)) {
            return res.status(400).json({ message: "Invite code must be 8 letters" });
        }

        const group = await findGroupByInviteCode(inviteCode);

        if (!group) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        const existingMembership = await query(
            "SELECT personID FROM PARTOF WHERE personID = ? AND groupID = ? LIMIT 1",
            [personId, group.id]
        );

        if (existingMembership.length > 0) {
            return res.status(200).json({ message: "Already a member", status: "member", group });
        }

        const existingRequest = await query(
            "SELECT personID FROM GROUPJOINREQUEST WHERE personID = ? AND groupID = ? LIMIT 1",
            [personId, group.id]
        );

        if (existingRequest.length > 0) {
            return res.status(200).json({ message: "Join request already pending", status: "pending", group });
        }

        await query("INSERT INTO GROUPJOINREQUEST (personID, groupID) VALUES (?, ?)", [personId, group.id]);

        return res.status(200).json({ message: "Join request sent", status: "pending", group });
    } catch (error) {
        return next(error);
    }
}

async function approveJoinRequest(req, res, next) {
    const connection = await getConnection();

    try {
        const groupId = Number(req.params.id);
        const memberId = Number(req.params.personId);
        const requesterId = Number(req.user.id);

        if (!Number.isInteger(groupId) || !Number.isInteger(memberId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const group = await findGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.adminId !== requesterId) {
            return res.status(403).json({ message: "Only admin can approve join requests" });
        }

        const requests = await query(
            "SELECT personID FROM GROUPJOINREQUEST WHERE personID = ? AND groupID = ? LIMIT 1",
            [memberId, groupId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: "Join request not found" });
        }

        await connection.beginTransaction();
        await connection.query("INSERT IGNORE INTO PARTOF (personID, groupID) VALUES (?, ?)", [memberId, groupId]);
        await connection.query("DELETE FROM GROUPJOINREQUEST WHERE personID = ? AND groupID = ?", [memberId, groupId]);
        await connection.commit();

        return res.status(200).json({ message: "Join request approved", group: { id: group.id, name: group.name } });
    } catch (error) {
        await connection.rollback();
        return next(error);
    } finally {
        connection.release();
    }
}

async function rejectJoinRequest(req, res, next) {
    try {
        const groupId = Number(req.params.id);
        const memberId = Number(req.params.personId);
        const requesterId = Number(req.user.id);

        if (!Number.isInteger(groupId) || !Number.isInteger(memberId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const group = await findGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.adminId !== requesterId && requesterId !== memberId) {
            return res.status(403).json({ message: "Only the admin can reject this join request" });
        }

        const result = await query("DELETE FROM GROUPJOINREQUEST WHERE personID = ? AND groupID = ?", [memberId, groupId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Join request not found" });
        }

        return res.status(200).json({ message: requesterId === memberId ? "Join request cancelled" : "Join request rejected" });
    } catch (error) {
        return next(error);
    }
}

async function removeMember(req, res, next) {
    try {
        const groupId = Number(req.params.id);
        const memberId = Number(req.params.personId);
        const requesterId = Number(req.user.id);

        if (!Number.isInteger(groupId) || !Number.isInteger(memberId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const group = await findGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.adminId !== requesterId) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        if (group.adminId === memberId) {
            return res.status(400).json({ message: "Admin cannot be removed from group" });
        }

        const membership = await query(
            "SELECT personID FROM PARTOF WHERE personID = ? AND groupID = ? LIMIT 1",
            [memberId, groupId]
        );

        if (membership.length === 0) {
            return res.status(404).json({ message: "Member is not in this group" });
        }

        await query("DELETE FROM PARTOF WHERE personID = ? AND groupID = ?", [memberId, groupId]);

        return res.status(200).json({ message: "Member removed" });
    } catch (error) {
        return next(error);
    }
}

async function getGroupDetails(req, res, next) {
    try {
        const groupId = Number(req.params.id);
        const personId = Number(req.user.id);

        if (!Number.isInteger(groupId)) {
            return res.status(400).json({ message: "Invalid group id" });
        }

        const group = await findGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const members = await query(
            `SELECT
                po.personID AS personId,
                p.ID AS id,
                p.username,
                p.firstName,
                p.lastName,
                p.email
             FROM PARTOF po
             INNER JOIN PERSON p ON p.ID = po.personID
             WHERE po.groupID = ?
             ORDER BY po.personID ASC`,
            [groupId]
        );

        const isMember = members.some((member) => member.personId === personId);

        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const activeGroupSessions = await findActiveGroupSessions(group.id);
        const pendingRequests =
            group.adminId === personId
                ? await query(
                      `SELECT
                          gjr.personID AS personId,
                          gjr.createdAt,
                          p.ID AS id,
                          p.username,
                          p.firstName,
                          p.lastName,
                          p.email
                       FROM GROUPJOINREQUEST gjr
                       INNER JOIN PERSON p ON p.ID = gjr.personID
                       WHERE gjr.groupID = ?
                       ORDER BY gjr.createdAt ASC`,
                      [group.id]
                  )
                : [];

        return res.status(200).json({
            id: group.id,
            name: group.name,
            inviteCode: group.inviteCode,
            adminId: group.adminId,
            isAdmin: group.adminId === personId,
            groupStudy: {
                isActive: activeGroupSessions.length > 0,
                activeCount: activeGroupSessions.length,
                hasMyActiveSession: activeGroupSessions.some((session) => session.personId === personId),
                participants: activeGroupSessions.map((session) => ({
                    sessionId: session.id,
                    subject: session.subject,
                    startDateTime: session.startDateTime,
                    personId: session.personId,
                    person: {
                        id: session.person_id,
                        username: session.username,
                        firstName: session.firstName,
                        lastName: session.lastName,
                        character: session.character,
                    },
                })),
            },
            members: members.map((member) => ({
                id: member.id,
                username: member.username,
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                isAdmin: member.id === group.adminId,
            })),
            pendingRequests: pendingRequests.map((request) => ({
                id: request.id,
                username: request.username,
                firstName: request.firstName,
                lastName: request.lastName,
                email: request.email,
                createdAt: request.createdAt,
            })),
        });
    } catch (error) {
        return next(error);
    }
}

async function deleteGroup(req, res, next) {
    try {
        const groupId = Number(req.params.id);
        const personId = Number(req.user.id);

        if (!Number.isInteger(groupId)) {
            return res.status(400).json({ message: "Invalid group id" });
        }

        const groups = await query("SELECT ID AS id, adminID AS adminId FROM STUDYGROUP WHERE ID = ? LIMIT 1", [groupId]);

        if (groups.length === 0) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (groups[0].adminId !== personId) {
            return res.status(403).json({ message: "Only admin can delete group" });
        }

        await query("DELETE FROM STUDYGROUP WHERE ID = ?", [groupId]);

        return res.status(200).json({ message: "Group deleted" });
    } catch (error) {
        return next(error);
    }
}

async function getMyGroups(req, res, next) {
    try {
        const personId = Number(req.user.id);

        const groups = await query(
            `SELECT
                g.ID AS id,
                g.name,
                g.inviteCode,
                g.adminID AS adminId,
                COUNT(po.personID) AS memberCount,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM SESSION s
                        WHERE s.studyGroupID = g.ID AND s.endDateTime IS NULL
                    ) THEN TRUE
                    ELSE FALSE
                END AS hasActiveGroupSession
             FROM STUDYGROUP g
             INNER JOIN PARTOF myMembership ON myMembership.groupID = g.ID AND myMembership.personID = ?
             LEFT JOIN PARTOF po ON po.groupID = g.ID
             GROUP BY g.ID, g.name, g.inviteCode, g.adminID
             ORDER BY g.ID DESC`,
            [personId]
        );

        return res.status(200).json(
            groups.map((group) => ({
                id: group.id,
                name: group.name,
                inviteCode: group.inviteCode,
                adminId: group.adminId,
                isAdmin: group.adminId === personId,
                memberCount: Number(group.memberCount),
                hasActiveGroupSession: Boolean(group.hasActiveGroupSession),
            }))
        );
    } catch (error) {
        return next(error);
    }
}

module.exports = {
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
};

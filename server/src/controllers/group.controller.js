const crypto = require("crypto");
const prisma = require("../config/db");

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
        const existing = await prisma.studyGroup.findUnique({
            where: { inviteCode },
            select: { id: true },
        });

        if (!existing) {
            return inviteCode;
        }
    }

    throw new Error("Failed to generate unique invite code");
}

async function createGroup(req, res, next) {
    try {
        const { name } = req.body;
        const adminId = Number(req.user.id);

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const inviteCode = await generateUniqueInviteCode();

        const group = await prisma.studyGroup.create({
            data: {
                name: name.trim(),
                adminId,
                inviteCode,
                members: {
                    create: {
                        personId: adminId,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                inviteCode: true,
                adminId: true,
            },
        });

        return res.status(201).json(group);
    } catch (error) {
        return next(error);
    }
}

async function rotateInviteCode(req, res, next) {
    try {
        const groupId = Number(req.params.id);
        const userId = Number(req.user.id);

        if (!Number.isInteger(groupId)) {
            return res.status(400).json({ message: "Invalid group id" });
        }

        const group = await prisma.studyGroup.findUnique({
            where: { id: groupId },
            select: { id: true, adminId: true },
        });

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.adminId !== userId) {
            return res.status(403).json({ message: "Only admin can generate invite links" });
        }

        const inviteCode = await generateUniqueInviteCode();

        const updated = await prisma.studyGroup.update({
            where: { id: groupId },
            data: { inviteCode },
            select: { id: true, inviteCode: true },
        });

        return res.status(200).json(updated);
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

        const group = await prisma.studyGroup.findUnique({
            where: { inviteCode },
            select: { id: true, name: true, inviteCode: true },
        });

        if (!group) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        const existingMembership = await prisma.partOf.findUnique({
            where: {
                personId_groupId: {
                    personId,
                    groupId: group.id,
                },
            },
        });

        if (existingMembership) {
            return res.status(200).json({ message: "Already a member", group });
        }

        await prisma.partOf.create({
            data: {
                personId,
                groupId: group.id,
            },
        });

        return res.status(200).json({ message: "Joined group", group });
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

        const group = await prisma.studyGroup.findUnique({
            where: { id: groupId },
            select: { id: true, adminId: true },
        });

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.adminId !== requesterId) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        if (group.adminId === memberId) {
            return res.status(400).json({ message: "Admin cannot be removed from group" });
        }

        const membership = await prisma.partOf.findUnique({
            where: {
                personId_groupId: {
                    personId: memberId,
                    groupId,
                },
            },
        });

        if (!membership) {
            return res.status(404).json({ message: "Member is not in this group" });
        }

        await prisma.partOf.delete({
            where: {
                personId_groupId: {
                    personId: memberId,
                    groupId,
                },
            },
        });

        return res.status(200).json({ message: "Member removed" });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createGroup,
    rotateInviteCode,
    joinByInviteCode,
    removeMember,
};

const prisma = require("../config/db");
const { Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

function personSelect() {
    return {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        character: true,
        totalTimeStudied: true,
        totalBrakeTime: true,
        totalBrakes: true,
    };
}

async function deleteMe(req, res, next) {
    try {
        const userId = Number(req.user.id);

        const result = await prisma.$transaction(async (tx) => {
            const person = await tx.person.findUnique({
                where: { id: userId },
                select: { id: true },
            });

            if (!person) {
                return { status: 404, body: { message: "User not found" } };
            }

            const adminGroups = await tx.studyGroup.findMany({
                where: { adminId: userId },
                select: {
                    id: true,
                    members: {
                        select: { personId: true },
                        orderBy: { personId: "asc" },
                    },
                },
            });

            for (const group of adminGroups) {
                const replacement = group.members.find((member) => member.personId !== userId);

                if (replacement) {
                    await tx.studyGroup.update({
                        where: { id: group.id },
                        data: { adminId: replacement.personId },
                    });
                } else {
                    await tx.studyGroup.delete({
                        where: { id: group.id },
                    });
                }
            }

            await tx.person.delete({
                where: { id: userId },
            });

            return {
                status: 200,
                body: { message: "User deleted successfully" },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        return next(error);
    }
}

async function getMe(req, res, next) {
    try {
        const userId = Number(req.user.id);

        const person = await prisma.person.findUnique({
            where: { id: userId },
            select: personSelect(),
        });

        if (!person) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(person);
    } catch (error) {
        return next(error);
    }
}

async function updateMe(req, res, next) {
    try {
        const userId = Number(req.user.id);
        const updates = {};

        if (req.body.username !== undefined) {
            const username = String(req.body.username).trim();
            if (!username) {
                return res.status(400).json({ message: "Username cannot be empty" });
            }

            updates.username = username;
        }

        if (req.body.firstName !== undefined) {
            const firstName = String(req.body.firstName).trim();
            if (!firstName) {
                return res.status(400).json({ message: "First name cannot be empty" });
            }

            updates.firstName = firstName;
        }

        if (req.body.lastName !== undefined) {
            const lastName = String(req.body.lastName).trim();
            if (!lastName) {
                return res.status(400).json({ message: "Last name cannot be empty" });
            }

            updates.lastName = lastName;
        }

        if (req.body.character !== undefined) {
            const character = Number(req.body.character);
            if (!Number.isInteger(character) || character < 0 || character > 11) {
                return res.status(400).json({ message: "Character must be a number between 0 and 11" });
            }

            updates.character = character;
        }

        if (req.body.email !== undefined) {
            const email = String(req.body.email).trim().toLowerCase();
            if (!email) {
                return res.status(400).json({ message: "Email cannot be empty" });
            }

            updates.email = email;
        }

        if (req.body.password !== undefined) {
            const password = String(req.body.password);
            if (password.trim().length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }

            updates.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided to update" });
        }

        const person = await prisma.person.update({
            where: { id: userId },
            data: updates,
            select: personSelect(),
        });

        return res.status(200).json(person);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(409).json({ message: "Username or email already exists" });
            }

            if (error.code === "P2025") {
                return res.status(404).json({ message: "User not found" });
            }
        }

        return next(error);
    }
}

module.exports = {
    getMe,
    updateMe,
    deleteMe,
};

const prisma = require("../config/db");

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

module.exports = {
    deleteMe,
};

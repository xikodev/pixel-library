const prisma = require("../config/db");

function secondsBetween(from, to) {
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
}

function isMissingStudyGroupColumn(error) {
    const message = String(error?.message || "");
    return (
        (error?.code === "P2022" && message.toLowerCase().includes("studygroupid")) ||
        (message.includes("Unknown") && message.includes("studyGroupId")) ||
        (message.includes("Could not find the column") && message.toLowerCase().includes("studygroupid"))
    );
}

async function getActiveSession(req, res, next) {
    try {
        const personId = Number(req.user.id);
        try {
            const session = await prisma.session.findFirst({
                where: { personId, endDateTime: null },
                select: {
                    id: true,
                    subject: true,
                    startDateTime: true,
                    endDateTime: true,
                    brakeCount: true,
                    brakeTime: true,
                    currentBrakeStartDateTime: true,
                    studyGroupId: true,
                },
                orderBy: { id: "desc" },
            });

            return res.status(200).json(session);
        } catch (error) {
            if (!isMissingStudyGroupColumn(error)) {
                throw error;
            }

            const session = await prisma.session.findFirst({
                where: { personId, endDateTime: null },
                select: {
                    id: true,
                    subject: true,
                    startDateTime: true,
                    endDateTime: true,
                    brakeCount: true,
                    brakeTime: true,
                    currentBrakeStartDateTime: true,
                },
                orderBy: { id: "desc" },
            });

            return res.status(200).json(session ? { ...session, studyGroupId: null } : null);
        }
    } catch (error) {
        return next(error);
    }
}

async function startSession(req, res, next) {
    try {
        const personId = Number(req.user.id);
        const { subject } = req.body;
        const rawStudyGroupId = req.body.studyGroupId;
        const studyGroupId = rawStudyGroupId === undefined || rawStudyGroupId === null ? null : Number(rawStudyGroupId);

        if (!subject || !subject.trim()) {
            return res.status(400).json({ message: "Subject is required" });
        }

        if (studyGroupId !== null && !Number.isInteger(studyGroupId)) {
            return res.status(400).json({ message: "Invalid study group id" });
        }

        const active = await prisma.session.findFirst({
            where: { personId, endDateTime: null },
            select: { id: true },
        });

        if (active) {
            return res.status(409).json({ message: "You already have an active session" });
        }

        if (studyGroupId !== null) {
            const membership = await prisma.partOf.findUnique({
                where: {
                    personId_groupId: {
                        personId,
                        groupId: studyGroupId,
                    },
                },
                select: { personId: true },
            });

            if (!membership) {
                return res.status(403).json({ message: "You are not a member of this group" });
            }
        }

        try {
            const createData = {
                personId,
                subject: subject.trim(),
                startDateTime: new Date(),
            };

            if (studyGroupId !== null) {
                createData.studyGroupId = studyGroupId;
            }

            const session = await prisma.session.create({
                data: createData,
                select: {
                    id: true,
                    subject: true,
                    startDateTime: true,
                    endDateTime: true,
                    brakeCount: true,
                    brakeTime: true,
                    studyGroupId: true,
                },
            });

            return res.status(201).json(session);
        } catch (error) {
            if (!isMissingStudyGroupColumn(error)) {
                throw error;
            }

            if (studyGroupId !== null) {
                return res.status(500).json({
                    message: "Group study requires the latest database migration (studyGroupID column missing).",
                });
            }

            const session = await prisma.session.create({
                data: {
                    personId,
                    subject: subject.trim(),
                    startDateTime: new Date(),
                },
                select: {
                    id: true,
                    subject: true,
                    startDateTime: true,
                    endDateTime: true,
                    brakeCount: true,
                    brakeTime: true,
                },
            });

            return res.status(201).json({ ...session, studyGroupId: null });
        }
    } catch (error) {
        return next(error);
    }
}

async function startBrake(req, res, next) {
    try {
        const personId = Number(req.user.id);
        const sessionId = Number(req.params.id);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({ message: "Invalid session id" });
        }

        const session = await prisma.session.findFirst({
            where: { id: sessionId, personId },
            select: {
                id: true,
                endDateTime: true,
                currentBrakeStartDateTime: true,
            },
        });

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.endDateTime) {
            return res.status(400).json({ message: "Session already ended" });
        }

        if (session.currentBrakeStartDateTime) {
            return res.status(409).json({ message: "Brake already active" });
        }

        const updated = await prisma.session.update({
            where: { id: sessionId },
            data: {
                brakeCount: { increment: 1 },
                currentBrakeStartDateTime: new Date(),
            },
            select: {
                id: true,
                brakeCount: true,
                currentBrakeStartDateTime: true,
            },
        });

        return res.status(200).json(updated);
    } catch (error) {
        return next(error);
    }
}

async function endBrake(req, res, next) {
    try {
        const personId = Number(req.user.id);
        const sessionId = Number(req.params.id);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({ message: "Invalid session id" });
        }

        const session = await prisma.session.findFirst({
            where: { id: sessionId, personId },
            select: {
                id: true,
                endDateTime: true,
                brakeTime: true,
                currentBrakeStartDateTime: true,
            },
        });

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.endDateTime) {
            return res.status(400).json({ message: "Session already ended" });
        }

        if (!session.currentBrakeStartDateTime) {
            return res.status(409).json({ message: "No active brake to end" });
        }

        const now = new Date();
        const additionalBrakeSeconds = secondsBetween(session.currentBrakeStartDateTime, now);

        const updated = await prisma.session.update({
            where: { id: sessionId },
            data: {
                brakeTime: { increment: additionalBrakeSeconds },
                currentBrakeStartDateTime: null,
            },
            select: {
                id: true,
                brakeTime: true,
                currentBrakeStartDateTime: true,
            },
        });

        return res.status(200).json(updated);
    } catch (error) {
        return next(error);
    }
}

async function endSession(req, res, next) {
    try {
        const personId = Number(req.user.id);
        const sessionId = Number(req.params.id);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({ message: "Invalid session id" });
        }

        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const session = await tx.session.findFirst({
                where: { id: sessionId, personId },
                select: {
                    id: true,
                    personId: true,
                    startDateTime: true,
                    endDateTime: true,
                    brakeCount: true,
                    brakeTime: true,
                    currentBrakeStartDateTime: true,
                },
            });

            if (!session) {
                return { status: 404, body: { message: "Session not found" } };
            }

            if (session.endDateTime) {
                return { status: 400, body: { message: "Session already ended" } };
            }

            const additionalBrakeSeconds = session.currentBrakeStartDateTime
                ? secondsBetween(session.currentBrakeStartDateTime, now)
                : 0;

            const totalBrakeTime = session.brakeTime + additionalBrakeSeconds;
            const totalSessionSeconds = secondsBetween(session.startDateTime, now);
            const totalTimeStudied = Math.max(0, totalSessionSeconds - totalBrakeTime);

            const endedSession = await tx.session.update({
                where: { id: sessionId },
                data: {
                    endDateTime: now,
                    brakeTime: totalBrakeTime,
                    currentBrakeStartDateTime: null,
                },
                select: {
                    id: true,
                    startDateTime: true,
                    endDateTime: true,
                    brakeCount: true,
                    brakeTime: true,
                    subject: true,
                },
            });

            await tx.person.update({
                where: { id: personId },
                data: {
                    totalBrakeTime: { increment: totalBrakeTime },
                    totalBrakes: { increment: session.brakeCount },
                    totalTimeStudied: { increment: totalTimeStudied },
                },
            });

            return {
                status: 200,
                body: {
                    session: endedSession,
                    totalsAdded: {
                        totalBrakeTime,
                        totalBrakes: session.brakeCount,
                        totalTimeStudied,
                    },
                },
            };
        });

        return res.status(result.status).json(result.body);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getActiveSession,
    startSession,
    startBrake,
    endBrake,
    endSession,
};

const { query, getConnection } = require("../config/db");

function secondsBetween(from, to) {
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
}

async function getActiveSession(req, res, next) {
    try {
        const personId = Number(req.user.id);
        const rows = await query(
            `SELECT
                ID AS id,
                subject,
                startDateTime,
                endDateTime,
                brakeCount,
                brakeTime,
                currentBrakeStartDateTime,
                studyGroupID AS studyGroupId
             FROM SESSION
             WHERE personID = ? AND endDateTime IS NULL
             ORDER BY ID DESC
             LIMIT 1`,
            [personId]
        );

        return res.status(200).json(rows[0] || null);
    } catch (error) {
        return next(error);
    }
}

async function getSessionHistory(req, res, next) {
    try {
        const personId = Number(req.user.id);
        const sessions = await query(
            `SELECT
                ID AS id,
                subject,
                startDateTime,
                endDateTime,
                brakeCount,
                brakeTime,
                studyGroupID AS studyGroupId
             FROM SESSION
             WHERE personID = ? AND endDateTime IS NOT NULL
             ORDER BY endDateTime DESC
             LIMIT 50`,
            [personId]
        );

        return res.status(200).json(
            sessions.map((session) => {
                const totalSessionSeconds = secondsBetween(session.startDateTime, session.endDateTime);
                const totalTimeStudied = Math.max(0, totalSessionSeconds - session.brakeTime);

                return {
                    ...session,
                    totalTimeStudied,
                };
            })
        );
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

        const active = await query(
            "SELECT ID AS id FROM SESSION WHERE personID = ? AND endDateTime IS NULL LIMIT 1",
            [personId]
        );

        if (active.length > 0) {
            return res.status(409).json({ message: "You already have an active session" });
        }

        if (studyGroupId !== null) {
            const membership = await query(
                "SELECT personID FROM PARTOF WHERE personID = ? AND groupID = ? LIMIT 1",
                [personId, studyGroupId]
            );

            if (membership.length === 0) {
                return res.status(403).json({ message: "You are not a member of this group" });
            }
        }

        const now = new Date();
        const result = await query(
            `INSERT INTO SESSION (personID, subject, startDateTime, studyGroupID)
             VALUES (?, ?, ?, ?)`,
            [personId, subject.trim(), now, studyGroupId]
        );

        return res.status(201).json({
            id: result.insertId,
            subject: subject.trim(),
            startDateTime: now,
            endDateTime: null,
            brakeCount: 0,
            brakeTime: 0,
            studyGroupId,
        });
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

        const rows = await query(
            `SELECT
                ID AS id,
                brakeCount,
                endDateTime,
                currentBrakeStartDateTime
             FROM SESSION
             WHERE ID = ? AND personID = ?
             LIMIT 1`,
            [sessionId, personId]
        );

        const session = rows[0];
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.endDateTime) {
            return res.status(400).json({ message: "Session already ended" });
        }

        if (session.currentBrakeStartDateTime) {
            return res.status(409).json({ message: "Brake already active" });
        }

        const now = new Date();
        await query(
            `UPDATE SESSION
             SET brakeCount = brakeCount + 1, currentBrakeStartDateTime = ?
             WHERE ID = ?`,
            [now, sessionId]
        );

        return res.status(200).json({
            id: sessionId,
            brakeCount: session.brakeCount + 1,
            currentBrakeStartDateTime: now,
        });
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

        const rows = await query(
            `SELECT
                ID AS id,
                endDateTime,
                brakeTime,
                currentBrakeStartDateTime
             FROM SESSION
             WHERE ID = ? AND personID = ?
             LIMIT 1`,
            [sessionId, personId]
        );

        const session = rows[0];
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
        const nextBrakeTime = session.brakeTime + additionalBrakeSeconds;

        await query(
            `UPDATE SESSION
             SET brakeTime = ?, currentBrakeStartDateTime = NULL
             WHERE ID = ?`,
            [nextBrakeTime, sessionId]
        );

        return res.status(200).json({
            id: sessionId,
            brakeTime: nextBrakeTime,
            currentBrakeStartDateTime: null,
        });
    } catch (error) {
        return next(error);
    }
}

async function endSession(req, res, next) {
    const connection = await getConnection();

    try {
        const personId = Number(req.user.id);
        const sessionId = Number(req.params.id);

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({ message: "Invalid session id" });
        }

        const now = new Date();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT
                ID AS id,
                personID AS personId,
                subject,
                startDateTime,
                endDateTime,
                brakeCount,
                brakeTime,
                currentBrakeStartDateTime
             FROM SESSION
             WHERE ID = ? AND personID = ?
             LIMIT 1
             FOR UPDATE`,
            [sessionId, personId]
        );

        const session = rows[0];
        if (!session) {
            await connection.rollback();
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.endDateTime) {
            await connection.rollback();
            return res.status(400).json({ message: "Session already ended" });
        }

        const additionalBrakeSeconds = session.currentBrakeStartDateTime
            ? secondsBetween(session.currentBrakeStartDateTime, now)
            : 0;

        const totalBrakeTime = session.brakeTime + additionalBrakeSeconds;
        const totalSessionSeconds = secondsBetween(session.startDateTime, now);
        const totalTimeStudied = Math.max(0, totalSessionSeconds - totalBrakeTime);

        await connection.query(
            `UPDATE SESSION
             SET endDateTime = ?, brakeTime = ?, currentBrakeStartDateTime = NULL
             WHERE ID = ?`,
            [now, totalBrakeTime, sessionId]
        );

        await connection.query(
            `UPDATE PERSON
             SET totalBrakeTime = totalBrakeTime + ?,
                 totalBrakes = totalBrakes + ?,
                 totalTimeStudied = totalTimeStudied + ?
             WHERE ID = ?`,
            [totalBrakeTime, session.brakeCount, totalTimeStudied, personId]
        );

        await connection.commit();

        return res.status(200).json({
            session: {
                id: session.id,
                startDateTime: session.startDateTime,
                endDateTime: now,
                brakeCount: session.brakeCount,
                brakeTime: totalBrakeTime,
                subject: session.subject,
            },
            totalsAdded: {
                totalBrakeTime,
                totalBrakes: session.brakeCount,
                totalTimeStudied,
            },
        });
    } catch (error) {
        await connection.rollback();
        return next(error);
    } finally {
        connection.release();
    }
}

module.exports = {
    getActiveSession,
    getSessionHistory,
    startSession,
    startBrake,
    endBrake,
    endSession,
};

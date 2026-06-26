const bcrypt = require("bcryptjs");
const { query, getConnection } = require("../config/db");

function mapPerson(person) {
    return {
        id: person.id,
        username: person.username,
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        character: person.character,
        totalTimeStudied: person.totalTimeStudied,
        totalBrakeTime: person.totalBrakeTime,
        totalBrakes: person.totalBrakes,
    };
}

async function deleteMe(req, res, next) {
    const connection = await getConnection();

    try {
        const userId = Number(req.user.id);

        await connection.beginTransaction();

        const [people] = await connection.query("SELECT ID FROM PERSON WHERE ID = ? LIMIT 1 FOR UPDATE", [userId]);
        if (people.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "User not found" });
        }

        const [adminGroups] = await connection.query(
            "SELECT ID AS id FROM STUDYGROUP WHERE adminID = ? ORDER BY ID ASC FOR UPDATE",
            [userId]
        );

        for (const group of adminGroups) {
            const [members] = await connection.query(
                "SELECT personID AS personId FROM PARTOF WHERE groupID = ? ORDER BY personID ASC",
                [group.id]
            );

            const replacement = members.find((member) => member.personId !== userId);

            if (replacement) {
                await connection.query("UPDATE STUDYGROUP SET adminID = ? WHERE ID = ?", [replacement.personId, group.id]);
            } else {
                await connection.query("DELETE FROM STUDYGROUP WHERE ID = ?", [group.id]);
            }
        }

        await connection.query("DELETE FROM PERSON WHERE ID = ?", [userId]);
        await connection.commit();

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        await connection.rollback();
        return next(error);
    } finally {
        connection.release();
    }
}

async function getMe(req, res, next) {
    try {
        const userId = Number(req.user.id);
        const rows = await query(
            "SELECT ID AS id, username, email, firstName, lastName, `character` AS `character`, totalTimeStudied, totalBrakeTime, totalBrakes FROM PERSON WHERE ID = ? LIMIT 1",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(mapPerson(rows[0]));
    } catch (error) {
        return next(error);
    }
}

async function updateMe(req, res, next) {
    try {
        const userId = Number(req.user.id);
        const updates = [];
        const values = [];

        if (req.body.username !== undefined) {
            const username = String(req.body.username).trim();
            if (!username) {
                return res.status(400).json({ message: "Username cannot be empty" });
            }

            updates.push("username = ?");
            values.push(username);
        }

        if (req.body.firstName !== undefined) {
            const firstName = String(req.body.firstName).trim();
            if (!firstName) {
                return res.status(400).json({ message: "First name cannot be empty" });
            }

            updates.push("firstName = ?");
            values.push(firstName);
        }

        if (req.body.lastName !== undefined) {
            const lastName = String(req.body.lastName).trim();
            if (!lastName) {
                return res.status(400).json({ message: "Last name cannot be empty" });
            }

            updates.push("lastName = ?");
            values.push(lastName);
        }

        if (req.body.character !== undefined) {
            const character = Number(req.body.character);
            if (!Number.isInteger(character) || character < 0 || character > 11) {
                return res.status(400).json({ message: "Character must be a number between 0 and 11" });
            }

            updates.push("`character` = ?");
            values.push(character);
        }

        if (req.body.email !== undefined) {
            const email = String(req.body.email).trim().toLowerCase();
            if (!email) {
                return res.status(400).json({ message: "Email cannot be empty" });
            }

            updates.push("email = ?");
            values.push(email);
        }

        if (req.body.password !== undefined) {
            const password = String(req.body.password);
            if (password.trim().length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }

            updates.push("password = ?");
            values.push(await bcrypt.hash(password, 10));
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No valid fields provided to update" });
        }

        values.push(userId);
        const result = await query(`UPDATE PERSON SET ${updates.join(", ")} WHERE ID = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const rows = await query(
            "SELECT ID AS id, username, email, firstName, lastName, `character` AS `character`, totalTimeStudied, totalBrakeTime, totalBrakes FROM PERSON WHERE ID = ? LIMIT 1",
            [userId]
        );

        return res.status(200).json(mapPerson(rows[0]));
    } catch (error) {
        if (error?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Username or email already exists" });
        }

        return next(error);
    }
}

module.exports = {
    getMe,
    updateMe,
    deleteMe,
};

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

function buildToken(person) {
    return jwt.sign(
        { id: person.id, username: person.username, email: person.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function sanitizePerson(person) {
    return {
        id: person.id,
        username: person.username,
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        character: person.character,
    };
}

async function signup(req, res, next) {
    try {
        const { username, email, firstName, lastName, password } = req.body;
        const rawCharacter = req.body.character;
        const character = rawCharacter === undefined || rawCharacter === null ? 0 : Number(rawCharacter);

        if (!username || !email || !firstName || !lastName || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!Number.isInteger(character) || character < 0 || character > 11) {
            return res.status(400).json({ message: "Character must be a number between 0 and 11" });
        }

        const existing = await query(
            "SELECT ID FROM PERSON WHERE username = ? OR email = ? LIMIT 1",
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO PERSON (username, email, firstName, lastName, password, character)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, firstName, lastName, hashedPassword, character]
        );

        const person = {
            id: result.insertId,
            username,
            email,
            firstName,
            lastName,
            character,
        };

        return res.status(201).json({
            token: buildToken(person),
            user: sanitizePerson(person),
        });
    } catch (error) {
        if (error?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Username or email already exists" });
        }

        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Identifier and password are required" });
        }

        const rows = await query(
            `SELECT
                ID AS id,
                username,
                email,
                firstName,
                lastName,
                password,
                character
             FROM PERSON
             WHERE email = ? OR username = ?
             LIMIT 1`,
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const person = rows[0];
        const isMatch = await bcrypt.compare(password, person.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).json({
            token: buildToken(person),
            user: sanitizePerson(person),
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    signup,
    login,
};

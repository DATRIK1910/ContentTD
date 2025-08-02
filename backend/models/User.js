const db = require("../db");
const bcrypt = require("bcryptjs");

const createUser = async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword],
            (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
    });
};

const getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
            if (err) reject(err);
            else resolve(result[0]);
        });
    });
};

module.exports = { createUser, getUserByEmail };

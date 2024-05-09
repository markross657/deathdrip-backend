require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const Utils = require('./../utility');
const pool = require('../dynamoDbConfig');

// /auth/signin
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" });
    }

    try {
        const { rows } = await pool.query('SELECT * FROM public."Users" WHERE email = $1', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ message: "That account does not exist" });
        }

        if (Utils.verifyPassword(password, user.password)) {
            const userObject = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                accesslevel: user.accessLevel,
                bio: user.bio
            };

            const token = Utils.generateAccessToken(userObject);
            res.json({ accessToken: token, user: userObject });
        } else {
            return res.status(400).json({ message: "Password / Email is not correct" });
        }
    } catch (err) {
        console.log("Error getting account", err);
        res.status(500).json({ message: "Problem getting account", error: err });
    }
});

// /auth/validate
router.get('/validate', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, tokenData) => {
        if (err) {
            return res.sendStatus(403);
        }
        res.json(tokenData);
    });
});

module.exports = router;

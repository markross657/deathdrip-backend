const express = require("express");
const router = express.Router();
const utils = require('../utility');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');

var conString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
console.log(conString);

// Get all Users
router.get("/", async (req, res) => {
  const client = new Client(conString);
  try {
    await client.connect();
    client.connect()
    .then(() => {
        console.log("Database Connected");
    })
    .catch((err) => {
        console.log("Error connecting to database.", err);
    });

    const { rows } = await client.query('SELECT * FROM users');
    res.json(rows);

    await client.end();
  } 
  catch (err) {
    console.log("Error getting users", err);
    res.status(500).json({
      message: "problem getting users",
      error: err,
    });
  }
});

module.exports = router;



// Get all Users
router.get("/", async (req, res) => {
  try {
    var client = new pg.client(conString);
    client.connect()
    .then(() => {
        console.log("Database Connected");
    })
    .catch((err) => {
        console.log("Error connecting to database.", err);
    });

    const { rows } = await client.query('SELECT * FROM users');
    res.json(rows);
    
  } 
  catch (err) {
    console.log("Error getting users", err);
    res.status(500).json({
      message: "problem getting users",
      error: err,
    });
  }
});

// Get Single User by ID
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ message: "user does not exist" });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.log("Error getting user", err);
    res.status(500).json({
      message: "problem getting user",
      error: err,
    });
  }
});

// Create new user
router.post("/", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: "user content is empty",
    });
  }

  const userId = uuidv4(); // Generate a unique UUID for the new user
  try {
    const { firstName, lastName, email, bio, password } = req.body;
    const hashedPassword = utils.hashPassword(password);
    await pool.query(
      'INSERT INTO users (id, first_name, last_name, email, bio, access_level, password) VALUES ($1, $2, $3, $4, $5, 1, $6)',
      [userId, firstName, lastName, email, bio, hashedPassword]
    );
    res.status(201).json({
      id: userId,
      firstName,
      lastName,
      email,
      bio,
      accessLevel: 1
    });
  } catch (err) {
    console.log("error creating user", err);
    if (err.code === '23505') { // PostgreSQL error code for unique violation
      res.status(400).json({
        message: "email already in use",
      });
    } else {
      res.status(500).json({
        message: "problem creating user",
        error: err,
      });
    }
  }
});

// Update user
router.put("/:id", async (req, res) => {
  const { firstName, lastName, bio } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, bio = $3 WHERE id = $4 RETURNING *',
      [firstName, lastName, bio, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.log("error updating user", err);
    res.status(500).json({
      message: "problem updating user",
      error: err,
    });
  }
});

// Delete user by id
router.delete("/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.json({ message: "user deleted" });
    }
  } catch (err) {
    console.log("error deleting user", err);
    res.status(500).json({
      message: "problem deleting user",
      error: err,
    });
  }
});

module.exports = router;

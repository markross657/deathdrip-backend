const { v4: uuidv4 } = require('uuid');

const express = require("express");
const router = express.Router();
const utils = require('../utility');
const pool = require('../dynamoDbConfig')

// Get all Users
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.\"Users\"');
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
    const { rows } = await pool.query('SELECT * FROM public.\"Users\" WHERE id = $1', [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ message: "user does not exist" });
    } else {
      const userDTO = utils.createUserDTO(rows[0]);
      res.json(userDTO);
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

  const { firstName, lastName, email, bio, password } = req.body;
  const hashedPassword = utils.hashPassword(password);
  let userId;
  try {
    const { rows } = await pool.query(
      `
        INSERT INTO public."Users" 
        ("firstName", "lastName", "email", "bio", "accessLevel", "password") 
        VALUES 
        ($1, $2, $3, $4, $5, $6) 
        RETURNING "id", "firstName", "lastName", "email", "bio", "accessLevel"
      `,
      [firstName, lastName, email, bio, 1, hashedPassword]
    );

    // Since the query is expected to insert one row, we can directly access the first element.
    res.status(201).json(rows[0]);
  } catch (err) {
    console.log("error creating user", err);
    if (err.code === '23505') { 
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

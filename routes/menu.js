const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const pool = require('../dynamoDbConfig');

// Get all Coffee Shop Items
router.get('/', async (req, res) => {
    console.log('Received request for all menu items');
  try {
    const { rows } = await pool.query('SELECT * FROM menu_items');
    res.json(rows);
  } catch (err) {
    console.error("Error getting coffee shop items", err);
    res.status(500).json({ message: 'Problem getting coffee shop items', error: err });
  }
});

// Get a Single Coffee Shop Item by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Item does not exist' });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.error("Error getting coffee shop item", err);
    res.status(500).json({ message: 'Problem getting coffee shop item', error: err });
  }
});

// Create a new Coffee Shop Item
router.post('/', async (req, res) => {
  const { name, description, price, category, size } = req.body;
  const id = uuidv4(); // Generate a new UUID for the item ID
  try {
    const { rows } = await pool.query(
      'INSERT INTO menu_items (id, name, description, price, category, size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, description, price, category, JSON.stringify(size)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating coffee shop item', err);
    res.status(500).json({
      message: 'Problem creating coffee shop item',
      error: err,
    });
  }
});

// Update a Coffee Shop Item by ID
router.put('/:id', async (req, res) => {
  const { name, description, price, category, size } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3, category = $4, size = $5 WHERE id = $6 RETURNING *',
      [name, description, price, category, JSON.stringify(size), req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'Item does not exist' });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.error('Error updating coffee shop item', err);
    res.status(500).json({
      message: 'Problem updating coffee shop item',
      error: err,
    });
  }
});

// Delete a Coffee Shop Item by ID
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      res.status(404).json({ message: 'Item does not exist' });
    } else {
      res.json({ message: 'Coffee shop item deleted' });
    }
  } catch (err) {
    console.error('Error deleting coffee shop item', err);
    res.status(500).json({
      message: 'Problem deleting coffee shop item',
      error: err,
    });
  }
});

module.exports = router;

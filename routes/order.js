const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const pool = require('../dynamoDbConfig');

// Get all Coffee Shop Orders
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders');
    res.json(rows);
  } catch (err) {
    console.error('Error getting coffee shop orders', err);
    res.status(500).json({
      message: 'Problem getting coffee shop orders',
      error: err,
    });
  }
});

// Get a Single Coffee Shop Order by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Order does not exist' });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.error('Error getting coffee shop order', err);
    res.status(500).json({
      message: 'Problem getting coffee shop order',
      error: err,
    });
  }
});

// Create a new Coffee Shop Order
router.post('/', async (req, res) => {
  const { customerId, customerName, items, total, orderStatus } = req.body;
  const id = uuidv4(); // Generate unique ID for the order
  try {
    const { rows } = await pool.query(
      'INSERT INTO orders (id, customer_id, customer_name, items, total, order_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, customerId, customerName, JSON.stringify(items), total, orderStatus]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating coffee shop order', err);
    res.status(500).json({
      message: 'Problem creating coffee shop order',
      error: err,
    });
  }
});

// Update a Coffee Shop Order by ID
router.put('/:id', async (req, res) => {
  const { customerName, items, total, orderStatus } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE orders SET customer_name = $1, items = $2, total = $3, order_status = $4 WHERE id = $5 RETURNING *',
      [customerName, JSON.stringify(items), total, orderStatus, req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ message: 'Order does not exist' });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.error('Error updating coffee shop order', err);
    res.status(500).json({
      message: 'Problem updating coffee shop order',
      error: err,
    });
  }
});

// Delete a Coffee Shop Order by ID
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      res.status(404).json({ message: 'Order does not exist' });
    } else {
      res.json({ message: 'Coffee shop order deleted' });
    }
  } catch (err) {
    console.error('Error deleting coffee shop order', err);
    res.status(500).json({
      message: 'Problem deleting coffee shop order',
      error: err,
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../dynamoDbConfig');
require("dotenv").config();

//ENDPOINTS

router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public."ProductCategories"');

    console.log(rows)
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No categories items found' });
    }

    res.json(rows);
  } 
  catch (err) 
  {
    console.error("Error getting product categories", err);
    res.status(500).json({ message: 'Problem getting product categories', error: err });
  }
})

// Get all Coffee Shop Items
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public."Products"');

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No coffee shop items found' });
    }

    res.json(rows);
  } 
  catch (err) 
  {
    console.error("Error getting coffee shop items", err);
    res.status(500).json({ message: 'Problem getting coffee shop items', error: err });
  }
});

// Get a Single Coffee Shop Item by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public."Products" WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Item does not exist' });
    } else {
      res.json(rows[0]);
    }
  } 
  catch (err) {
    console.error("Error getting coffee shop item", err);
    res.status(500).json({ message: 'Problem getting coffee shop item', error: err });
  }
});

// Create a new Coffee Shop Item
router.post('/', async (req, res) => {
  const { name, description, price, category, size } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO public."Products" (name, description, price, category, size) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, category, JSON.stringify(size)]
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
      'UPDATE public."Products" SET name = $1, description = $2, price = $3, category = $4, size = $5 WHERE id = $6 RETURNING *',
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
    const { rowCount } = await pool.query('DELETE FROM public."Products" WHERE id = $1', [req.params.id]);
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

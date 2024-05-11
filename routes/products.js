const express = require('express');
const router = express.Router();
const pool = require('../dynamoDbConfig');
require("dotenv").config();

//ENDPOINTS

router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public."ProductCategories"');
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
    // Fetch products with category information
    const productQuery = `
      SELECT p.id, p.name, p.description, c.id as category_id, c.name as category_name
      FROM public."Products" p
      JOIN public."ProductCategories" c ON p."categoryId" = c.id
    `;
    const { rows: products } = await pool.query(productQuery);

    if (products.length === 0) {
      return res.status(404).json({ message: 'No coffee shop items found' });
    }

    const productsWithDetails = await Promise.all(products.map(async product => {
      const sizeQuery = 'SELECT label, price FROM public."Sizes" WHERE "productId" = $1';
      const { rows: sizes } = await pool.query(sizeQuery, [product.id]);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: {
          id: product.category_id,
          name: product.category_name
        },
        size: sizes.map(size => ({
          label: size.label,
          price: size.price
        }))
      };
    }));

    res.json(productsWithDetails);
  } catch (err) {
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
  const { name, description, category, size } = req.body;
  try {
    const productResult = await pool.query(
      'INSERT INTO public."Products" ("name", "description", "categoryId") VALUES ($1, $2, $3) RETURNING *',
      [name, description, category.id]
    );
    const product = productResult.rows[0];

    const sizesPromises = size.map(s => {
      return pool.query(
        'INSERT INTO public."Sizes" ("productId", "label", "price") VALUES ($1, $2, $3) RETURNING *',
        [product.id, s.label, s.price]
      );
    });

    const sizesResults = await Promise.all(sizesPromises);
    const sizes = sizesResults.map(result => result.rows[0]); 

    const response = {
      ...product,
      sizes: sizes
    };

    res.status(201).json(response);
  } 
  catch (err) {
    console.error('Error creating coffee shop item', err);
    res.status(500).json({
      message: 'Problem creating coffee shop item',
      error: err
    });
  }
});


router.put('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { name, description, category, size } = req.body;

  try {
    await pool.query('BEGIN');

    const updateProductQuery = `
      UPDATE public."Products"
      SET name = $1, description = $2, "categoryId" = $3
      WHERE id = $4
      RETURNING *;
    `;
    const productResult = await pool.query(updateProductQuery, [name, description, category.id, productId]);
    const updatedProduct = productResult.rows[0];

    if (!updatedProduct) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete existing sizes
    const deleteSizes = await pool.query('DELETE FROM public."Sizes" WHERE "productId" = $1', [productId]);
    console.log(`Deleted ${deleteSizes.rowCount} sizes for product ID ${productId}`);
    await pool.query('COMMIT');

    // Insert new sizes
    const sizesPromises = size.map(s => {
      return pool.query('INSERT INTO public."Sizes" ("productId", "label", "price") VALUES ($1, $2, $3) RETURNING *;', [productId, s.label, s.price]);
    });

    const sizesResults = await Promise.all(sizesPromises);
    const updatedSizes = sizesResults.map(result => result.rows[0]);

    await pool.query('COMMIT');
    res.json({
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      category: {
        id: category.id,
        name: category.name
      },
      size: updatedSizes
    });
  } catch (err) {
    console.error("Error updating product", err);
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'Problem updating product', error: err });
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

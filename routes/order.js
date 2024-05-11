const express = require('express');
const router = express.Router();
const pool = require('../dynamoDbConfig');

router.get('/', async (req, res) => {
  try {
    const ordersQuery = `
    SELECT 
      o.*, 
      u."firstName" || ' ' || u."lastName" AS "customerName"
    FROM 
      public."Orders" o    
    INNER JOIN 
      public."Users" u ON o."customerId" = u."id"
    WHERE
      o."status" <> 'Cancelled';
    `;
    const ordersResult = await pool.query(ordersQuery);
    const ordersWithItems = [];

    for (const order of ordersResult.rows) {
      const orderDetailsQuery = `
        SELECT "id", "name", "size", "quantity", "price"
        FROM public."OrderDetails"
        WHERE "orderId" = $1
      `;

      const orderDetailsResult = await pool.query(orderDetailsQuery, [order.id]);

      const items = orderDetailsResult.rows.map(item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      }));

      ordersWithItems.push({
        ...order,
        items: items
      });
    }

    //console.log("Orders Retrieved");
    console.log(ordersWithItems);
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Error getting coffee shop orders', err);
    res.status(500).json({
      message: 'Problem getting coffee shop orders',
      error: err,
    });
  }
});

router.get('/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    const orderQuery = `
    SELECT 
      o.*, 
      u."firstName" || ' ' || u."lastName" AS "customerName"
    FROM 
      public."Orders" o
    INNER JOIN 
      public."Users" u ON o."customerId" = u."id"
    WHERE 
      o."id" = $1
  `;
    const orderResult = await pool.query(orderQuery, [orderId]);

    // If order not found
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    const orderDetailsQuery = `
      SELECT "name", "size", "quantity", "price"
      FROM public."OrderDetails"
      WHERE "orderId" = $1
    `;

    const orderDetailsResult = await pool.query(orderDetailsQuery, [orderId]);
    const items = orderDetailsResult.rows;

    const orderWithItems = {
      ...order,
      items: items
    };

    res.json(orderWithItems);
  }
  catch (err) {
    console.error('Error getting coffee shop order', err);
    res.status(500).json({
      message: 'Problem getting coffee shop order',
      error: err,
    });
  }
});

router.post('/', async (req, res) => {
  const { customerId, items, total, status } = req.body;
  try {
    const orderHeaderQuery = `
      INSERT INTO public."Orders" ("customerId", "total", "status", "orderDate")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING "id"
    `;

    const orderHeaderResult = await pool.query(orderHeaderQuery, [customerId, total, status]);
    const orderId = orderHeaderResult.rows[0].id;

    for (const item of items) {
      const orderDetailsQuery = `
        INSERT INTO public."OrderDetails" ("orderId", "name", "size", "quantity", "price")
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(orderDetailsQuery, [orderId, item.name, item.size.label, item.quantity, item.size.price]);
    }

    res.status(201).json({ orderId: orderId, message: 'Order created successfully!' });
  }
  catch (err) {
    console.error('Error creating coffee shop order', err);
    res.status(500).json({
      message: 'Problem creating coffee shop order',
      error: err,
    });
  }
});

// Update a Coffee Shop Order
router.put('/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const { customerId, items, total, status } = req.body;
  console.log("--------------------ORDER RECEIVED---------------")
  console.log("OrderId: " + orderId + "\n");
  
  try {
    const orderUpdateQuery = `
      UPDATE public."Orders"
      SET "customerId" = $1, "total" = $2, "status" = $3
      WHERE "id" = $4
    `;
    await pool.query(orderUpdateQuery, [customerId, total, status, orderId]);

    console.log("Order has " + items.length + " items attached.");

    if (items.length > 0) {           
      for (const item of items) {
        console.log(item)
        const orderDetailsQuery = `
          UPDATE public."OrderDetails" 
          SET "orderId" = $1, "name" = $2, "size" = $3, "quantity" = $4, "price" = $5
          WHERE "id" = $6
        `;
    
        console.log(orderDetailsQuery);
        console.log(`${orderId}, ${item.name}, ${item.size.label}, ${item.quantity}, ${item.size.price}, ${item.id}`);
        
        await pool.query(orderDetailsQuery, [orderId, item.name, item.size, item.quantity, item.price, item.id]);
      }
    }

    res.status(200).json({ orderId: orderId, message: 'Order updated successfully!' });
  }
  catch (err) {
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

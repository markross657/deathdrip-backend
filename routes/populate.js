const express = require('express');
const router = express.Router();
const { pool } = require('pg');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const pool = require('../dynamoDbConfig');

const itemsToInsert = [
    {
        name: 'Espresso',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 2.5 },
            { label: 'Medium', price: 3.0 },
            { label: 'Large', price: 3.5 }
        ],
        description: 'A strong, concentrated coffee brewed by forcing hot water through finely-ground coffee beans.'
    },
    {
        name: 'Cappuccino',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 3.0 },
            { label: 'Medium', price: 3.5 },
            { label: 'Large', price: 4.0 }
        ],
        description: 'Espresso-based coffee with steamed milk and a layer of frothed milk.'
    },
    {
        name: 'Latte',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 3.0 },
            { label: 'Medium', price: 3.5 },
            { label: 'Large', price: 4.0 }
        ],
        description: 'A coffee drink made with espresso and steamed milk.'
    },
    {
        name: 'Macchiato',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 3.0 },
            { label: 'Medium', price: 3.5 },
            { label: 'Large', price: 4.0 }
        ],
        description: 'An espresso with a dash of foamed milk.'
    },
    {
        name: 'Mocha',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 3.5 },
            { label: 'Medium', price: 4.0 },
            { label: 'Large', price: 4.5 }
        ],
        description: 'Espresso with steamed milk, chocolate, and whipped cream.'
    },
    {
        name: 'Americano',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 2.5 },
            { label: 'Medium', price: 3.0 },
            { label: 'Large', price: 3.5 }
        ],
        description: 'Espresso with added hot water, resulting in a milder taste.'
    },
    {
        name: 'Flat White',
        category: 'Coffee',
        size: [
            { label: 'Small', price: 3.0 },
            { label: 'Medium', price: 3.5 },
            { label: 'Large', price: 4.0 }
        ],
        description: 'A coffee drink consisting of espresso with microfoam.'
    },
    {
        name: 'Donut',
        category: 'Snacks',
        price: 2.0,
        description: 'A small fried cake of sweetened dough, typically in the shape of a ball or ring.'
    },
    {
        name: 'Croissant',
        category: 'Snacks',
        price: 2.5,
        description: 'A buttery, flaky, crescent-shaped pastry.'
    },
    {
        name: 'Bagel',
        category: 'Snacks',
        price: 2.0,
        description: 'A bread product originating in the Jewish communities of Poland.'
    },
    {
        name: 'Muffin',
        category: 'Snacks',
        price: 2.5,
        description: 'A small, cup-shaped bread or cake.'
    },
    {
        name: 'Orange Juice',
        category: 'Drink',
        price: 3.0,
        description: 'Freshly squeezed juice from oranges.'
    },
    {
        name: 'Green Tea',
        category: 'Drink',
        price: 2.5,
        description: 'A type of tea that is made from unfermented leaves.'
    },
    {
        name: 'Iced Coffee',
        category: 'Drink',
        size: [
            { label: 'Small', price: 3.0 },
            { label: 'Medium', price: 3.5 },
            { label: 'Large', price: 4.0 }
        ],
        description: 'Chilled coffee served with ice.'
    },
    {
        name: 'Lemonade',
        category: 'Drink',
        price: 2.0,
        description: 'A sweetened beverage made from lemon juice.'
    },
    {
        name: 'Herbal Tea',
        category: 'Drink',
        price: 2.5,
        description: 'A beverage made from steeping herbs, spices, or other plant material.'
    }
];

// Function to insert documents into PostgreSQL
async function insertDocuments() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const itemData of itemsToInsert) {
            const { name, description, category, price, size } = itemData;
            const itemId = uuidv4();
            const itemInsertQuery = 'INSERT INTO menu_items (id, name, description, category, price) VALUES ($1, $2, $3, $4, $5)';
            await client.query(itemInsertQuery, [itemId, name, description, category, price]);

            if (size && size.length > 0) {
                for (const sizeItem of size) {
                    const sizeInsertQuery = 'INSERT INTO item_sizes (menu_item_id, label, price) VALUES ($1, $2, $3)';
                    await client.query(sizeInsertQuery, [itemId, sizeItem.label, sizeItem.price]);
                }
            }
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error inserting documents:', error.message);
        throw error; // Rethrow after logging
    } finally {
        client.release();
    }
}

// Endpoint to trigger data insertion
router.get('/populate', async (req, res) => {
    try {
        await insertDocuments();
        res.send('Documents inserted successfully!');
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

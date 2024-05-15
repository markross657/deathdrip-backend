const express = require("express");
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pool = require('../dynamoDbConfig');
const AWS = require('aws-sdk');
const storage = multer.memoryStorage();
const upload = multer({ storage });

AWS.config.update({
    accessKeyId: process.env.S3AccessKey,
    secretAccessKey: process.env.S3SecretKey,
    region: process.env.S3Region
});

const s3 = new AWS.S3();
const uploadToS3 = (key, buffer) => {
    console.log("Attempting to upload image to S3")
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: process.env.S3BucketName,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg'
        };

        // Upload image to S3
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Location);
            }
        });
    });
};

// Upload product image to S3
router.post("/product/:id", upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const productId = req.params.id;
        const imageKey = `products/${productId}-${uuidv4()}-${req.file.originalname}`;
        const imageUrl = await uploadToS3(imageKey, req.file.buffer);
        console.log("New Product Image URL: " + imageUrl);

        await pool.query(
            'UPDATE public."Products" SET "imageURL" = $1 WHERE id = $2',
            [imageUrl, productId]
        );

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ message: 'Failed to upload product image', error });
    }
});

// Upload user image to S3
router.post("/user/:id", upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.params.id;
        const imageKey = `users/${userId}-${uuidv4()}-${req.file.originalname}`;
        const imageUrl = await uploadToS3(imageKey, req.file.buffer);

        console.log("New Image URL: " + imageUrl);

        // Update user's imageURL field in the database
        await pool.query(
            'UPDATE public."Users" SET "imageURL" = $1 WHERE id = $2',
            [imageUrl, userId]
        );

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading user image:', error);
        res.status(500).json({ message: 'Failed to upload user image', error });
    }
});

module.exports = router;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3520;
const pool = require('./dynamoDbConfig');

pool.connect()
    .then(() => {
        console.log("Database Connected");
    })
    .catch((err) => {
        console.log("Error connecting to database.", err);
    });

// Express app setup
const app = express();
app.use('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
// Homepage
app.get('/', (req, res) => {
    res.send("This is the homepage");
});

// Commented out so not accessible
// const popRouter = require('./routes/populate');
// app.use("/populate", popRouter);

// Assuming you adapt the route files for PostgreSQL as well
const userRouter = require("./routes/user");
app.use("/user", userRouter);

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

const orderRouter = require("./routes/order");
app.use("/order", orderRouter);

const menuRouter = require("./routes/menu");
app.use("/menu", menuRouter);

// Run app (listen on port)
app.listen(port, () => {
    console.log("App is running on port ", port);
});

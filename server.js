require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3520;

// Express app setup
const app = express();
app.use('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.send("You have found the Deathdrip Coffee Co API");
});

const userRouter = require("./routes/user");
app.use("/user", userRouter);

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

const orderRouter = require("./routes/order");
app.use("/order", orderRouter);

const menuRouter = require("./routes/products");
app.use("/products", menuRouter);

const imageRouter = require("./routes/image");
app.use("/image", imageRouter);

// Run app (listen on port)
app.listen(port, () => {
    console.log("App is running on port ", port);
});

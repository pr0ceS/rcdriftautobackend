const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require('helmet');
const morgan = require('morgan');
const register = require("./routes/register");
const login = require("./routes/login");
const orders = require("./routes/orders");
const stripe = require("./routes/stripe");
const paypal = require("./routes/paypal")
const users = require("./routes/users");
const visitors = require('./routes/visitors');
const info = require('./routes/info');
const contact = require('./routes/contact')
const maillist = require('./routes/maillist')
const productsRoute = require("./routes/products");
const invoice = require("./routes/invoice");

const app = express();

require("dotenv").config();

app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '50000mb'}));
app.use(helmet());
app.use(morgan('tiny'));

app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/orders", orders);
app.use("/api/stripe", stripe);
app.use("/api/products", productsRoute);
app.use("/api/paypal", paypal)
app.use("/api/users", users);
app.use("/api/mail", maillist)
app.use("/api/visitor", visitors);
app.use("/api/contact", contact)
app.use("/api/info", info);
app.use("/api/invoice", invoice);


const uri = process.env.DB_URI;
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection established..."))
  .catch((error) => console.error("MongoDB connection failed:", error.message));

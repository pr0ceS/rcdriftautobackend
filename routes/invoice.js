const express = require('express');
const jwt = require("jsonwebtoken");
const { Invoice } = require('../models/Invoice');
const { User } = require("../models/user");
const { Product } = require('../models/Product');

const fs = require('fs');
const path = require('path');
const { isUser, isAdmin } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

router.get('/', async (req, res) => {
	const token = req.header("x-auth-token");
	const getProducts = true;
	if(!token) {
		res.send("Toegang geweigerd. Niet geverifieerd...");
	} else {
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const decoded = jwt.verify(token, jwtSecretKey);

		const user = await User.findById(decoded._id);
		if(user) {
			const invoices = await Invoice.find({userId: decoded._id})
			if(getProducts) {
				let uniqueProducts = [];
				invoices.forEach(invoice => {
					invoice.products.forEach(product => {
						if(!uniqueProducts.includes(product?.description ? product?.description : null)) {
							uniqueProducts.push(product?.description ? product?.description : null);
						}
					})
				})
				let productsArray = [];
				uniqueProducts.forEach(productName => {
					Product.findOne({name: productName}, (err, product) => {
						if(err) {
							console.log(err);
						} else {
							productsArray.push(product);
							if (productsArray.length === uniqueProducts.length) {
								productsArray[0] ? res.json({invoices: invoices, products: productsArray}) : res.send(invoices);
							}
						}
					})
				})
			} else {
				invoices ? res.send(invoices) : res.send("Geen facturen gevonden")
			}
		}
	}
})

router.get('/:ref/:id', isUser, async (req, res) => {
	const invoice = await Invoice.findOne({reference: req.params.ref})
	if(invoice._id) {
		res.download(path.join(__dirname + `/../pdf/invoice_F0000${invoice.invoiceNumber}_${invoice.reference}_${moment(invoice.Date).locale("nl").format("L")}.pdf`))
	} else {
		res.send("Toegang geweigerd. Niet geverifieerd...")
	}
})

router.get('/all', isAdmin, async (req, res) => {
	const Invoices = await Invoice.find({})
	res.json(Invoices);
})


module.exports = router;
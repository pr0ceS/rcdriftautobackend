const express = require('express');
const { Order } = require('../models/Order');
const { User } = require('../models/user');
const { Invoice } = require('../models/Invoice');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { createOrder, capturePayment } = require('../middleware/paypal-api');

const fs = require('fs');
const path = require('path');
const router = express.Router();

const moment = require('moment');
const { sendPaymentReceive } = require('../middleware/mailersend');
moment.locale('de');

require("dotenv").config();

router.post("/", async (req, res) => {
	const {cartItems, userId, shipping, payment_method, name, email, amount, paypal_id, paypal_payer_id } = req.body;
	const randomReference = await crypto.randomBytes(4).toString("hex");

	const lineItems = await cartItems.map(item => {
		return {
			description: item.name,
			amount_total: (item.price * 100),
			quantity: item.cartQuantity,
		}
	})

	if(lineItems[0]) {
	try {
		const newOrder = await new Order({
			userId: await userId ? await userId : "NOACCOUNT",
			products: await lineItems,
			subtotal: (await amount * 100),
			total: (await amount * 100),
			shipping: {
				shipping,
				name: await name,
				email: await email,
			},
			reference: randomReference.toUpperCase(),
			paypal_id: await paypal_id,
			paypal_payer_id: await paypal_payer_id,
			payment_method: await payment_method,
			payment_status: "paid",
		})

		await newOrder.save();

	} catch (error) {
		console.log(error);
	}

	try {
	const buyer = await userId ? await User.findById(await userId) : "NOACCOUNT";
	const invoiceAmount = await Invoice.countDocuments();

	if(buyer) {
		if(buyer?.straat) {
			const newInvoice = new Invoice({
				userId: await userId,
				reference: randomReference.toUpperCase(),
				addressB: {
					company: buyer?.company ? buyer?.company : await name ? await name : buyer?.name,
					straat: buyer?.straat ? buyer?.straat : "",
					huisnummer: buyer?.huisnummer ? buyer?.huisnummer : "",
					postcode: buyer?.postcode ? buyer?.postcode : "",
					stad: buyer?.stad ? buyer?.stad : "",
				},
				addressS: {
					company: "ErgotronKaufen.de",
					straat: "Jaargetijdenweg 29-3",
					postcode: "7532 SX",
					stad: "Enschede"
				},
				UST: buyer?.UST ? buyer?.UST : "",
				KVK: "88897818",
				BTW: "NL 004667125B52",
				IBAN: "NL19 ABNA 0603 9339 55",
				Date: Date.now(),
				paymentMethod: "paypal",
				shippingMethod: "DHL",
				invoiceNumber: (invoiceAmount + 1),
				products: await lineItems,
				subtotal: await amount * 100 * 0.79,
				total: await amount * 100,
			})
			
			const savedInvoice = await newInvoice.save();

			if(savedInvoice && userId) {
				try {
				const doc = new PDFDocument({ margin: 40, size: "A4",});

				doc.image(path.join(__dirname, "/../images/Logo.png"), 40, 30, {width: 150})
					.fontSize(20)
					.font("Helvetica")
					.text("RECHUNG", 40, 98, {fontWeight: 800})
					.fillColor('#000000')
					.font("Helvetica")
					.fontSize(10)
					.text('ErgotronKaufen.de', 200, 30, { align: 'right'})
					.text('Jaargetijdenweg 29-3,', 200, 42, { align: 'right' })
					.text('7532 SX Enschede', 200, 54, { align: 'right' })
					.text('KVK: 88897818', 200, 75, { align: 'right' })
					.text('BTW: NL 004667125B52', 200, 87, { align: 'right' })
					.text('IBAN: NL19 ABNA 0603 9339 55', 200, 99, { align: 'right' })
					.moveDown();

				doc
					.strokeColor("#aaaaaa")
					.lineWidth(1)
					.moveTo(40, 140)
					.lineTo(557, 140)
					.stroke()
					.moveDown();

				doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Rechnung an:", 40, 155)
					.fontSize(12)
					.font("Helvetica")
					.text(buyer?.company ? buyer?.company : await name ? await name : buyer?.name, 40, 170)
					.text(`${buyer?.straat} ${buyer?.huisnummer},`, 40, 185)
					.text(`${buyer?.postcode} ${buyer?.stad}`, 40, 200)
					.moveDown();

				if(buyer?.UST?.length > 3) {
					doc.fontSize(12)
						.font("Helvetica-Bold")
						.text("Ust-IdNr:", 330, 149)
						.font("Helvetica")
						.text(buyer.UST, 230, 149, {align: "right"})

					doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Rechnung Nr:", 330, 168)
					.text("Datum:", 330, 187)
					.text("Referenz:", 330, 207)

					.font("Helvetica")
					.text(`F0000${(invoiceAmount + 1)}`, 230, 168, {align: "right"})
					.text(moment(Date.now()).locale("de").format('L'), 230, 187, {align: "right"})
					.text(randomReference.toUpperCase(), 230, 207, {align: "right"})
					.moveDown();
				} else {
					doc
						.fontSize(12)
						.font("Helvetica-Bold")
						.text("Rechnung Nr:", 330, 158)
						.text("Datum:", 330, 177)
						.text("Referenz:", 330, 197)

						.font("Helvetica")
						.text(`F0000${(invoiceAmount + 1)}`, 230, 158, {align: "right"})
						.text(moment(Date.now()).locale("de").format('L'), 230, 177, {align: "right"})
						.text(randomReference.toUpperCase(), 230, 197, {align: "right"})
						.moveDown();
				}

				doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Rechnung Nr:", 330, 168)
					.text("Datum:", 330, 187)
					.text("Referenz:", 330, 207)

					.font("Helvetica")
					.text(`F0000${(invoiceAmount + 1)}`, 230, 168, {align: "right"})
					.text(moment(Date.now()).locale("de").format('L'), 230, 187, {align: "right"})
					.text(randomReference.toUpperCase(), 230, 207, {align: "right"})
					.moveDown();

				doc
					.strokeColor("#aaaaaa")
					.lineWidth(1)
					.moveTo(40, 225)
					.lineTo(557, 225)
					.stroke()
					.moveDown();

				doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Beschreibung", 40, 300, {fontWeight: 800})
					.text("Anzahl", 270, 300, {fontWeight: 800})
					.text("Stückpreis (€ )", 340, 300, {fontWeight: 800})
					.text("Gesamtbetrag (€ )", 453, 300, {fontWeight: 800})
					.moveDown();

				doc
					.strokeColor("#999999")
					.lineWidth(1)
					.moveTo(40, 318)
					.lineTo(557, 318)
					.stroke()
					.moveDown();
				
				let margin1 = 30;
				let totals = 0;
				let totalInSumme = 0;
				let tax = 0;

				doc.fontSize(10)
				doc.font("Helvetica")
					lineItems.push({
						amount_total: 949,
						quantity: 1,
						description: "DHL Versand",
					})
					lineItems.map((product, index) => {
						doc.text(product.description, 40, (298 + (index + 1) * margin1))
						doc.text(product.quantity, 0, (298 + (index + 1) * margin1), {align: "right", width: 307})
						doc.text((product.amount_total / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right", width: 422})
						doc.text(((product.amount_total * product.quantity) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right"})
						doc
						.strokeColor("#aaaaaa")
						.lineWidth(1)
						.moveTo(40, (317 + (index + 1) * margin1))
						.lineTo(557, (317 + (index + 1) * margin1))
						.stroke()
						doc.moveDown()
						totals = margin1 * (index + 1)
						totalInSumme = totalInSumme + (product?.amount_total * product?.quantity)

					})
				totals = totals
				doc.font("Helvetica")
				doc.text("In Summe", 0, (totals + 30 + 298), {align: "right", width: 422})
				doc.text("Gesamtbetrag Exkl. MwSt", 0, (totals + 47 + 298), {align: "right", width: 422})
				doc.font("Helvetica-Bold")
				doc.text("MwSt % ", 0, (totals + 64 + 298), {align: "right", width: 422})
				doc.text("Gesamtbetrag Inkl. MwSt", 0, (totals + 81 + 298), {align: "right", width: 422})
				doc.moveDown()

				doc.font("Helvetica")
				doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 30 + 298), {align: "right"})
				doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 47 + 298), {align: "right"})
				doc.font("Helvetica-Bold")
				doc.text(`${tax}%`, 0, (totals + 64 + 298), {align: "right"})
				doc.text("€ " + ((totalInSumme * (tax / 100) + totalInSumme) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 81 + 298), {align: "right"})

				doc.fontSize(10)
					.text(
						"Befreiung von der niederländischen Umsatzsteuer gemäß Artikel 25 des niederländischen Umsatzsteuergesetzes",
						0,
						780,
						{align: "center", width: 600}
					)
					
				doc.pipe(fs.createWriteStream(path.join(__dirname + `/../pdf/invoice_${`F0000${(invoiceAmount + 1)}`}_${randomReference.toUpperCase()}_${moment(Date.now()).locale("nl").format('L')}.pdf`)));
				doc.end();

				return new Promise((resolve, reject) => {
					doc.on('end', () => {
						fs.access(path.join(__dirname + `/../pdf/invoice_${`F0000${(invoiceAmount + 1)}`}_${randomReference.toUpperCase()}_${moment(Date.now()).locale("nl").format('L')}.pdf`), fs.constants.F_OK, (err) => {
							if (err) {
								console.log(err);
								reject(err);
							} else {
								console.log("SENTEMAIL")
								sendPaymentReceive(email, "Wir haben Ihre Bestellung erhalten!", savedInvoice)
								res.send("ok")
							}
						});
					});
				});

				} catch (error) {
					console.log(error);	
				}
			}
		} else {
			const customerInvoice = new Invoice({
				userId: await userId ? await userId : "NOACCOUNT",
				reference: randomReference.toUpperCase(),
				addressB: {
					company: buyer?.company ? buyer?.company : await name ? await name : buyer?.name,
					straat: await shipping?.address_line_1 ? await shipping?.address_line_1 : await shipping?.address?.address_line_1 && await shipping?.address_line_1 ,
					postcode: await shipping?.postal_code ? await shipping?.postal_code : await shipping?.address?.postal_code && await shipping?.address?.postal_code,
					stad: await shipping?.admin_area_2 ? await shipping?.admin_area_2 : await shipping?.address?.admin_area_2 && await shipping?.address?.admin_area_2,
				},
				addressS: {
					company: "ErgotronKaufen.de",
					straat: "Jaargetijdenweg 29-3",
					postcode: "7532 SX",
					stad: "Enschede"
				},
				UST: buyer.UST ? buyer.UST : "",
				KVK: "88897818",
				BTW: "NL 004667125B52",
				IBAN: "NL19 ABNA 0603 9339 55",
				Date: Date.now(),
				paymentMethod: "paypal",
				shippingMethod: "DHL",
				invoiceNumber: (invoiceAmount + 1),
				products: await lineItems,
				subtotal: await amount * 100 * 0.79,
				total: await amount * 100,
			})
			
			const savedInvoice = await customerInvoice.save();

			if(savedInvoice) {
				try {
				const doc = new PDFDocument({ margin: 40, size: "A4",});

				doc.image(path.join(__dirname, "/../images/Logo.png"), 40, 30, {width: 150})
					.fontSize(20)
					.font("Helvetica")
					.text("RECHUNG", 40, 98, {fontWeight: 800})
					.fillColor('#000000')
					.font("Helvetica")
					.fontSize(10)
					.text('ErgotronKaufen.de', 200, 30, { align: 'right'})
					.text('Jaargetijdenweg 29-3,', 200, 42, { align: 'right' })
					.text('7532 SX Enschede', 200, 54, { align: 'right' })
					.text('KVK: 88897818', 200, 75, { align: 'right' })
					.text('BTW: NL 004667125B52', 200, 87, { align: 'right' })
					.text('IBAN: NL19 ABNA 0603 9339 55', 200, 99, { align: 'right' })
					.moveDown();

				doc
					.strokeColor("#aaaaaa")
					.lineWidth(1)
					.moveTo(40, 140)
					.lineTo(557, 140)
					.stroke()
					.moveDown();

				doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Rechnung an:", 40, 155)
					.fontSize(12)
					.font("Helvetica")
					.text(buyer?.company ? buyer?.company : await name ? await name : buyer?.name, 40, 170)
					.text(await shipping.address_line_1 ? await shipping.address_line_1 : await shipping.address.address_line_1 && await shipping.address_line_1, 40, 185)
					.text(`${await shipping.postal_code ? await shipping.postal_code : await shipping.address.postal_code && await shipping.address.postal_code} ${await shipping.admin_area_2 ? await shipping.admin_area_2 : await shipping.address.admin_area_2 && await shipping.address.admin_area_2}`, 40, 200)
					.moveDown();
					
				if(buyer?.UST?.length > 3) {
					doc.fontSize(12)
						.font("Helvetica-Bold")
						.text("Ust-IdNr:", 330, 149)
						.font("Helvetica")
						.text(buyer?.UST, 230, 149, {align: "right"})

					doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Rechnung Nr:", 330, 168)
					.text("Datum:", 330, 187)
					.text("Referenz:", 330, 207)

					.font("Helvetica")
					.text(`F0000${(invoiceAmount + 1)}`, 230, 168, {align: "right"})
					.text(moment(Date.now()).locale("de").format('L'), 230, 187, {align: "right"})
					.text(randomReference.toUpperCase(), 230, 207, {align: "right"})
					.moveDown();
				} else {
					doc
						.fontSize(12)
						.font("Helvetica-Bold")
						.text("Rechnung Nr:", 330, 158)
						.text("Datum:", 330, 177)
						.text("Referenz:", 330, 197)

						.font("Helvetica")
						.text(`F0000${(invoiceAmount + 1)}`, 230, 158, {align: "right"})
						.text(moment(Date.now()).locale("de").format('L'), 230, 177, {align: "right"})
						.text(randomReference.toUpperCase(), 230, 197, {align: "right"})
						.moveDown();
				}


				doc
					.strokeColor("#aaaaaa")
					.lineWidth(1)
					.moveTo(40, 225)
					.lineTo(557, 225)
					.stroke()
					.moveDown();

				doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Beschreibung", 40, 300, {fontWeight: 800})
					.text("Anzahl", 270, 300, {fontWeight: 800})
					.text("Stückpreis (€ )", 340, 300, {fontWeight: 800})
					.text("Gesamtbetrag (€ )", 453, 300, {fontWeight: 800})
					.moveDown();

				doc
					.strokeColor("#999999")
					.lineWidth(1)
					.moveTo(40, 318)
					.lineTo(557, 318)
					.stroke()
					.moveDown();
				
				let margin1 = 30;
				let totals = 0;
				let totalInSumme = 0;
				let tax = 0;

				doc.fontSize(10)
				doc.font("Helvetica")
					lineItems.push({
						amount_total: 949,
						quantity: 1,
						description: "DHL Versand",
					})
					lineItems.map((product, index) => {
						doc.text(product.description, 40, (298 + (index + 1) * margin1))
						doc.text(product.quantity, 0, (298 + (index + 1) * margin1), {align: "right", width: 307})
						doc.text((product.amount_total / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right", width: 422})
						doc.text(((product.amount_total * product.quantity) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right"})

						doc
						.strokeColor("#aaaaaa")
						.lineWidth(1)
						.moveTo(40, (317 + (index + 1) * margin1))
						.lineTo(557, (317 + (index + 1) * margin1))
						.stroke()
						doc.moveDown()
						totals = margin1 * (index + 1)
						totalInSumme = totalInSumme + (product.amount_total * product.quantity)
					})
				totals = totals
				doc.font("Helvetica")
				doc.text("In Summe", 0, (totals + 30 + 298), {align: "right", width: 422})
				doc.text("Gesamtbetrag Exkl. MwSt", 0, (totals + 47 + 298), {align: "right", width: 422})
				doc.font("Helvetica-Bold")
				doc.text("MwSt % ", 0, (totals + 64 + 298), {align: "right", width: 422})
				doc.text("Gesamtbetrag Inkl. MwSt", 0, (totals + 81 + 298), {align: "right", width: 422})
				doc.moveDown()

				doc.font("Helvetica")
				doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 30 + 298), {align: "right"})
				doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 47 + 298), {align: "right"})
				doc.font("Helvetica-Bold")
				doc.text(`${tax}%`, 0, (totals + 64 + 298), {align: "right"})
				doc.text("€ " + ((totalInSumme * (tax / 100) + totalInSumme) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 81 + 298), {align: "right"})

				doc.fontSize(10)
					.text(
						"Befreiung von der niederländischen Umsatzsteuer gemäß Artikel 25 des niederländischen Umsatzsteuergesetzes",
						0,
						780,
						{align: "center", width: 600}
					)
					
				doc.pipe(fs.createWriteStream(path.join(__dirname + `/../pdf/invoice_${`F0000${(invoiceAmount + 1)}`}_${randomReference.toUpperCase()}_${moment(Date.now()).locale("nl").format('L')}.pdf`)));
				doc.end();

				return new Promise((resolve, reject) => {
					doc.on('end', () => {
						fs.access(path.join(__dirname + `/../pdf/invoice_${`F0000${(invoiceAmount + 1)}`}_${randomReference.toUpperCase()}_${moment(Date.now()).locale("nl").format('L')}.pdf`), fs.constants.F_OK, (err) => {
							if (err) {
								console.log(err);
								reject(err);
							} else {
								console.log("SENTEMAIL")
								sendPaymentReceive(email, "Wir haben Ihre Bestellung erhalten!", savedInvoice)
								res.send("ok")
							}
						});
					});
				});

				} catch (error) {
					console.log(error);	
				}
			}
		}
	}

	} catch (error) {
		console.log(error);		
	}
	}
});

router.post("/v2/create-paypal-order", async (req, res) => {
	try {
    const order = await createOrder(req.body);
    res.json(order);
  } catch (err) {
		console.log(err);
    res.status(500).send(err.message);
  }
})

router.post("/v2/capture-paypal-order", async (req, res) => {
	const { orderID } = req.body;
	console.log(req.body);
  try {
    const captureData = await capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
		console.log(err);
    res.status(500).send(err.message);
  }
})


module.exports = router;
const express = require("express");
const Stripe = require("stripe");
const { sendPaymentReceive } = require("../middleware/mailersend");
// const sendEmail = require("../middleware/sendEmail");
const { Order } = require("../models/Order");
const { Product } = require('../models/Product');
const { Invoice } = require('../models/Invoice');
const { User } = require("../models/user");
const crypto = require('crypto');

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const moment = require('moment');
moment.locale('nl');

// fs.createReadStream('')

require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_KEY);

const router = express.Router();

const imgData = "data:image/png;base64,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"

router.post("/create-checkout-session", async (req, res) => {

	// console.log(req.body);

	const taxRate = await stripe.taxRates.create({
		display_name: 'BTW',
		inclusive: true,
		percentage: 21,
		country: 'NL',
	});

  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId ? req.body.userId : "NOACCOUNT",
    },
  });

  const line_items = req.body.cartItems.map((item) => {
    return {
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          images: [item.image.url],
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.cartQuantity,
    };
  });

  // "sofort", "bancontact", "klarna", "customer_balance", "sepa_debit", "giropay", "eps",
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["bancontact", "ideal", "paypal", "klarna", "card"],
    shipping_address_collection: {
      allowed_countries: ["NL","DE", "BE"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "eur",
          },
          display_name: "Gratis Verzendkosten",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 3,
            },
            maximum: {
              unit: "business_day",
              value: 12,
            },
          },
        }}],
    line_items,
    mode: "payment",
    customer: customer.id,
    locale: "nl",
    allow_promotion_codes: true,
    success_url: `${process.env.CLIENT_URL}/betaald`,
    cancel_url: `${process.env.CLIENT_URL}/winkelwagen`,
  });

  // res.redirect(303, session.url);
  res.send({ url: session.url });
});

// Create order function

const createOrder = async (customer, data, line_items) => {
  const newOrder = await new Order({
    userId: await customer?.metadata?.userId,
    customerId: await data?.customer,
    paymentIntentId: await data?.payment_intent,
    products: await line_items?.data,
    subtotal: await data?.amount_subtotal,
    total: await data?.amount_total,
    shipping: await data?.customer_details,
    payment_method: "stripe",
    payment_status: await data?.payment_status,
  });

  try {
    const savedOrder = await newOrder.save();
    // await sendPaymentReceive(customer.email, "Your payment has been received", customer.id)
    // console.log("Processed Order:", savedOrder);
  } catch (err) {
    console.log(err);
  }
};

// Create Invoice function

const createInvoiceAndOrder = async (customer, data, lineItems) => {
	try {
	const randomReference = await crypto.randomBytes(4).toString("hex");
	const newOrder = await new Order({
    userId: await customer?.metadata?.userId ? await customer?.metadata?.userId : "NOACCOUNT",
    customerId: await data?.customer,
    paymentIntentId: await data?.payment_intent,
    products: await lineItems?.data,
    subtotal: await data?.amount_subtotal,
    total: await data?.amount_total,
    shipping: await data?.customer_details,
		reference: randomReference.toUpperCase(),
    payment_method: "stripe",
    payment_status: await data?.payment_status,
  });

	const savedOrder = await newOrder.save();

	const buyer = await customer?.metadata?.userId !== "NOACCOUNT" ? await User.findById(customer?.metadata?.userId) : "NOACCOUNT";
	const invoiceAmount = await Invoice.countDocuments();

		if(buyer) {
			if(buyer?.straat) {
				const newInvoice = new Invoice({
					userId: await customer?.metadata?.userId ? await customer?.metadata?.userId : "NOACCOUNT",
					reference: randomReference.toUpperCase(),
					addressB: {
						company: buyer?.company ? buyer?.company : await data?.shipping_details?.name ? await data?.shipping_details?.name : buyer?.name,
						straat: buyer?.straat ? buyer?.straat : "",
						huisnummer: buyer?.huisnummer ? buyer?.huisnummer : "",
						postcode: buyer?.postcode ? buyer?.postcode : "",
						stad: buyer?.stad ? buyer?.stad : "",
					},
					addressS: {
						company: "MKB-Trading",
						straat: "Jaargetijdenweg 29-3",
						postcode: "7532 SX",
						stad: "Enschede"
					},
					UST: buyer?.UST ? buyer?.UST : "",
					KVK: "88897818",
					BTW: "NL 004667125B52",
					Date: Date.now(),
					paymentMethod: Object.keys(data?.payment_method_options)?.toString() ? Object.keys(data.payment_method_options)?.toString() : "stripe",
					invoiceNumber: (invoiceAmount + 1),
					products: lineItems.data,
					subtotal: data?.amount_total * 0.79,
					total: data?.amount_total,
				})
				
				const savedInvoice = await newInvoice.save();

				if(savedInvoice && data?.customer_details) {
					try {
					const doc = new PDFDocument({ margin: 40, size: "A4",});

					doc.image(path.join(__dirname, "/../images/Logo2.png"), 40, 30, {width: 100})
						.fontSize(20)
						.font("Helvetica")
						.text("Factuur", 40, 98, {fontWeight: 800})
						.fillColor('#000000')
						.font("Helvetica")
						.fontSize(10)
						.text('MKB-Trading', 200, 30, { align: 'right'})
						.text('Jaargetijdenweg 29-3,', 200, 42, { align: 'right' })
						.text('7532 SX Enschede', 200, 54, { align: 'right' })
						.text('KVK: 88897818', 200, 75, { align: 'right' })
						.text('BTW: NL 004667125B52', 200, 87, { align: 'right' })
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
						.text("Factuur aan:", 40, 155)
						.fontSize(12)
						.font("Helvetica")
						.text(buyer?.company ? buyer?.company : data?.shipping_details?.name ? data?.shipping_details?.name : buyer?.name, 40, 170)
						.text(`${buyer?.straat} ${buyer?.huisnummer},`, 40, 185)
						.text(`${buyer?.postcode} ${buyer?.stad}`, 40, 200)
						.moveDown();
						
					if(buyer?.UST?.length > 3) {
					doc.fontSize(12)
						.font("Helvetica-Bold")
						.text("Factuurnummer:", 330, 149)
						.font("Helvetica")
						.text(buyer?.UST, 230, 149, {align: "right"})

					doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Factuurnummer:", 330, 168)
					.text("Datum:", 330, 187)
					.text("Referentie:", 330, 207)

					.font("Helvetica")
					.text(`F0000${(invoiceAmount + 1)}`, 230, 168, {align: "right"})
					.text(moment(Date.now()).locale("nl").format('L'), 230, 187, {align: "right"})
					.text(randomReference.toUpperCase(), 230, 207, {align: "right"})
					.moveDown();
				} else {
					doc
						.fontSize(12)
						.font("Helvetica-Bold")
						.text("Factuurnummer:", 330, 158)
						.text("Datum:", 330, 177)
						.text("Referentie:", 330, 197)

						.font("Helvetica")
						.text(`F0000${(invoiceAmount + 1)}`, 230, 158, {align: "right"})
						.text(moment(Date.now()).locale("nl").format('L'), 230, 177, {align: "right"})
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
						.text("Beschrijving", 40, 300, {fontWeight: 800})
						.text("Aantal", 270, 300, {fontWeight: 800})
						.text("Stukprijs (€ )", 340, 300, {fontWeight: 800})
						.text("Totaalbedrag (€ )", 453, 300, {fontWeight: 800})
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
						lineItems?.data?.push({
							amount_total: 0,
							quantity: 1,
							description: "Gratis Verzendkosten",
						})
						lineItems?.data?.map((product, index) => {
							doc.text(product?.description, 40, (298 + (index + 1) * margin1))
							doc.text(product?.quantity, 0, (298 + (index + 1) * margin1), {align: "right", width: 307})
							doc.text((product?.amount_total / product?.quantity / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right", width: 422})
							doc.text((product?.amount_total / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right"})
							doc
							.strokeColor("#aaaaaa")
							.lineWidth(1)
							.moveTo(40, (317 + (index + 1) * margin1))
							.lineTo(557, (317 + (index + 1) * margin1))
							.stroke()
							doc.moveDown()
							totals = margin1 * (index + 1)
							totalInSumme = totalInSumme + product?.amount_total
						})
					totals = totals
					doc.font("Helvetica")
					doc.text("Subtotaal", 0, (totals + 30 + 298), {align: "right", width: 422})
					doc.text("Totaalbedrag Excl. BTW", 0, (totals + 47 + 298), {align: "right", width: 422})
					doc.font("Helvetica-Bold")
					doc.text("BTW % ", 0, (totals + 64 + 298), {align: "right", width: 422})
					doc.text("Totaalbedrag Incl. BTW", 0, (totals + 81 + 298), {align: "right", width: 422})
					doc.moveDown()

					doc.font("Helvetica")
					doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 30 + 298), {align: "right"})
					doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 47 + 298), {align: "right"})
					doc.font("Helvetica-Bold")
					doc.text(`${tax}%`, 0, (totals + 64 + 298), {align: "right"})
					doc.text("€ " + ((totalInSumme * (tax / 100) + totalInSumme) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 81 + 298), {align: "right"})

					doc.fontSize(10)
						.text(
							"Vrijstelling van Nederlandse btw overeenkomstig artikel 25 van de Nederlandse btw-wet",
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
									reject(err);
								} else {
									resolve(savedInvoice);
								}
							});
						});
					});

					} catch (error) {
						console.log(error);	
					}
				}

			} else {
				const randomReference = await crypto.randomBytes(4).toString("hex");
				const customerInvoice = new Invoice({
					userId: customer.metadata.userId,
					reference: randomReference.toUpperCase(),
					addressB: {
						company: buyer?.company ? buyer?.company : data?.shipping_details?.name ? data?.shipping_details?.name : buyer?.name,
						straat: data?.customer_details?.address?.line1,
						postcode: data?.customer_details?.address?.postal_code,
						stad: data?.customer_details?.address?.city,
					},
					addressS: {
						company: "MKB-Trading",
						straat: "Jaargetijdenweg 29-3",
						postcode: "7532 SX",
						stad: "Enschede"
					},
					UST: buyer?.UST ? buyer?.UST : "",
					KVK: "88897818",
					BTW: "NL 004667125B52",
					Date: Date.now(),
					paymentMethod: Object.keys(data?.payment_method_options)?.toString() ? Object.keys(data.payment_method_options)?.toString() : "stripe",
					invoiceNumber: (invoiceAmount + 1),
					products: lineItems.data,
					subtotal: data?.amount_total,
					total: data?.amount_total,
				})
				
				const savedInvoice = await customerInvoice.save();

				if(savedInvoice) {
					try {
					const doc = new PDFDocument({ margin: 40, size: "A4",});

					doc.image(path.join(__dirname, "/../images/Logo2.png"), 40, 30, {width: 100})
						.fontSize(20)
						.font("Helvetica")
						.text("Factuur", 40, 98, {fontWeight: 800})
						.fillColor('#000000')
						.font("Helvetica")
						.fontSize(10)
						.text('MKB-Trading', 200, 30, { align: 'right'})
						.text('Jaargetijdenweg 29-3,', 200, 42, { align: 'right' })
						.text('7532 SX Enschede', 200, 54, { align: 'right' })
						.text('KVK: 88897818', 200, 75, { align: 'right' })
						.text('BTW: NL 004667125B52', 200, 87, { align: 'right' })
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
						.text("Factuur aan:", 40, 155)
						.fontSize(12)
						.font("Helvetica")
						.text(buyer?.company ? buyer?.company : await data.customer_details.name ? await data.customer_details.name : buyer?.name, 40, 170)
						.text(data?.customer_details?.address?.line1, 40, 185)
						.text(`${data?.customer_details?.address?.postal_code} ${data.customer_details.address.city}`, 40, 200)
						.moveDown();
						
				if(buyer?.UST?.length > 3) {
					doc.fontSize(12)
						.font("Helvetica-Bold")
						.text("Factuurnummer:", 330, 149)
						.font("Helvetica")
						.text(buyer?.UST, 230, 149, {align: "right"})

					doc
					.fontSize(12)
					.font("Helvetica-Bold")
					.text("Factuurnummer:", 330, 168)
					.text("Datum:", 330, 187)
					.text("Referentie:", 330, 207)

					.font("Helvetica")
					.text(`F0000${(invoiceAmount + 1)}`, 230, 168, {align: "right"})
					.text(moment(Date.now()).locale("nl").format('L'), 230, 187, {align: "right"})
					.text(randomReference.toUpperCase(), 230, 207, {align: "right"})
					.moveDown();
				} else {
					doc
						.fontSize(12)
						.font("Helvetica-Bold")
						.text("Factuurnummer:", 330, 158)
						.text("Datum:", 330, 177)
						.text("Referentie:", 330, 197)

						.font("Helvetica")
						.text(`F0000${(invoiceAmount + 1)}`, 230, 158, {align: "right"})
						.text(moment(Date.now()).locale("nl").format('L'), 230, 177, {align: "right"})
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
						.text("Beschrijving", 40, 300, {fontWeight: 800})
						.text("Aantal", 270, 300, {fontWeight: 800})
						.text("Stukprijs (€ )", 340, 300, {fontWeight: 800})
						.text("Totaalbedrag (€ )", 453, 300, {fontWeight: 800})
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
						lineItems?.data?.push({
							amount_total: 0,
							quantity: 1,
							description: "Gratis Verzendkosten",
						})
						lineItems?.data?.map((product, index) => {
							doc.text(product?.description, 40, (298 + (index + 1) * margin1))
							doc.text(product?.quantity, 0, (298 + (index + 1) * margin1), {align: "right", width: 307})
							doc.text((product?.amount_total / product?.quantity / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right", width: 422})
							doc.text((product?.amount_total / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right"})
							doc
							.strokeColor("#aaaaaa")
							.lineWidth(1)
							.moveTo(40, (317 + (index + 1) * margin1))
							.lineTo(557, (317 + (index + 1) * margin1))
							.stroke()
							doc.moveDown()
							totals = margin1 * (index + 1)
							totalInSumme = totalInSumme + product?.amount_total
						})
					totals = totals
					doc.font("Helvetica")
					doc.text("Subtotaal", 0, (totals + 30 + 298), {align: "right", width: 422})
					doc.text("Totaalbedrag Excl. BTW", 0, (totals + 47 + 298), {align: "right", width: 422})
					doc.font("Helvetica-Bold")
					doc.text("BTW % ", 0, (totals + 64 + 298), {align: "right", width: 422})
					doc.text("Totaalbedrag Incl. BTW", 0, (totals + 81 + 298), {align: "right", width: 422})
					doc.moveDown()

					doc.font("Helvetica")
					doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 30 + 298), {align: "right"})
					doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 47 + 298), {align: "right"})
					doc.font("Helvetica-Bold")
					doc.text(`${tax}%`, 0, (totals + 64 + 298), {align: "right"})
					doc.text("€ " + ((totalInSumme * (tax / 100) + totalInSumme) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 81 + 298), {align: "right"})

					doc.fontSize(10)
						.text(
							"Vrijstelling van Nederlandse btw overeenkomstig artikel 25 van de Nederlandse btw-wet",
							0,
							780,
							{align: "center", width: 600}
						)
						
					doc.pipe(fs.createWriteStream(path.join(__dirname + `/../pdf/invoice_${`F0000${(invoiceAmount + 1)}`}_${randomReference.toUpperCase()}_${moment(Date.now()).locale("nl").format('L')}.pdf`)))
					doc.end();

					return new Promise((resolve, reject) => {
						doc.on('end', () => {
							fs.access(path.join(__dirname + `/../pdf/invoice_${`F0000${(invoiceAmount + 1)}`}_${randomReference.toUpperCase()}_${moment(Date.now()).locale("nl").format('L')}.pdf`), fs.constants.F_OK, (err) => {
								if (err) {
									reject(err);
								} else {
									resolve(savedInvoice);
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

// Stripe webhoook

router.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;


    // Check if webhook signing is configured.
    let webhookSecret;
    //webhookSecret = process.env.STRIPE_WEB_HOOK;

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed:  ${err}`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data.object;
			// console.log(event.data.object);
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data.object;
      eventType = req.body.type;
    }

    // Handle the checkout.session.completed event
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then(async (customer) => {
          try {
            // CREATE ORDER
            stripe.checkout.sessions.listLineItems(
              data.id,
              {},
              function (err, lineItems) {
                // console.log("line items", lineItems);
								// sendEmail(customer.email, "Uw Gunblaster.nl bestelling!", "Uw bestelling is ontvangen en zal zo spoedig mogelijk verzonden worden. Klik hieronder om uw bestellingstatus te bekijken.")
								createInvoiceAndOrder(customer, data, lineItems)
									.then((savedInvoice) => sendPaymentReceive(customer?.email, "We hebben uw bestelling ontvangen!", savedInvoice))
									.catch((e) => console.log(e));

              }
            );
          } catch (err) {
            console.log(typeof createOrder);
            console.log(err);
          }
        })
        .catch((err) => console.log(err.message));
    }

    res.status(200).end();
  }
);

// router.post('/invoice', (req, res) => {

// 	const data = [
// 		{
// 			amount_total: 4999,
// 			description: "Ergotron LX Tischklemme",
// 			quantity: 1,
// 		},
// 		{
// 			amount_total: 5999,
// 			description: "Ergotron LX Side-by-Side Tischklemme",
// 			quantity: 3,
// 		},
// 		{
// 			amount_total: 12999,
// 			description: "Ergotron NEO-FLEX",
// 			quantity: 3,
// 		},
// 		{
// 			amount_total: 949,
// 			description: "DHL Versand",
// 			quantity: 1,
// 		}
// 	]

// 	const doc = new PDFDocument({ margin: 40, size: "A4",});

// 	doc.image(path.join(__dirname, "/../images/Logo.png"), 40, 30, {width: 150})
// 		.fontSize(20)
// 		.font("Helvetica")
// 		.text("RECHUNG", 40, 98, {fontWeight: 800})
// 		.fillColor('#000000')
// 		.font("Helvetica")
// 		.fontSize(10)
// 		.text('ErgotronKaufen.de', 200, 30, { align: 'right'})
// 		.text('Jaargetijdenweg 29-3,', 200, 42, { align: 'right' })
// 		.text('7532 SX Enschede', 200, 54, { align: 'right' })
// 		.text('KVK: 88897818', 200, 75, { align: 'right' })
// 		.text('BTW: NL 004667125B52', 200, 87, { align: 'right' })
// 		.text('IBAN: NL19 ABNA 0603 9339 55', 200, 99, { align: 'right' })
// 		.moveDown();

// 	doc
// 		.strokeColor("#aaaaaa")
// 		.lineWidth(1)
// 		.moveTo(40, 140)
// 		.lineTo(557, 140)
// 		.stroke()
// 		.moveDown();

// 	doc
// 		.fontSize(12)
// 		.font("Helvetica-Bold")
// 		.text("Rechnung an:", 40, 155)
// 		.fontSize(12)
// 		.font("Helvetica")
// 		.text("MKB-Trading", 40, 170)
// 		.text("Ridderstraße 21,", 40, 185)
// 		.text("48683 Ahaus", 40, 200)
// 		.moveDown();
		
// 	doc
// 		.fontSize(12)
// 		.font("Helvetica-Bold")
// 		.text("Ust-IdNr:", 330, 149)
// 		.text("Rechnung Nr:", 330, 168)
// 		.text("Datum:", 330, 187)
// 		.text("Referenz:", 330, 207)

// 		.font("Helvetica")
// 		.text("DE134774317", 230, 149, {align: "right"})
// 		.text("F00002", 230, 168, {align: "right"})
// 		.text("27/03/2023", 230, 187, {align: "right"})
// 		.text("0DFDCC05", 230, 207, {align: "right"})
// 		.moveDown();

// 	doc
// 		.strokeColor("#aaaaaa")
// 		.lineWidth(1)
// 		.moveTo(40, 225)
// 		.lineTo(557, 225)
// 		.stroke()
// 		.moveDown();

// 	doc
// 		.fontSize(12)
// 		.font("Helvetica-Bold")
// 		.text("Beschreibung", 40, 300, {fontWeight: 800})
// 		.text("Anzahl", 270, 300, {fontWeight: 800})
// 		.text("Stückpreis (€ )", 340, 300, {fontWeight: 800})
// 		.text("Gesamtbetrag (€ )", 453, 300, {fontWeight: 800})
// 		.moveDown();

// 	doc
// 		.strokeColor("#999999")
// 		.lineWidth(1)
// 		.moveTo(40, 318)
// 		.lineTo(557, 318)
// 		.stroke()
// 		.moveDown();
	
// 	let margin1 = 30;
// 	let totals = 0;
// 	let totalInSumme = 0;
// 	let tax = 0;

// 	doc.fontSize(10)
// 	doc.font("Helvetica")
// 		data.map((product, index) => {
// 			doc.text(product.description, 40, (298 + (index + 1) * margin1))
// 			doc.text(product.quantity, 0, (298 + (index + 1) * margin1), {align: "right", width: 307})
// 			doc.text((product.amount_total / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right", width: 422})
// 			doc.text((product.amount_total / 100 * product.quantity).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (298 + (index + 1) * margin1), {align: "right"})
// 			doc
// 			.strokeColor("#aaaaaa")
// 			.lineWidth(1)
// 			.moveTo(40, (317 + (index + 1) * margin1))
// 			.lineTo(557, (317 + (index + 1) * margin1))
// 			.stroke()
// 			doc.moveDown()
// 			totals = margin1 * (index + 1)
// 			totalInSumme = totalInSumme + product.amount_total * product.quantity
// 		})
// 	totals = totals
// 	doc.font("Helvetica")
// 	doc.text("In Summe", 0, (totals + 30 + 298), {align: "right", width: 422})
// 	doc.text("Gesamtbetrag Exkl. MwSt", 0, (totals + 47 + 298), {align: "right", width: 422})
// 	doc.font("Helvetica-Bold")
// 	doc.text("MwSt % ", 0, (totals + 64 + 298), {align: "right", width: 422})
// 	doc.text("Gesamtbetrag Inkl. MwSt", 0, (totals + 81 + 298), {align: "right", width: 422})
// 	doc.moveDown()

// 	doc.font("Helvetica")
// 	doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 30 + 298), {align: "right"})
// 	doc.text("€ " + (totalInSumme / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 47 + 298), {align: "right"})
// 	doc.font("Helvetica-Bold")
// 	doc.text(`${tax}%`, 0, (totals + 64 + 298), {align: "right"})
// 	doc.text("€ " + ((totalInSumme * (tax / 100) + totalInSumme) / 100).toLocaleString('nl-nl', { maximumFractionDigits: 2, minimumFractionDigits: 2}), 0, (totals + 81 + 298), {align: "right"})

// 	doc.fontSize(10)
// 		.text(
// 			"Befreiung von der niederländischen Umsatzsteuer gemäß Artikel 25 des niederländischen Umsatzsteuergesetzes",
// 			0,
// 			780,
// 			{align: "center", width: 600}
// 		)
		
// 	doc.pipe(fs.createWriteStream(path.join(__dirname + `/../pdf/invoice.pdf`)));
// 	doc.end();

// 	res.send("OK")
// })

module.exports = router;

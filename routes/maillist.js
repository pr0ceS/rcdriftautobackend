const express = require('express');
const { isAdmin } = require('../middleware/auth');
const { Mail } = require('../models/Mail');

const router = express.Router();

router.post("/", async (req, res) => {
	const {email} = req.body;

	if (!email) {
		res.json({message: "Voer een e-mail in"})
	} else if (email.length > 100) {
		res.json({message: "Karakterlengte overschreden"})
	} else {
		try {
			const newMail = new Mail({
				email: email
			})

			await newMail.save();
			res.json({message: "Succesvol ingeschreven"})
		} catch (error) {
			console.log(error);
			res.json({message: error});
		}
	}
})

router.get('/', isAdmin, async (req, res) => {
	const mails = await Mail.find({})
	res.json(mails);	
})

module.exports = router;
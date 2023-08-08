const express = require('express');
const { Contact }= require('../models/Contact');
const { Mail } = require('../models/Mail');
const { isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post('/', async (req, res) => {
	const {email, name, message} = req.body;

	if(!email || !name || !message) {
		res.status(200).json({message: "Vul alle velden in"});
	}

	else if(email.length > 100 || name.length > 100 || message.length > 1000) {
		res.status(200).json({message: "Karakterlengte overschreden"});
	}

	else {
		try {
			const newMail = Mail({ email: email })
			
			const newContact = new Contact({
				email: email,
				name: name,
				message: message
			})
			
			await newMail.save()
			await newContact.save();
			res.json({message: "Succesvol verzonden"})
		} catch (error) {
			console.log(error);
			res.json({message: error});
		}
	}
})

router.get("/", isAdmin, async (req, res) => {
	const Contacts = await Contact.find({});
	res.json(Contacts);
})

module.exports = router;
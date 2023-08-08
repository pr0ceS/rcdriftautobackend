const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const Joi = require("joi");
const express = require("express");
const generateAuthToken = require("../utils/generateAuthToken");
const { Mail } = require("../models/Mail");
const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, password, isCompany, company, straat, huisnummer, postcode, stad, UST, phoneNumber } = req.body;
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(3).max(200).required().email(),
    password: Joi.string().min(6).max(200).required(),
    isCompany: Joi.boolean(),
		company: Joi.string().optional().allow('').min(3).max(200),
    straat: Joi.string().optional().allow('').min(3).max(200),
    huisnummer: Joi.string().optional().allow('').min(3).max(200),
    postcode: Joi.string().optional().allow('').min(3).max(200),
    stad: Joi.string().optional().allow('').min(3).max(200),
    UST: Joi.string().optional().allow('').min(0).max(200),
    phoneNumber: Joi.string().optional().allow('').min(3).max(200),
  });

  const { error } = schema.validate(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  if (isCompany === true) {
    if (!company || !straat || !huisnummer || !postcode || !stad || !UST || !phoneNumber) {
      res.status(400).send("Voer alle gegevens van je bedrijf in")
    }
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("Gebruiker bestaat al");


  user = new User({
    name: name,
    email: email,
    password: password,
    isCompany: isCompany,
		company: company,
    straat: straat,
    huisnummer: huisnummer,
    postcode: postcode,
    stad: stad,
    UST: UST,
    phoneNumber: phoneNumber,
  });

  const newMail = Mail({ email: email })
  await newMail.save()

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = generateAuthToken(user);

  res.send(token);
});

module.exports = router;

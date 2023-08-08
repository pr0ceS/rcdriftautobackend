const express = require('express');
const { isAdmin } = require('../middleware/auth');
const { Ip } = require('../models/Ip');
const server = require('os')
const router = express.Router();

router.get('/', isAdmin, async (req, res) => {
	try {
		let information = [{
			os: server.hostname(),
			memory: server.freemem(),
			uptime: server.uptime(),
		}]
		
		res.status(200).json(information);
	} catch (error) {
		res.status(500).send(error)	
	}
})

router.get('/ip', isAdmin, async (req, res) => {
	const ipAddresses = await Ip.find({})
	res.json(ipAddresses);
})

router.post('/ip', async (req, res) => {
	const ipAddress = new Ip({
		ipAddress: req.ip
	}).save();
	res.send("OK");
})

module.exports = router;
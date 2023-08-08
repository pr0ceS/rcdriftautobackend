const express = require('express');
const { isAdmin } = require('../middleware/auth');
const { Visitor } = require('../models/Visitor');
const router = express.Router();


router.post('/', async (req, res) => {

	let visitors = await Visitor.findOne({name: "gunblaster"});

	if(visitors == null) {
		const beginCount = new Visitor({
			name: "gunblaster",
			count: 1
		})
		beginCount.save();
		res.status(200).send("OK");
	} else {
		visitors.count += 1;
		visitors.save();
		res.status(200).send("OK");
	}
})

router.get('/', isAdmin, async (req, res) => {
	let visitors = await Visitor.findOne({name: "gunblaster"});

	if(visitors == null) {
		res.status(200).json(0)
	} else {
		res.status(200).json(visitors.count);
	}

})

module.exports = router;
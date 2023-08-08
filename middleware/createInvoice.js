const { Invoice } = require('../models/Invoice');
const { User } = require("../models/user");

const createInvoice = async (userId) => {
	const buyer = User.findById({ userId })
}

module.exports = createInvoice;
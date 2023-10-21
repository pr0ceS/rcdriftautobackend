require('dotenv').config()
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const fs = require('fs');
const path = require('path');


const moment = require('moment');
moment.locale('nl');

const mailerSend = new MailerSend({
	apiKey: process.env.MAIL_KEY,
});

const sendPaymentReceive = async (email, subject, invoice) => {
	try {
		const sentFrom = new Sender("noreply@rcdriftauto.nl", "RCDriftAuto.nl")

		const recipients = [
			new Recipient(email, await invoice?.shipping?.name ? await invoice?.shipping?.name : await email)
		];
		
		const variables = [
			{
				email: await email,
				substitutions: [
					{
						var: 'order_number',
						value: await invoice?.reference
					}
				],
			}
		];
		
		const emailParams = await new EmailParams()
			.setFrom(sentFrom)
			.setTo(recipients)
			.setReplyTo(sentFrom)
			.setSubject(await subject)
			.setTemplateId('v69oxl5vx8d4785k')
			.setVariables(variables)
			.setAttachments([
				{
					filename: `invoice_F0000${await invoice?.invoiceNumber}_${await invoice?.reference}_${moment(await invoice?.Date).locale("nl").format('L')}.pdf`,
					content: fs.readFileSync(path.join(__dirname + `/../pdf/invoice_F0000${await invoice?.invoiceNumber}_${await invoice?.reference}_${moment(await invoice?.Date).locale("nl").format('L')}.pdf`)).toString('base64'),
					type: "application/pdf"
				}
			]);
		
		await mailerSend.email.send(emailParams);
	} catch (error) {
		console.error(error);
	}
}

const sendOrderShipped = async (email, subject, invoice) => {
	try {
		const sentFrom = new Sender("noreply@rcdriftauto.nl", "RCDriftAuto.nl")

		const recipients = [
			new Recipient(email, await invoice?.shipping?.name ? await invoice?.shipping?.name : await email)
		];
		
		const variables = [
			{
				email: await email,
				substitutions: [
					{
						var: 'delivery_date',
						value: moment(Date.now()).add(4, 'days').locale("nl").format('LL')
					},
				],
			}
		];
		
		const emailParams = await new EmailParams()
			.setFrom(sentFrom)
			.setTo(recipients)
			.setReplyTo(sentFrom)
			.setSubject(await subject)
			.setTemplateId('z86org88r9zgew13')
			.setVariables(variables)
		
		await mailerSend.email.send(emailParams);
	} catch (error) {
		console.log(error);
	}
}

const sendOrderDelivered = async (email, subject, invoice) => {
	try {
		const sentFrom = new Sender("noreply@rcdriftauto.nl", "RCDriftAuto.nl")

		const recipients = [
			new Recipient(email, await invoice?.shipping?.name ? await invoice?.shipping?.name : await email)
		];
		
		const emailParams = await new EmailParams()
			.setFrom(sentFrom)
			.setTo(recipients)
			.setReplyTo(sentFrom)
			.setSubject(await subject)
			.setTemplateId('zr6ke4nw79y4on12')
		
		await mailerSend.email.send(emailParams);
	} catch (error) {
		console.log(error);
	}
}

module.exports = {
	sendPaymentReceive,
	sendOrderShipped,
	sendOrderDelivered,
}
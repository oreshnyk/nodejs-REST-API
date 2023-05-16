const SENDGRID_API_KEY = "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";
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(SENDGRID_API_KEY);
require("dotenv").config();

const sendEmail = async (data) => {
    const email = {
        ...data, from: "testtestpost357@gmail.com"
    };
    await sgMail.send(email);
    return true;
}

  module.exports = sendEmail;
const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {

    const transporter = nodemailer.createTransport({

        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        },
        family: 4,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,

    });

    await transporter.sendMail({

        from: process.env.EMAIL,

        to: email,

        subject,

        text

    });

};

module.exports = sendEmail;
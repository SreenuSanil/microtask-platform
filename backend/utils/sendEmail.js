const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`📧 Preparing to send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("EMAIL_USER or EMAIL_PASS not set in environment variables");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log(`📧 Transporter created, verifying connection...`);
    await transporter.verify();
    console.log(`📧 Connection verified, sending email...`);

    const info = await transporter.sendMail({
      from: `"TaskNest-MicroTask Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to: ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed to send to: ${to}`);
    console.error("Error details:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};

module.exports = sendEmail;


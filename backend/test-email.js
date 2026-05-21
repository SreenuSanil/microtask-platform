const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('\nTesting email configuration...');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration FAILED:');
    console.error(error);
  } else {
    console.log('✅ Email configuration is VALID');
    
    // Try sending a test email
    transporter.sendMail({
      from: `"TaskNest Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email',
      html: '<h1>This is a test email</h1>',
    }).then(info => {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', info.messageId);
    }).catch(err => {
      console.error('❌ Test email FAILED:');
      console.error(err);
    });
  }
});

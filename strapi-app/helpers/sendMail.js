const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

function setupMailTransport() {
  return nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key: process.env.MAIL_KEY,
      },
    }),
  );
}

module.exports = function sendMail({
  to,
  subject,
  text,
}) {
  if (!to || !subject || !text) {
    console.log('Erro: recipiente, assunto ou texto não especificado.');
    return null;
  }
  const mailOptions = {
    to,
    from: 'csawiki@csawiki.com',
    subject,
    text,
  };
  return setupMailTransport().sendMail(mailOptions);
};

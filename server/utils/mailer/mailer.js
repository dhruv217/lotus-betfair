'use strict'
const nodemailer = require('nodemailer')
const config = require('../../config/config')

class Mailer {
  constructor () {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.auth
    })
  }

  sendMail (from, to, subject, html, callback) {
    const mailOptions = {
      from: '"' + from + '" <' + config.smtp.auth.user + '>',
      to,
      subject,
      html
    }

    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) return callback(error)
      callback(null, true)
    })
  }
}

module.exports = Mailer

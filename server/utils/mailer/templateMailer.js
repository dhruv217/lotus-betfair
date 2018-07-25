'use strict'
const config = require('../../config/config')
const fs = require('fs')
const path = require('path')
const cleanCss = new (require('clean-css'))()

const Mailer = require('./mailer')
const Renderer = require('./render')

class TemplateMailer {
  constructor () {
    this.mailer = new Mailer()
    this.renderer = new Renderer()
    this.baseDatas = {
      'company': config.company,
      'attachments': {
        'logo': this.base64Encode('views/base-template/images/logo.png')
      }
    }
  }

  renderAndSendMail (datas, callback) {
    // merge datas
    datas = this.mergeAinB(this.baseDatas, datas)

    // load Mustache templates
    const baseTemplate = Buffer.from(fs.readFileSync(path.resolve(__dirname, 'views/base-template/index.html'))).toString('utf-8')
    const contentTemplate = Buffer.from(fs.readFileSync(path.resolve(__dirname, 'views/contents/' + datas.metas.template + '/index.html'))).toString('utf-8')

    // load CSS
    datas.css = cleanCss.minify(Buffer.from(fs.readFileSync(path.resolve(__dirname, 'views/base-template/index.css'))).toString('utf-8')).styles

    // render templates
    datas.content = this.renderer.render(contentTemplate, datas)
    const rendered = this.renderer.render(baseTemplate, datas)

    // send mail
    const from = datas.company.name + ' ' + datas.company.product.name
    this.mailer.sendMail(from, datas.user.email, datas.metas.subject, rendered,
      function (err, success) {
        if (err) return callback(err)
        callback(null, success)
      })
  }

  // Merge object o1 (strong) into o2 (weak) allowing object complexity of level 2, else override
  mergeAinB (o1, o2) {
    for (let key in o1) {
      if (!o2.hasOwnProperty(key)) {
        o2[key] = o1[key]
      } else if (typeof o2[key] === 'object' && typeof o1[key] === 'object') {
        for (let key2 in o1[key]) {
          o2[key][key2] = o1[key][key2]
        }
      }
    }
    return o2
  }

  // Encode file in base 64
  base64Encode (file) {
    let bitmap = fs.readFileSync(path.resolve(__dirname, file))
    return Buffer.from(bitmap).toString('base64')
  }
}

module.exports = TemplateMailer

/* Exemple (reset password)
const datas = {
  'user': {
    'email': 'cavin.pierre@gmail.com',
    'name': 'Pierre'
  },
  'metas': {
    'template': 'auth/reset-password',
    'subject': 'Password Reset'
  },
  'links': {
    'resetPassword': 'https://google.com'
  }
}

const templateMailer = new TemplateMailer()
templateMailer.renderAndSendMail(datas)
*/

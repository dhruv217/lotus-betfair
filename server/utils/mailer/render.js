'use strict'
const mustache = require('mustache')

class Renderer {
  render (template, datas) {
    return mustache.render(template, datas)
  }
}

module.exports = Renderer

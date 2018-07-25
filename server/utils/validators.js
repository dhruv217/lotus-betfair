'use strict'
let emailValidator = (email) => {
  let re = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/g)
  return re.test(email)
}

const Validators = {
  emailValidator: emailValidator
}

module.exports = Validators

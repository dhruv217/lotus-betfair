let errorsParser = (errors) => {
  let formattedErrors = {}
  Object.keys(errors).forEach(field => {
    formattedErrors[field] = errors[field].message
  })
  return formattedErrors
}

module.exports = errorsParser

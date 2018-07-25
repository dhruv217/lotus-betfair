'use strict'
let passport = require('passport')

let authMiddleware = function (req, res, next) {
  passport.authenticate('jwt', { session: false }, function (err, user, info) {
    /* istanbul ignore next */
    if (err) { return next(err) }
    if (!user) {
      res.status(401)
      return res.json({success: false, errors: 'Unauthorized'})
    }
    req.currentUser = user
    next()
  })(req, res, next)
}

module.exports = authMiddleware

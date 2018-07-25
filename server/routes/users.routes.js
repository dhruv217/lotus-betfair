'use strict'
let express = require('express')
let router = express.Router()
let User = require('../models/user.model')
const errorsParser = require('../utils/errorsParser')

/**
 * @api {get} /BASE_URL/user/ Current user
 * @apiName Get current user
 * @apiGroup User
 * @apiDescription Get current user information
 */
router.get('/', (req, res) => {
  res.json({success: true, user: req.currentUser})
})

/**
 * @api {put} /BASE_URL/user Modify user
 * @apiName Modify user
 * @apiGroup User
 * @apiDescription Modify current connected user information
 *
 * @apiParam {String} field Field to update
 */
router.put('/', (req, res) => {
  User.findOneAndUpdate({_id: req.currentUser._id}, {$set: req.body}, {
    runValidators: true,
    context: 'query',
    new: true
  }, (err, user) => {
    /* istanbul ignore next */
    if (err) {
      return res.status(400).json({success: false, errors: errorsParser(err.errors)})
    }
    res.status(200).json({success: true, user: user})
  })
})

/**
 * @api {put} /BASE_URL/user/change-password Change password
 * @apiName Change Password
 * @apiGroup User
 * @apiDescription Change user password
 *
 * @apiParam {String} password Password
 * @apiParam {String} confirmPassword Confirm Password
 */
router.put('/change-password', (req, res) => {
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400)
    return res.json({success: false, errors: 'Passwords must be identical'})
  }
  User.findOne({_id: req.currentUser._id}, (err, user) => {
    /* istanbul ignore next */
    if (err) {
      res.status(500)
      return res.json({success: false, errors: errorsParser(err.errors)})
    }
    user.password = req.body.password
    user.save((err, user) => {
      /* istanbul ignore next */
      if (err) {
        res.status(500)
        return res.json({success: false, errors: errorsParser(err.errors)})
      }
      res.status(200)
      res.json({success: true, errors: 'Password successfully updated'})
    })
  })
})

module.exports = router

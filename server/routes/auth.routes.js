'use strict'
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('../config/config')
const User = require('../models/user.model')
const errorsParser = require('../utils/errorsParser')

const templateMailer = new (require('../utils/mailer/templateMailer'))()

/**
 * @api {post} /BASE_URL/auth/register Create account
 * @apiName Register
 * @apiGroup Authentication
 * @apiDescription Register a new user
 *
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 * @apiParam {String} confirmPassword Confirm Password
 */
router.post('/register', (req, res) => {
  console.log(req.body);
  if (!req.body.email) {
    return res.status(400).json({
      success: false,
      errors: 'Field email is required'
    })
  }
  if (!req.body.password || !req.body.confirmPassword) {
    return res.status(400).json({
      success: false,
      errors: 'Fields password and confirmPassword are required'
    })
  }
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({
      success: false,
      errors: 'Passwords must be identicals'
    })
  }
  let user = new User({
    email: req.body.email,
    password: req.body.password
  })
  console.log(user);
  user.save((err, result) => {
    console.log(result);
    if (err) {
      res.status(400)
      return res.json({success: false, errors: errorsParser(err.errors)})
    }
    console.log("User successfully created.");
    const datas = {
      user,
      'metas': {
        'template': 'auth/register-confirmation',
        'subject': 'Account creation successful'
      }
    }

    /* templateMailer.renderAndSendMail(datas, function (err, success) {
      if (err) return res.status(500).json({success: false, errors: 'Mail failed to send'})

      if (process.env.NODE_ENV === 'test') return res.status(201).json({success: true, errors: 'Successfully created new user.'})

      
    }) */
    return res.status(201).json({success: true})
  })
})

/**
 * @api {post} /BASE_URL/auth/login User login
 * @apiName Login
 * @apiGroup Authentication
 * @apiDescription Login a user and get JWT
 *
 * @apiParam {String} email Email
 * @apiParam {String} password Password
 */
router.post('/login', (req, res) => {
  if (!req.body.email) {
    res.status(400)
    return res.json({
      success: false,
      errors: {
        'email': 'Field email is required'
      }
    })
  }
  if (!req.body.password) {
    res.status(400)
    return res.json({
      success: false,
      errors: {
        'password': 'Field password is required'
      }
    })
  }
  User.findOne({email: req.body.email}).select('+password').exec((err, user) => {
    /* istanbul ignore next */
    if (err) {
      res.status(500)
      return res.json({success: false, errors: errorsParser(err.errors)})
    }
    if (!user) {
      res.status(401)
      return res.json({success: false, errors: 'Authentication failed, User not found'})
    }
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (isMatch && !err) {
        let userObject = {_id: user.id, email: user.email}
        let token = jwt.sign(userObject, config.secret, {expiresIn: config.tokenExpireIn})
        res.status(200)
        return res.json({success: true, token: token})
      } else {
        res.status(401)
        res.json({success: false, errors: 'Authentication failed, bad password'})
      }
    })
  })
})

/**
 * @api {post} /BASE_URL/auth/forgot-password Forgot password
 * @apiName Forgot Password
 * @apiGroup Authentication
 * @apiDescription Get token to reset password
 *
 * @apiParam {String} email Email
 */
router.post('/forgot-password', (req, res) => {
  if (!req.body.email) {
    res.status(400)
    return res.json({success: false, errors: 'Field email is required'})
  }
  User.findOne({email: req.body.email}, (err, user) => {
    /* istanbul ignore next */
    if (err) {
      res.status(400)
      return res.json({success: false, errors: errorsParser(err.errors)})
    }
    if (!user) {
      res.status(400)
      return res.json({success: false, errors: 'No account with that email address exists'})
    }
    crypto.randomBytes(20, (err, buf) => {
      /* istanbul ignore next */
      if (err) {
        res.status(500)
        return res.json({success: false, errors: errorsParser(err.errors)})
      }
      let token = buf.toString('hex')
      user.resetPasswordToken = token
      user.resetPasswordExpiration = Date.now() + 3600000 // Reset password token valid 1 hour
      user.save((err) => {
        /* istanbul ignore next */
        if (err) return res.json({success: false, errors: 'Updating user error'})

        const datas = {
          user,
          'metas': {
            'template': 'auth/reset-password',
            'subject': 'Password Reset'
          },
          'links': {
            'resetPassword': config.frontUrl + '/#/auth/reset-password/' + token
          }
        }

        // avoid sending mail if testing and return token to permit correct testing
        if (process.env.NODE_ENV === 'test') return res.json({success: true, resetPasswordToken: token})

        templateMailer.renderAndSendMail(datas, function (err, success) {
          if (err) return res.status(500).json({success: false, errors: 'Mail failed to send'})

          if (process.env.NODE_ENV === 'test') return res.json({success: true, resetPasswordToken: token})

          return res.json({success: true})
        })
      })
    })
  })
})

/**
 * @api {post} /BASE_URL/auth/reset-password/ Reset password
 * @apiName Reset Password
 * @apiGroup Authentication
 * @apiDescription Change password from a pair of identical password if the token is valid
 *
 * @apiParam {String} token Reset token
 * @apiParam {String} password Password
 * @apiParam {String} confirmPassword Confirm Password
 */
router.post('/reset-password', (req, res) => {
  if (!req.body.token) {
    res.status(400)
    return res.json({success: false, errors: 'Field token is required'})
  }
  if (!req.body.password || !req.body.confirmPassword) {
    res.status(400)
    return res.json({success: false, errors: 'Fields password and confirmPassword are required'})
  }
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400)
    return res.json({success: false, errors: 'Passwords must be identical'})
  }
  User.findOne({ resetPasswordToken: req.body.token, resetPasswordExpiration: { $gt: Date.now() } }, (err, user) => {
    /* istanbul ignore next */
    if (err) {
      res.status(500)
      return res.json({success: false, errors: errorsParser(err.errors)})
    }
    if (!user) {
      res.status(400)
      return res.json({success: false, errors: 'Password reset token is invalid or has expired'})
    }

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpiration = undefined

    user.save((err) => {
      /* istanbul ignore next */
      if (err) return res.json({success: false, errors: 'Updating password error'})
      return res.json({success: true, errors: 'Password successfully updated'})
    })
  })
})

module.exports = router

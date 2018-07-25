'use strict'
let express = require('express')
let router = express.Router()

let authRoutes = require('./auth.routes')
let userRoutes = require('./users.routes')

let authMiddleware = require('../utils/authMiddleware')

/* AUTHENTICATION ROUTES */
router.use('/auth', authRoutes)

/* USER ROUTES (PROTECTED) */
router.use('/user', authMiddleware, userRoutes)

module.exports = router

const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const passport = require('passport')
const mongoose = require('mongoose')

const config = require('./config/config')

const corsHeaderMiddleware = require('./utils/corsHeaderMiddleware')
const router = require('./routes/router')

// Use native Node promises
mongoose.Promise = global.Promise

// connect to MongoDB
mongoose.connect(config.mongo_url, { useNewUrlParser: true })
  .then(db => {
    console.log("\x1b[32m==> Connection to db successful", "\x1b[0m");
  })
  .catch(err => {
    console.log("\x1b[31m==> Error when try to connect to db:", err, "\x1b[0m");
  });


const app = express()

require('./config/passport.config')(passport)

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(passport.initialize())
app.use(corsHeaderMiddleware)

app.use(config.baseUrl, router)

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json({error: err});
})

module.exports = app

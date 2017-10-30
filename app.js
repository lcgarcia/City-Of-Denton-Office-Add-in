if (!('VCAP_SERVICES' in process.env)) {
  require('dotenv').config({ path: process.env.ENVPATH });
}
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var budget = require('./routes/budget');
var book = require('./routes/book');
var datasource = require('./routes/datasource');
var job = require('./routes/job');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules/angular', express.static(__dirname + '/node_modules/angular'));
app.use('/node_modules/office-ui-fabric-js', express.static(__dirname + '/node_modules/office-ui-fabric-js'));
app.use('/node_modules/client-js', express.static(__dirname + '/node_modules/client-js'));
app.use('/node_modules/lodash', express.static(__dirname + '/node_modules/lodash')); 
app.use('/node_modules/core-js', express.static(__dirname + '/node_modules/core-js')); 

app.use('/', routes);
app.use('/ks2inc/budget', budget);
app.use('/ks2inc/book', book);
app.use('/ks2inc/datasource', datasource);
app.use('/ks2inc/job', job);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

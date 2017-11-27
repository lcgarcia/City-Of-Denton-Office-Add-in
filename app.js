if (!('VCAP_SERVICES' in process.env)) {
  require('dotenv').config({ path: process.env.ENVPATH });
}
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session')
const passport = require('passport'),
    OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const config = require('./config');
const CloudantStore = require('connect-cloudant-store')(session);
const store = new CloudantStore({
  url: JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB[0].credentials.url,
  database: 'sessions'
});

const routes = require('./routes/index');
const budget = require('./routes/budget');
const book = require('./routes/book');
const datasource = require('./routes/datasource');
const job = require('./routes/job');

passport.serializeUser(function(user,done){
  done(null,user);
});
passport.deserializeUser(function(user,done){
  done(null,user);
});

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

app.use(session({
  secret: 'lasjflju**(()U0990U87g90o211',
  store: store,
  saveUninitialized: false,
  resave: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new OIDCStrategy({
  identityMetadata: config.creds.identityMetadata,
  clientID: config.creds.clientID,
  responseType: config.creds.responseType,
  responseMode: config.creds.responseMode,
  redirectUrl: config.creds.redirectUrl,
  allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
  clientSecret: config.creds.clientSecret,
  validateIssuer: config.creds.validateIssuer,
  isB2C: config.creds.isB2C,
  issuer: config.creds.issuer,
  passReqToCallback: config.creds.passReqToCallback,
  scope: config.creds.scope,
  loggingLevel: config.creds.loggingLevel,
},
function(req, iss, sub, profile, accessToken, refreshToken, done) {
  if (!profile.oid) {
    return done(new Error("No oid found"), null);
  } else {
    return done(null, profile);
  }
}
));

var userCheck = (req, res, next) => {
  if(req.user) {
    req.session.nowInMinutes = Date.now() / 60e3;
    next();
  } else res.redirect('/');
}

app.get('/login',
function(req, res, next) {
  passport.authenticate('azuread-openidconnect', 
    { 
      response: res,
      resourceURL: config.resourceURL,
      customState: 'my_state',
      failureRedirect: '/?error=login' 
    }, (err, user, info) => {
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/');
      });
    }
  )(req, res, next);
},
function(req, res) {
  console.log('Login was called in the Sample')
  res.redirect('/');
});

app.post('/auth/openid/return',
function(req, res, next) {
  passport.authenticate('azuread-openidconnect', 
    { 
      response: res,
      failureRedirect: '/?error=return'  
    }
  )(req, res, next);
},
function(req, res) {
  console.info('We received a return from AzureAD.');
  res.redirect('/');
});

app.get('/logout', function(req, res){
  // req.session.destroy();
  req.logout();
  res.redirect('/');
});

app.use('/SessionInfo', (req, res) => {
  res.send(req.user);
});

app.get('/proto', (req, res) => {
  res.send({ message: 'success' });
});
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
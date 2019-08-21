const oracle = require('oracledb');
const _ = require('lodash');
const express = require('express');
const request = require('request-promise');
const config = require('./../config');
const JWTKeyManager = require('./../lib/JWTKeyManager');
const keyManager = new JWTKeyManager();
keyManager.initKeys();

const connection = {
  user: 'jdeview',
  password: 'viewonly',
  connectString: 'cap-sg-prd-1.integration.ibmcloud.com:16019/JDEPD910'
};
const router = express.Router();
const release = (connection) => {
  connection.close(err => {
    if (err) throw err;
  });
};

var userCheck = (req, res, next) => {
  if (req.user) {
    req.session.nowInMinutes = Date.now() / 60e3;
    return true;
  }
  else return false;
}

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('app');
});

router.get('/dialog', (req, res, next) => {
  if (req.user) {
    res.render('dialog', {
      user: true
    });
  }
  else {
    res.render('dialog', {
      user: false
    });
  }
});

router.get('/user/data', (req, res, next) => {
  const authorization = req.get('Authorization');
  const [schema, jwt] = authorization.split(' ');
  keyManager.verifyJWT(jwt, (err, decoded) => {
    
    keyManager.getMicrosoftGraphToken({
        jwtData: decoded,
        jwt
      })
      .then(keyManager.getGroups)
      .then(data => {
        decoded.groups = data.groups;
        res.send(decoded);
      });
  });
});

router.get('/jwt/config', (req, res, next) => {
  res.send(keyManager.getKeys());
});

router.get('/datasource', (req, res, next) => {
  res.render('datasource', {
    title: 'Express'
  });
});

module.exports = router;
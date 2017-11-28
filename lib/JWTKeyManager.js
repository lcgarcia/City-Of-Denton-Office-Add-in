const request = require('request-promise');
const config = require('./../config');
const _ = require('lodash');
const jsonwebtoken = require('jsonwebtoken');

const JWTKeyManager = function () {
  this.keys = {};
}

JWTKeyManager.prototype.initKeys = function (keys) {
  let reqData = {
    url: config.creds.identityMetadata,
    method: 'GET',
    headers: {
      "content-type": "application/json"
    },
    json: true
  };

  const getJwkKeysEndpoint = () => request(reqData).then(body => body.jwks_uri);
  const saveJwtKeys = (url) => {
    reqData.url = url;
    return request(reqData)
    .then(body => {
      signingKeys = {};
      body.keys.forEach((key) => {
        const { kid, x5c } = key;
        const [signingKey] = x5c;
        signingKeys[kid] = `-----BEGIN CERTIFICATE-----
${signingKey}
-----END CERTIFICATE-----`;
      });
      this.keys = signingKeys;
    });
  }

  getJwkKeysEndpoint()
  .then(saveJwtKeys)
};

JWTKeyManager.prototype.getGroups = function(data) {
  let reqData = {
    url: `https://graph.microsoft.com/v1.0/users/${data.jwtData.oid}/memberOf`,
    method: 'GET',
    headers: {
      'Authorization': data.tokenData.access_token
    },
    json: true
  };

  return request(reqData)
  .then(body => {
    data.groups = _.map(body.value, val => val.id);
    return data;
  })
  .catch(err => {
    console.log('HERE');
    return err;
  });
};

JWTKeyManager.prototype.getMicrosoftGraphToken = function(data) {
  let reqData = {
    url: `https://login.microsoftonline.com/${config.creds.tenate}/oauth2/v2.0/token`,
    method: 'POST',
    headers: { },
    form: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      client_id: config.creds.clientID,
      client_secret: config.creds.clientSecret,
      assertion: data.jwt,
      scope: 'https://graph.microsoft.com/user.read',
      requested_token_use: 'on_behalf_of'
    },
    json: true
  };

  console.log(config.creds.tenate);
  return request(reqData)
  .then(body => {
    data.tokenData = body;
    return data;
  })
  .catch(err => {
    console.log(err);
    return err;
  });
};

JWTKeyManager.prototype.verifyJWT = function(jwt, cb) {
  const decoded = jsonwebtoken.decode(jwt, { complete: true });
  const { header, payload } = decoded;
  jsonwebtoken.verify(jwt, this.keys[header.kid], { audience: config.creds.clientID, issuer: config.creds.issuer }, (err) => {
    if (err) cb(err);
    else cb(null, decoded.payload);
  });
};

JWTKeyManager.prototype.getKeys = function () {
  return this.keys;
};

module.exports = JWTKeyManager;
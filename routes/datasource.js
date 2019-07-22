const Cloudant = require('cloudant');
const cloudantCredentials = JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB[0].credentials;
const cloudant = Cloudant({
  url: cloudantCredentials.url,
  plugin: 'promises'
});
const datasource = cloudant.use('datasource');
const express = require('express');
const _ = require('lodash');
const router = express.Router();

const remapToUnderscores = (data) => {
  if ('rev' in data) {
    data._rev = data.rev;
    delete data.rev;
  }
  if ('id' in data) {
    data._id = data.id;
  }
  return data;
}

router.get('/', (req, res) => {
  datasource.get('1e2f7556d1fe4538509ee5124a2edecf', {
      include_docs: true
    })
    .then(response => {
      response.rev = response._rev;
      delete response._rev;
      response.id = response._id;
      delete response._id;
      res.send(response);
    }).catch(err => res.send(err));
});

router.put('/', (req, res) => {
  const data = remapToUnderscores(req.body);
  datasource.insert(data)
    .then(response => res.send(response))
    .catch(err => res.send(err));
})

module.exports = router;
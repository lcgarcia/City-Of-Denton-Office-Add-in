const Cloudant = require('cloudant');
const cloudantCredentials = JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB[0].credentials;
const cloudant = Cloudant({url: cloudantCredentials.url, plugin:'promises'});
const books = cloudant.use('books');
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

router.post('/', (req, res) => {
  const bookData = remapToUnderscores(req.body);
  books.insert(bookData)
    .then(response => res.send(response))
    .catch(err => res.send(err));
});

router.put('/', (req, res) => {
  const bookData = remapToUnderscores(req.body);
  books.insert(bookData)
    .then(response => res.send(response))
    .catch(err => res.send(err));
});

router.delete('/:id/:rev', (req, res) => {
  books.destroy(req.params.id, req.params.rev)
    .then(response => res.send(response))
    .catch(err => res.send(err));
});

router.get('/:id', (req, res) => {
  books.get(req.params.id, { include_docs: true })
    .then(response => {
      response.rev = response._rev;
      delete response._rev;
      response.id = response._id;
      delete response._id;
      res.send(response);
    })
    .catch(err => res.send(err));
});

router.get('/user/:userId/:reportType', (req, res) => {
  books.find({ selector: { userId: req.params.userId, reportType: req.params.reportType } })
    .then(response => res.send(_.map(response.docs, (val) => {
      val.rev = val._rev;
      delete val._rev;
      val.id = val._id;
      delete val._id;
      return val;
    }))).catch(err => res.send(err));
});

module.exports = router;
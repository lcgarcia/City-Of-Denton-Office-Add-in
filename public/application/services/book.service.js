app.service("BookService", [
  '$http',
  function($http){
    var timeoutMs = 1000;
    var requestRetry = function (method) {
      return new Promise(function (resolve, reject) {
        async.retry({ times: 3, interval: 500 }, method, function (err, result) {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

    this.createBook = function (book) {
      var makeRequest = function (cb) {
        return $http.post('/ks2inc/book', JSON.stringify(book), {headers: {'Content-Type': 'application/json'}, timeout: timeoutMs })
        .then(function (response) {
          var data = response.data;
          delete book.rev;
          cb(null, _.merge(data, book));
        },
        function (httpError) {
          cb(httpError.status + " : " + httpError.data);
        });
      }

      return requestRetry(makeRequest);
    }

    this.updateBook = function (book) {
      var makeRequest = function (cb) {
        return $http.put('/ks2inc/book', JSON.stringify(book), {headers: {'Content-Type': 'application/json'}, timeout: timeoutMs })
        .then(function (response) {
          var data = response.data;
          delete book.rev;
          cb(null, _.merge(data, book));
        },
        function (httpError) {
          cb(httpError.status + " : " + httpError.data);
        });
      }

      return requestRetry(makeRequest);
    }

    this.getBookById = function (bookId) {
      var makeRequest = function (cb) {
        return $http.get('/ks2inc/book/' + bookId, { timeout: timeoutMs })
        .then(function (response) {
          cb(null, response.data);
        },
        function (httpError) {
          cb(httpError.status + " : " + httpError.data);
        });
      }

      return requestRetry(makeRequest);
    }

    this.getUserBooks = function (userId, reportType) {
      var makeRequest = function (cb) {
        $http.get('/ks2inc/book/user/' + userId + '/' + reportType, { timeout: timeoutMs })
        .then(function (response) {
          cb(null, response.data);
        },
        function (httpError) {
          cb(httpError.status + " : " + httpError.data);
        });
      }
      return requestRetry(makeRequest);
    }

    this.deleteBook = function (book) {
      var makeRequest = function (cb) {
        $http.delete('/ks2inc/book/' + book.id + '/' + book.rev, { timeout: timeoutMs })
        .then(function (response) {
          cb(null, response.data);
        },
        function (httpError) {
          cb(httpError.status + " : " + httpError.data);
        });
      }

      return requestRetry(makeRequest);
    }
  }
]);
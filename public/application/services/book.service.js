app.service("BookService", [
  '$http',
  function($http){
    this.createBook = function (book) {
      return $http.post('/ks2inc/book', JSON.stringify(book), {headers: {'Content-Type': 'application/json'} })
      .then(function (response) {
        var data = response.data;
        delete book.rev;
        return _.merge(data, book);
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    }

    this.updateBook = function (book) {
      return $http.put('/ks2inc/book', JSON.stringify(book), {headers: {'Content-Type': 'application/json'} })
      .then(function (response) {
        var data = response.data;
        delete book.rev;
        return _.merge(data, book);
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    }

    this.getBookById = function (bookId) {
      return $http.get('/ks2inc/book/' + bookId)
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    }

    this.getUserBooks = function (userId) {
      return $http.get('/ks2inc/book/user/' + userId)
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    }

    this.deleteBook = function (book) {
      return $http.delete('/ks2inc/book/' + book.id + '/' + book.rev)
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    }
  }
]);
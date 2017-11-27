app.service("SessionService", [
  '$http',
  function($http){
    this.getUserData = function () {
      return $http.get('/SessionInfo')
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    };

    this.getJWTUserData = function (accessToken) {
      return $http.get('/user/data', { headers: { 'Authorization': 'Bearer ' + accessToken } })
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      })
    }
  }
]);
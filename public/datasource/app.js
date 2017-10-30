angular.module('datasource-app', ['ngToast'])

.controller('datasourceCtrl', ['$scope', '$http', 'ngToast', function ($scope, $http, ngToast) {
  var buildPage = function () {
    $http.get('/ks2inc/datasource')
      .then(function (response) {
        $scope.data = response.data;
        $("#login").velocity("transition.slideUpIn", 1250);
        $(".row").delay(500).velocity("transition.slideLeftIn", {stagger: 500}) ;
        $("#error").hide();
      });
  };

  $scope.save = function () {
    $http.put('/ks2inc/datasource', JSON.stringify($scope.data), {headers: {'Content-Type': 'application/json'} })
      .then(function (response) {
        console.log(response);
        var data = response.data;
        delete $scope.data.rev;
        _.merge($scope.data, data);
        // Add toast
        ngToast.create('Saved Datasource Config!');
      });
  }

  buildPage();
}]);
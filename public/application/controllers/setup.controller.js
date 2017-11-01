/**
 * Home Controller
 */

app.controller('setupCtrl', [
  '$http', 
  '$scope', 
  '$rootScope',
  '$state',
  '$stateParams',
  'jobcostService',
  'SessionService',
  function ($http, $scope, $rootScope, $state, $stateParams, jobcostService, SessionService) {
    var debugCreated = false;
    var dataCreated = false;
    var debugRange = 3;

    var dataSheetName = "Data";
    var debugSheetName = "Debug";
    var debugMsgSize = 2000;

    $scope.showSpinner = false
    $scope.showingDetail = false;
    $scope.fetched = false;

    $scope.filteredReports = [
      {name:"budrpt_a-90", type:'a'},
      {name:"budrpt_e-90", type:'e'},
      {name:"budrpt_f-90", type:'f'},
      {name:"budrpt-90", type:''},
      {name:"bjobcost-90", type:''},
      {name:"jobcost90_ka", type:'ka'},
      {name:"jobcoste-90", type:'e'},
      {name:"newjobcost-90", type:'new'},
    ];
    $scope.modalLoad = {};
    $scope.user = {};

    $scope.selectedValues = {report:""}

    $rootScope.$on('$viewContentLoaded', dateInit);


    function loadPage(){
      SessionService.getUserData()
      .then(function (data) {
        console.log(data);
      })
      /*
      if($stateParams.data.user){
        //page load after login, set user info
        $scope.user = $stateParams.data.user;
        sessionStorage.setItem('user', JSON.stringify({ name: $scope.user.name, id: 1 }));
      }
      else{
        //page refreshed, grab user name from session
        $scope.user = JSON.parse(sessionStorage.getItem('user'));
      }
      */
      //Set Report IDs
      var i;
      for(i=0; i<$scope.filteredReports.length; i++){
        $scope.filteredReports[i].id = i;
      }

      //Set report
      var reportIndex = sessionStorage.getItem('reportIndex');
      if(reportIndex){
        $scope.selectedValues.report = $scope.filteredReports[reportIndex];
      }
      else{
        $scope.selectedValues.report = $scope.filteredReports[0];
      }
    } 


    $scope.logout = function(){
      $state.go("login");
    }


    /**
     * [selectedReport sets the view depending on which report is selected]
     * @param report [the report selected]
     */
    $scope.selectedReport = function() {
      var report = $scope.selectedValues.report;
      sessionStorage.setItem('reportIndex', report.id);

      var stateObject = {type:$scope.selectedValues.report.type, data:{user:$scope.user}};
      if(report.name.includes("budrpt")){
        $state.go("setup.budget", stateObject);
      }
      else if(report.name == "bjobcost-90" || report.name == "jobcoste-90"){
        $state.go("setup.jobcost", stateObject);
      }
      else{
        $state.go("setup.jobcost2", stateObject);
      }
    }

    $scope.runData = function(){
      getData();
    }
    

    function getDateTime(){
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + ":" + today.getMilliseconds();
      var dateTime = date+' '+time;
      return dateTime;
    }

    loadPage();

  }]);
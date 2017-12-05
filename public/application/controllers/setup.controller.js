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
  'modalService',
  'SessionService',
  function ($http, $scope, $rootScope, $state, $stateParams, jobcostService, modalService, SessionService) {
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
      {name:"budrpt-90", type:''},
      {name:"budrpt_a-90", type:'a'},
      {name:"budrpt_e-90", type:'e'},
      {name:"budrpt_f-90", type:'f'},
      {name:"bjobcost-90", type:''},
      {name:"jobcost90_ka", type:'ka'},
      {name:"jobcoste-90", type:'e'},
      {name:"newjobcost-90", type:'new'},
    ];
    $scope.modalLoad = {};
    $scope.user = {};

    $scope.selectedValues = {};

    $rootScope.$on('$viewContentLoaded', dateInit);
    $rootScope.$on('jobcostData', function(event, hiddenRows) {
      $scope.reportDetails.worksheet = "Jobcost-90";
      $scope.reportDetails.hiddenRows = hiddenRows;
      if(hiddenRows && hiddenRows.length>0) $scope.reportDetails.msg = "";
      else $scope.reportDetails.msg = "No Data Returned";
    });

    $scope.filterReports = function (data) {
      var groups = data._json.groups;
      if (_.includes(groups, '13d4a1b3-a96e-43e0-a747-bbea092ae269')) { // Accounting
        $scope.filterReports = $scope.filterReports;
      } else if (_.includes(groups, 'dc448ad6-3a34-437d-ab81-63498fb36dc0')) { // Electric
        $scope.filteredReports = [
          {name:"budrpt-90", type:''},
          {name:"budrpt_e-90", type:'e'},
          {name:"budrpt_f-90", type:'f'},
          {name:"bjobcost-90", type:''},
          {name:"jobcoste-90", type:'e'},
          {name:"newjobcost-90", type:'new'},
        ];
      } else if (_.includes(groups, '01300353-41d6-4320-bed4-618e2bfeb19d')) { // Budget / Jobcost (General)
        $scope.filteredReports = [
          {name:"budrpt-90", type:''},
          {name:"bjobcost-90", type:''},
        ];
        $state.go('setup.budget', { type: '' });
      } else {
        window.location.href = '/logout';
      }

      var i;
      for(i=0; i<$scope.filteredReports.length; i++){
        $scope.filteredReports[i].id = i;
      }
    };


    function loadPage(){
      $scope.reportDetails = {};
      $scope.reportDetails.worksheet = "Sheet1";
      $scope.reportDetails.selectAll = false;
      $scope.reportDetails.searchInput = "";
      $scope.reportDetails.msg = "No Data Returned";
      $scope.reportDetails.hiddenRows = [];

      var data = localStorage.getItem('user')
      if (data != '' && data != undefined && data != null) {
        data = JSON.parse(data);
        $scope.user = data;
        if (data != '' && data != undefined && data != null) {
          $scope.filterReports(data);
          $scope.$broadcast('userData', data);
        } else {
          modalService.hideReportLoadingModal();
          modalService.hideDataLoadingModal();
          $state.go('login');
        }
      }

      /*
      SessionService.getUserData()
      .then(function (data) {
        $scope.user = data;
        if (data != '' && data != undefined && data != null) {
          $scope.filterReports(data);
          $scope.$broadcast('userData', data);
        } else {
          modalService.hideReportLoadingModal();
          modalService.hideDataLoadingModal();
          $state.go('login');
        }
      });
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
      
      try{
        $scope.getActiveSheet();
      }catch (e) {
        console.log("ERROR: " + e.message);
      }
    } 


    $scope.logout = function(){
      localStorage.removeItem('user');
      window.location.href = '/logout';
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


    $scope.getActiveSheet = function(){
      Excel.run(function (ctx) {
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        var jsonDataRange = activeWorksheet.getRange("A2:A2");
        activeWorksheet.load('name');
        jsonDataRange.load("values");

        return ctx.sync()
          .then(function(response) {
            if($scope.reportDetails.worksheet != activeWorksheet.name){
              changeReportDetails(activeWorksheet.name, jsonDataRange.values);
            }
          }).catch(function (err) {
            
            $scope.$apply(function () {
              $scope.reportDetails.msg = err;
            });
            
          });

      });
    }

    function changeReportDetails(sheetName, jsonSheetData){
      $scope.reportDetails.worksheet = sheetName;
      $scope.reportDetails.hiddenRows = [];

      if(jsonSheetData != null && jsonSheetData != ""){
        var jsonString = JSON.stringify(jsonSheetData);
        var indexStart = jsonString.indexOf("{");
        var indexEnd = jsonString.indexOf("}", (jsonString.length-6));
        jsonString = jsonString.substring(indexStart, indexEnd+1);
        jsonString = jsonString.replace(/\\"/g, '"');
        jsonData = jsonString.split(",{");

        $scope.reportDetails.hiddenRows.push(JSON.parse(jsonData.shift()));
        _.forEach(jsonData, function(data) {
          $scope.reportDetails.hiddenRows.push(JSON.parse("{"+data));
        });

        if($scope.reportDetails.hiddenRows && $scope.reportDetails.hiddenRows.length > 0){
          $scope.reportDetails.msg = "";
        }
        else{
          $scope.reportDetails.msg = "No Data Returned";
        }
      }
      else{
        $scope.reportDetails.msg = "No Data Returned";
      }
    }


    /**
     * [selectedDataAll selectAll checkbox selected. Set Sheet Data values to selectAll value]
     */
    $scope.selectedDataAll = function(){
      _.forEach($scope.reportDetails.hiddenRows, function(parent) {
        parent.selected = $scope.reportDetails.selectAll;
      });
    }

    /**
     * [searchData shows/hides options depending on the value that is entered in searchbox]
     */
    $scope.searchData = function(){
      var filter, ul, li, parentText, i;
      filter = $scope.reportDetails.searchInput.toUpperCase();
      ul = document.getElementById("containerList");
      li = ul.getElementsByClassName("containerData");
      for (i = 0; i < li.length; i++) {
        parentText = li[i].getElementsByTagName("label")[0].innerText.toUpperCase().trim();
        
        if (parentText.indexOf(filter) > -1) {
          li[i].style.display = "";
        }
        else{
          li[i].style.display = "none";
        }
      }
    };

    $scope.toggleAllRows = function (show) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem($scope.reportDetails.worksheet);

        _.forEach($scope.reportDetails.hiddenRows, function (row) {
          var range = worksheet.getRange(row.range);
          range.rowHidden = !show;
        });

        return ctx.sync()
          .then(function () {}).catch(function (err) {
            /*
            $scope.$apply(function () {
              $scope.reportDetails.msg = err;
            });
            */
          });
      });
    }

    $scope.toggleRow = function (label) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem($scope.reportDetails.worksheet);
        var range = worksheet.getRange(label.range);
        range.rowHidden = !label.selected;

        return ctx.sync()
          .then(function () {}).catch(function (err) {
            /*
            $scope.$apply(function () {
              $scope.reportDetails.msg = err;
            });
            */
          });
      });
    };
    

    function getDateTime(){
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + ":" + today.getMilliseconds();
      var dateTime = date+' '+time;
      return dateTime;
    }

    loadPage();

  }]);
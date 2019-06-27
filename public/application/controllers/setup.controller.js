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
  function ($http, $scope, $rootScope, $state, $stateParams, jobcostService, modalService) {
    var jobcostIndex = 0;
    $scope.showSpinner = false
    $scope.showingDetail = false;
    $scope.fetched = false;

    $scope.filteredReports = [
      {name:"Jobcost", type:''},
      {name:"Jobcost KA", type:'ka'},
      {name:"Jobcost E", type:'e'},
      {name:"New Jobcost", type:'new'},
      {name:"Budget Report", type:''},
      {name:"Budget Report A", type:'a'},
      {name:"Budget Report E", type:'e'},
      {name:"Budget Report F", type:'f'},
    ];
    $scope.modalLoad = {};
    $scope.user = {};
    $scope.reportDetails = {};
    $scope.modalData = {message: 'Loading...', offlineMessage: 'Oh no! You are offline!'};
    $scope.reportDetails.selectAll = false;

    window.addEventListener('online', function() {
      modalService.hideOfflineModal();
    });
    window.addEventListener('offline', function() {
      modalService.showOfflineModal();
    });

    $scope.selectedValues = {};

    $rootScope.$on('$viewContentLoaded', dateInit);
    $rootScope.$on('reloadHiddenRows', function(event, opts) {
      $scope.reportDetails.worksheet = '';
      $scope.getActiveSheet();
      // $scope.reportDetails.selectAll = false;
      // $("#selectAll").prop( "checked", false );
    });

    $scope.filterReports = function (data) {
      var groups = data._json.groups;
      if (_.includes(groups, '13d4a1b3-a96e-43e0-a747-bbea092ae269')) { // Accounting
        $scope.filterReports = $scope.filterReports;
      } else if (_.includes(groups, 'dc448ad6-3a34-437d-ab81-63498fb36dc0')) { // Electric
        $scope.filteredReports = [
          {name:"Jobcost", type:''},
          {name:"Jobcost E", type:'e'},
          {name:"New Jobcost", type:'new'},
          {name:"Budget Report", type:''},
          {name:"Budget Report E", type:'e'},
          {name:"Budget Report F", type:'f'},
        ];
        jobcostIndex = 3;
      } else if (_.includes(groups, '01300353-41d6-4320-bed4-618e2bfeb19d')) { // Budget / Jobcost (General)
        $scope.filteredReports = [
          {name:"Jobcost", type:''},
          {name:"Budget Report", type:''},
        ];
        jobcostIndex = 1;
      } else {
        $scope.filterReports = $scope.filterReports;
      }

      var i;
      for(i=0; i<$scope.filteredReports.length; i++){
        $scope.filteredReports[i].id = i;
      }

      //$state.go('setup.jobcost', { type: '' });
    };


    function loadPage(){
      Office.initialize = function (reason) {}
      $scope.reportDetails.worksheet = "Sheet1";
      $scope.reportDetails.selectAll = false;
      $scope.reportDetails.searchInput = "";
      $scope.reportDetails.msg = "No Data Returned";
      $scope.reportDetails.hiddenRows = [];

      var userd = $stateParams.data.user;
      var data = localStorage.getItem('user');
      if (userd != '' && userd != undefined && userd != null) {
        data = JSON.parse(data);
        $scope.user = data;
        if (data != '' && data != undefined && data != null && 'oid' in data) {
          $scope.filterReports(data);
          $scope.$broadcast('userData', data);
        } else {
          //localStorage.removeItem('user');
          modalService.hideReportLoadingModal();
          modalService.hideDataLoadingModal();
          $state.go('login');
        }
      } else {
        //localStorage.removeItem('user');
        modalService.hideReportLoadingModal();
        modalService.hideDataLoadingModal();
        $state.go('login');
      }

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
        $scope.selectedValues.report = $scope.filteredReports[jobcostIndex];
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
      if(/Budget Report/gi.test(report.name)){
        $state.go("setup.budget", stateObject);
      }
      else if(report.name == "Jobcost" || report.name == "Jobcost E"){
        $state.go("setup.jobcost", stateObject);
      }
      else{
        $state.go("setup.jobcost2", stateObject);
      }
    }


    $scope.getActiveSheet = function(data){
      Excel.run(function (ctx) {
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        var jsonDataRange = activeWorksheet.getRange("AA1:AZ1");
        activeWorksheet.load('name');
        jsonDataRange.load("values");

        return ctx.sync()
          .then(function(response) {
            if($scope.reportDetails.worksheet != activeWorksheet.name){
              changeReportDetails(activeWorksheet.name, jsonDataRange.values);
            }
          }).catch(function (err) {
            // $scope.reportDetails.msg = err;
          });
      });
    }


    $scope.updateRowSelections = function(){
      Excel.run(function (ctx) {
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.load('name');
        var hiddenRows = $scope.reportDetails.hiddenRows;
        const alphaMap = ['','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        

        if(hiddenRows && hiddenRows.length > 0){
          try{
            var hiddenRowsData = {};
            hiddenRowsData.json = [];
            var jsonHiddenData;
            var alphaKey1 = 1;
            var alphaKey2 = 1;
            if(hiddenRows.length > 200){
              var sliceStart = 0;
              var sliceEnd = 200;
              
              while(sliceEnd < hiddenRows.length){
                jsonHiddenData = JSON.stringify(hiddenRows.slice(sliceStart, sliceEnd));
                hiddenRowsData.json.push(jsonHiddenData);
                sliceStart = sliceEnd;
                sliceEnd += 200;
                alphaKey2++;
                if(alphaKey2 == alphaMap.length){
                  alphaKey1++;
                  alphaKey2=1;
                }
              }
              jsonHiddenData = JSON.stringify(hiddenRows.slice(sliceStart, hiddenRows.length));
              hiddenRowsData.json.push(jsonHiddenData);
            }
            else hiddenRowsData.json.push(JSON.stringify(hiddenRows));
            hiddenRowsData.header = `${alphaMap[1]}${alphaMap[1]}1:${alphaMap[alphaKey1]}${alphaMap[alphaKey2]}1`;

            var jsonDataRange = activeWorksheet.getRange(hiddenRowsData.header);
            jsonDataRange.load("values");
            jsonDataRange.values = [hiddenRowsData.json];
          }
          catch(err){
            //$scope.reportDetails.msg = err.message;
          }

        }
        activeWorksheet.getRange("A1:A1").select();
        
        return ctx.sync()
          .then(function () {}).catch(function (err) {
            //$scope.reportDetails.msg = err;
          });
      });
    };

    function changeReportDetails(sheetName, jsonSheetData){
      $scope.$apply(function () {
        $scope.reportDetails.worksheet = sheetName;
        $scope.reportDetails.hiddenRows = [];

        if(jsonSheetData && jsonSheetData[0]){
          var jsonData = _.compact(jsonSheetData[0]);
          try{
            _.forEach(jsonData, (val) => {
              $scope.reportDetails.hiddenRows = $scope.reportDetails.hiddenRows.concat(JSON.parse(val));
            });
          }
          catch(err){
            //$scope.reportDetails.msg = err.message;
          }
          
          var unselectedFound = _.find($scope.reportDetails.hiddenRows, 'selected');
          if(unselectedFound){
            unselectedFound = _.find($scope.reportDetails.hiddenRows, ['selected',false]);
            if(unselectedFound) $scope.reportDetails.selectAll = false;
            else $scope.reportDetails.selectAll = true;
          }
          else $scope.reportDetails.selectAll = false;

          if($scope.reportDetails.hiddenRows && $scope.reportDetails.hiddenRows.length > 0){
            $scope.reportDetails.msg = "";
          }
          else $scope.reportDetails.msg = "No Data Returned";
        }
        else $scope.reportDetails.msg = "No Data Returned";
        
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
      var selected = $('#selectAll').is(':checked');
      var water = [];

      $scope.modalData.message = selected ? "Expanding Rows..." : "Collapsing Rows...";
      modalService.showReportLoadingModal();

      try {
        _.forEach($scope.reportDetails.hiddenRows, function (row) {
          row.selected = selected;

          water.push(function (cb) {
            Excel.run(function(ctx) {
              var worksheet = ctx.workbook.worksheets.getItem($scope.reportDetails.worksheet);
              var range = worksheet.getRange(row.range);
              range.rowHidden = !selected;

              return ctx.sync()
              .then(function (response) {
                cb(null);
              }).catch(function (err) {
                cb(null);
              });
            });
          });
        });

        async.waterfall(water, function (err, res) {
          $scope.$apply(function () {
            modalService.hideReportLoadingModal();
          });
        });
      } 
      catch (e) {
        // $scope.$apply(function () {
        //   $scope.reportDetails.msg = e;
        // });
      }
    }

    $scope.toggleRow = function (label) {
      //modalService.showDataLoadingModal();
      var selections = $('#containerList').find("input");
      var labels = $('#containerList').find("label");
      var selectAll = true;
      var i, labelText, row, selected;
      for(i=0; i<selections.length; i++){
        labelText = labels[i].textContent.trim();
        row = labelText.split(']');
        if(!$(selections[i]).is(':checked')) selectAll = false;
        if(label.rows == (row[0]+"]") )selected = $(selections[i]).is(':checked');
      }

      $scope.reportDetails.selectAll = selectAll;
      toggleHiddenRow(label, selected);
    };

    function toggleHiddenRow(label, selected){
      Excel.run(function (ctx) {
        
        var worksheet = ctx.workbook.worksheets.getItem($scope.reportDetails.worksheet);
        var range = worksheet.getRange(label.range);
        range.rowHidden = !selected;

        return ctx.sync()
          .then(function(){
            $scope.$apply(function () {
              modalService.hideDataLoadingModal();
            });
          }).catch(function (err) {
            // $scope.$apply(function () {
            //   $scope.reportDetails.msg = err;
            // });
          });
      });
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
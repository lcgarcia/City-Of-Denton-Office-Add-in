/**
 * Jobcost Controller
 */

app.controller('jobcostCtrl', [
  '$http', 
  '$scope', 
  '$rootScope',
  '$state',
  'jobcostService',
  'modalService',
  function ($http, $scope, $rootScope, $state, jobcostService, modalService) {
    $scope.filteredDepartment = [];
    $scope.filteredCompany = [];
    $scope.filteredProject = [];
    $scope.filteredJob = [];
    $scope.filteredDetails = [];

    $scope.filteredDetails = [
      {name:"No Details"},
      {name:"Cost Code/Type Details"},
      {name:"FERC/Cost Code Subtotals"},
      {name:"Cost Type Subtotals"},
      {name:"Trend - Expenditures"},
      {name:"Trend - Budget"},
      {name:"Trend - Encumbrances"}
    ];

    $scope.allOptionValue = {key:"*All", name:"*All"};

    $scope.reportDetails = {};
    $scope.dataErrorMsg = "No Data Returned";

    $rootScope.$on('$viewContentLoaded', jobcostReportDates);

    $(document).ready(function(){
      //Enables popup help boxes over labels
      $('[data-toggle="popover"]').popover();
    });

    function buildPage(){
      //set dates
      $scope.selectedValues.dates = {};
      $scope.selectedValues.dates.monthStart = "";
      $scope.selectedValues.dates.jdeYear ="";
      $scope.selectedValues.dates.jdeFiscalYear="";

      $scope.selectedValues.data = {};
      $scope.selectedValues.data.searchInput =""
      $scope.selectedValues.data.selectAll = false;

      $scope.reportDetails.show = false;
      $scope.reportDetails.msg = "";

      //Set Deatil IDs
      for(i=0; i<$scope.filteredDetails.length; i++){
        $scope.filteredDetails[i].key = i;
      }

      setReportData();
    }

    /**
     * [setReportData calls API to get report data]
     */
    function setReportData(){
      var rType = $scope.selectedValues.report.type;

      modalService.showDataLoadingModal();
      jobcostService.getReportData(rType).then(function(data){
        $scope.filteredDepartment = data.departments;
        $scope.filteredCompany = data.company;
        $scope.filteredProject = data.projects;
        $scope.filteredJob  = data.jobs;

        $scope.filteredDepartment.unshift($scope.allOptionValue);
        $scope.filteredCompany.unshift($scope.allOptionValue);
        $scope.filteredProject.unshift($scope.allOptionValue);
        $scope.filteredJob.unshift($scope.allOptionValue);
        $scope.filteredDetails.unshift($scope.allOptionValue);


        $scope.selectedValues.department = $scope.allOptionValue;
        $scope.selectedValues.company = $scope.allOptionValue;
        $scope.selectedValues.project = $scope.allOptionValue;
        $scope.selectedValues.job = $scope.allOptionValue;
        $scope.selectedValues.details = $scope.allOptionValue;
        modalService.hideDataLoadingModal();
      });
    }


    $scope.selectedDepartment = function(){
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;

      if(dKey == "*All"){
        setReportData();
      }
      else{
        modalService.showDataLoadingModal();
        jobcostService.getCompanies(rType, dKey).then(function(data){
          $scope.filteredCompany = data;

          $scope.filteredCompany.unshift($scope.allOptionValue);
          $scope.selectedValues.company = $scope.allOptionValue;

          modalService.hideDataLoadingModal();
        });
      }
    }


    $scope.selectedCompany = function(){
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;

      modalService.showDataLoadingModal();
      jobcostService.getProjects(rType, dKey, cKey).then(function(data){
        $scope.filteredProject = data;

        $scope.filteredProject.unshift($scope.allOptionValue);
        $scope.selectedValues.project = $scope.allOptionValue;
        
        modalService.hideDataLoadingModal();
      });
    }

    $scope.selectedProject = function(){
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;

      modalService.showDataLoadingModal();
      jobcostService.getJobs(rType, dKey, cKey, pKey).then(function(data){
        $scope.filteredJob = data;

        $scope.filteredJob.unshift($scope.allOptionValue);
        $scope.selectedValues.job = $scope.allOptionValue;
        
        modalService.hideDataLoadingModal();
      });
    }

    //Set JDE Fiscal Years
    $scope.jdeYearChange = function() {
      var selectedDates = $scope.selectedValues.dates;
      if(selectedDates && selectedDates.jdeFiscalYear == "" && selectedDates.jdeYear != ""){
        var year = parseInt(selectedDates.jdeYear);
        selectedDates.jdeFiscalYear = year + "-" + (year+1);
      }
    }

    //Open Calendar for JDE Years
    $scope.jdeYearClick = function() {
      $("#jdeCalendar").click();
    }

    $scope.getSheetData = function () {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jKey = $scope.selectedValues.job.key;
      var year = $scope.selectedValues.dates.jdeYear;
      var month = $scope.selectedValues.dates.monthStart;
      var layout = $scope.selectedValues.details;
      
      modalService.showReportLoadingModal();
      jobcostService.getSheetData(rType, month, year, dKey, cKey, pKey, jKey, layout, { projects: $scope.filteredProject })
      .then(function (data) {
        try {
          var hiddenRows = data.hiddenRows;
          _.forEach(hiddenRows, function(child) {
            child.selected = false;
          });

          data.scope = $scope;
          jobcostService.insertTable(data, function(err, response) {
            $rootScope.$broadcast('reloadHiddenRows', { rows: data.hiddenRows });
            modalService.hideReportLoadingModal();
          });
          
          /*
          data.scope = $scope;
          $rootScope.$broadcast('jobcostData', hiddenRows);
          jobcostService.insertSpreadSheetData(data, function(err, response){
            modalService.hideReportLoadingModal();
          });
          */
          
        } catch (e) {
          console.log(data);
        }
        
      });
    };

    buildPage();
  }]);
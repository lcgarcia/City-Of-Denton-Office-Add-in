/**
 * Jobcost Controller
 */

app.controller('jobcost2Ctrl', [
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

    $scope.jobStatus = [
      {key:"Open", name:"Open", jobList:[]},
      {key:"Closed", name:"Closed", jobList:[]}
    ];

    $scope.filteredDetails = [
      {name:"No Details"},
      {name:"Cost Code/Type Details"},
      {name:"FERC/Cost Code Subtotals"},
      {name:"Cost Type Subtotals"},
      {name:"Trend - Expenditures"},
      {name:"Trend - Budget"},
      {name:"Trend - Encumbrances"}
    ];

    $scope.filteredCatCode1 = [];
    $scope.filteredCC1Descriptions = [];
    $scope.filteredCatCode2 = [];
    $scope.filteredCC2Descriptions = [];
    $scope.filteredCatCode1Description = [];
    $scope.filteredCatCode2Description = [];

    $scope.allOptionValue = {key:"*All", name:"*All"};
    $scope.selectedValues.optional = {};

    $rootScope.$on('$viewContentLoaded', jobcost2ReportDates);
    $(document).ready(function(){
      //Enables popup help boxes over labels
      $('[data-toggle="popover"]').popover();
    });

    function buildPage(){
      //Set dates
      $scope.selectedValues.dates = {};
      $scope.selectedValues.dates.monthStart = "";
      $scope.selectedValues.dates.monthEnd = "";
      $scope.selectedValues.dates.yearStart = "";
      $scope.selectedValues.dates.yearEnd = "";
      $scope.selectedValues.dates.jdeYear ="";
      $scope.selectedValues.dates.jdeFiscalYear="";

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
        $scope.filteredCatCode1 = data.catCodeHead;
        $scope.filteredCC1Descriptions = [];
        $scope.filteredCC2Descriptions = [];
        
        $scope.filteredDepartment.unshift($scope.allOptionValue);
        $scope.filteredCompany.unshift($scope.allOptionValue);
        $scope.filteredProject.unshift($scope.allOptionValue);
        $scope.filteredJob.unshift($scope.allOptionValue);
        $scope.filteredDetails.unshift($scope.allOptionValue);
        $scope.jobStatus.unshift($scope.allOptionValue);
        $scope.filteredCatCode1.unshift($scope.allOptionValue);
        $scope.filteredCC1Descriptions.unshift($scope.allOptionValue);
        $scope.filteredCC2Descriptions.unshift($scope.allOptionValue);
        
        $scope.selectedValues.department = $scope.allOptionValue;
        $scope.selectedValues.company = $scope.allOptionValue;
        $scope.selectedValues.project = $scope.allOptionValue;
        $scope.selectedValues.job = $scope.allOptionValue;
        $scope.selectedValues.jobStatus = $scope.allOptionValue;
        $scope.selectedValues.details = $scope.allOptionValue;

        $scope.filteredCatCode2 = $scope.filteredCatCode1;
        $scope.selectedValues.optional.cat1 = $scope.allOptionValue;
        $scope.selectedValues.optional.cat2 = $scope.allOptionValue;
        $scope.selectedValues.optional.cat1Description = $scope.allOptionValue;
        $scope.selectedValues.optional.cat2Description = $scope.allOptionValue;

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

    var updateJobs = function () {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jsKey = $scope.selectedValues.jobStatus.key;

      modalService.showDataLoadingModal();
      jobcostService.getJobWithStatus(rType, dKey, cKey, pKey, jsKey).then(function(data){
        $scope.filteredJob = [];
        if(data[0]){
          $scope.filteredJob = data;
        }
        $scope.filteredJob.unshift($scope.allOptionValue);
        $scope.selectedValues.job = $scope.allOptionValue;
        
        modalService.hideDataLoadingModal();
      });
    }

    $scope.selectedProject = updateJobs
    $scope.selectedJobStatus = updateJobs

    $scope.selectedCatCode1 = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jsKey = $scope.selectedValues.jobStatus.key;
      var jKey = $scope.selectedValues.job.key;
      var ccKey = $scope.selectedValues.optional.cat1.key;

      modalService.showDataLoadingModal();
      jobcostService.getCatCodeDescription(rType, dKey, cKey, pKey, jsKey, jKey, ccKey).then(function(data){
        $scope.filteredCC1Descriptions = [];
        if(data[0]){
          $scope.filteredCC1Descriptions = data;
        }
        $scope.filteredCC1Descriptions.unshift($scope.allOptionValue);
        $scope.selectedValues.optional.cat1Description = $scope.allOptionValue;
        modalService.hideDataLoadingModal();
      });
    }

    $scope.selectedCatCode2 = function() {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jsKey = $scope.selectedValues.jobStatus.key;
      var jKey = $scope.selectedValues.job.key;
      var ccKey = $scope.selectedValues.optional.cat2.key;

      $scope.showReportDetails = true;
      modalService.showDataLoadingModal();
      jobcostService.getCatCodeDescription(rType, dKey, cKey, pKey, jsKey, jKey, ccKey).then(function(data){
        $scope.filteredCC2Descriptions = [];
        if(data[0]){
          $scope.filteredCC2Descriptions = data;
        }
        $scope.filteredCC2Descriptions.unshift($scope.allOptionValue);
        $scope.selectedValues.optional.cat2Description = $scope.allOptionValue;
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

    $scope.getJobData = function () {
      var rType = $scope.selectedValues.report.type;
      var dKey = $scope.selectedValues.department.key;
      var cKey = $scope.selectedValues.company.key;
      var pKey = $scope.selectedValues.project.key;
      var jKey = $scope.selectedValues.job.key;
      var year = $scope.selectedValues.dates.jdeYear;
      var month = $scope.selectedValues.dates.monthStart;
      var jobStatus = $scope.selectedValues.jobStatus.key;
      var catField = $scope.selectedValues.optional.cat1.key;
      var catField1 = $scope.selectedValues.optional.cat1Description.key;
      var catCode = $scope.selectedValues.optional.cat2.key;
      var catCode1 = $scope.selectedValues.optional.cat2Description.key;

      var options = {
        projects: $scope.filteredProject,
        jobStatus: jobStatus,
        catField: catField,
        catField1: catField1,
        catCode: catCode,
        catCode1: catCode1
      }

      
      modalService.showReportLoadingModal();
      jobcostService.getSheetData(rType, month, year, dKey, cKey, pKey, jKey, options)
      .then(function (data) {
        try {
          _.forEach(data.hiddenRows, function(child) {
            child.selected = false;
          });
          $scope.sheetData = data;
          data.scope = $scope;
          jobcostService.insertSpreadSheetData(data, function(err, response){
            modalService.hideReportLoadingModal();
            if (err) {
              /*
              $scope.$apply(function () {
                $scope.debugMessage = err;
              })
              */ 
            } else {
              //$scope.debugMessage = 'DONE';
            }
          });
        } catch (e) {
          console.log(data);
        }
        
      });
    };

    

    buildPage();
  }]);
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

    $scope.filteredFiscalYears = [
      {name:"2010-2011"},
      {name:"2011-2012"},
      {name:"2012-2013"},
      {name:"2013-2014"},
      {name:"2014-2015"},
      {name:"2015-2016"},
      {name:"2016-2017"}
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

      //Set Fiscal Year IDs
      for(i=0; i<$scope.filteredFiscalYears.length; i++){
        $scope.filteredFiscalYears[i].id = i;
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
        

        $scope.filteredDepartment.unshift($scope.allOptionValue);
        $scope.filteredCompany.unshift($scope.allOptionValue);
        $scope.filteredProject.unshift($scope.allOptionValue);
        $scope.filteredJob.unshift($scope.allOptionValue);
        $scope.filteredDetails.unshift($scope.allOptionValue);
        $scope.jobStatus.unshift($scope.allOptionValue);
        $scope.filteredCatCode1.unshift($scope.allOptionValue);
        
        $scope.selectedValues.department = $scope.allOptionValue;
        $scope.selectedValues.company = $scope.allOptionValue;
        $scope.selectedValues.project = $scope.allOptionValue;
        $scope.selectedValues.job = $scope.allOptionValue;
        $scope.selectedValues.jobStatus = $scope.allOptionValue;
        $scope.selectedValues.details = $scope.allOptionValue;

        $scope.filteredCatCode2 = $scope.filteredCatCode1;
        $scope.selectedValues.optional.cat1 = $scope.allOptionValue;
        $scope.selectedValues.optional.cat2 = $scope.allOptionValue;
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
        jobcostService.getCompaniesByDepartmentKey(rType, dKey).then(function(data){
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
      jobcostService.getProjectsByDepartmentAndCompanyKeys(rType, dKey, cKey).then(function(data){
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

    $scope.selectedCatCode1 = function() {
      
    }
    $scope.selectedCatCode2 = function() {
      
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

    

    

    buildPage();
  }]);
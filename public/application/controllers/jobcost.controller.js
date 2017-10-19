/**
 * Jobcost Controller
 */

app.controller('jobcostCtrl', [
  '$http', 
  '$scope', 
  '$rootScope',
  '$state',
  'jobcostService',
  function ($http, $scope, $rootScope, $state, jobcostService) {
    $scope.filteredDepartment = [
      {id:"09", name:"Grants", companyList:[]}
    ];

    $scope.filteredCompany = [
      {id:"00402", name:"Streets/Traffic - C.O.", projectList:[]}
    ];

    $scope.filteredProject = [
      {id:"100001XXX", name:"Maruyama (Marriot Corbin Road)", jobStatusList:[]}
    ];

    $scope.filteredJob = [
      {name:"The Wildwood Inn"}
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


    

    $rootScope.$on('$viewContentLoaded', jobcostReportDates);

   $(document).ready(function(){
      //Enables popup help boxes over labels
      $('[data-toggle="popover"]').popover();
    });

    function buildPage(){
      $scope.selectedValues.dates = {};
      $scope.selectedValues.dates.monthStart = "";
      $scope.selectedValues.dates.jdeYear ="";
      $scope.selectedValues.dates.jdeFiscalYear="";
      //Set Job IDs
      for(i=0; i<$scope.filteredJob.length; i++){
        $scope.filteredJob[i].id = "300"+i+"0";
      }
      //Set Deatil IDs
      for(i=0; i<$scope.filteredDetails.length; i++){
        $scope.filteredDetails[i].id = i;
      }

      setReportData();
    }

    /**
     * [setReportData calls API to get report data]
     */
    function setReportData(){
      var rType = $scope.selectedValues.report.type;
      
      jobcostService.getJobcostReportData(rType).then(function(data){
        var element, value, splitIndex, id, name;
        $scope.filteredDepartment = [];
        $scope.filteredProject = [];
        $scope.filteredJob = [];

        //departments
        _.forEach(data.departments, function(obj) {
          value = obj[0].trim();
          splitIndex = value.indexOf(' ');

          element = {};
          element.id = value.substr(0,splitIndex);
          element.name = value.substr(splitIndex+1);

          $scope.filteredDepartment.push(element);
        });

        //projects
        _.forEach(data.projects, function(obj) {
          value = obj[0].trim();
          splitIndex = value.indexOf(' ');

          element = {};
          element.id = value.substr(0,splitIndex);
          element.name = value.substr(splitIndex+1);

          $scope.filteredProject.push(element);
        });

        //jobs
        _.forEach(data.jobs, function(obj) {
          value = obj[0].trim();
          splitIndex = value.indexOf(' ');

          element = {};
          element.id = value.substr(0,splitIndex);
          element.name = value.substr(splitIndex+1);

          $scope.filteredJob.push(element);
        });




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

    

    

    buildPage();
  }]);
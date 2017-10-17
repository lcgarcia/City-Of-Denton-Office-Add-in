/**
 * Jobcost Controller
 */

app.controller('jobcostCtrl', [
  '$http', 
  '$scope', 
  '$rootScope',
  '$state',
  function ($http, $scope, $rootScope, $state) {
    $scope.modalLoad = {};
    $scope.swing = "R";

    $scope.filteredDepartment = [
      {id:"09", name:"Grants", companyList:[]},
      {id:"10", name:"Facilities", companyList:[]},
      {id:"20", name:"Airport", companyList:[]},
      {id:"25", name:"Engineering", companyList:[]},
      {id:"30", name:"Development", companyList:[]},
      {id:"31", name:"Transportation", companyList:[]}
    ];

    $scope.filteredCompany = [
      {id:"00402", name:"Streets/Traffic - C.O.", projectList:[]},
      {id:"00403", name:"Parks Projects Fund - C.O.", projectList:[]},
      {id:"00404", name:"General Gov Misc - C.O.", projectList:[]},
      {id:"00408", name:"Vehicles & Equipment", projectList:[]},
      {id:"00409", name:"City Facilities Projects - C.O.", projectList:[]},
      {id:"00410", name:"Denton Munincipal Complex(245)", projectList:[]}
    ];

    $scope.filteredProject = [
      {id:"100001XXX", name:"Maruyama (Marriot Corbin Road)", jobStatusList:[]},
      {id:"100002XXX", name:"Unallocated Vehicle Funds", jobStatusList:[]},
      {id:"100003XXX", name:"Unallocated Funds", jobStatusList:[]},
      {id:"100004XXX", name:"Audio Visual/Camera Equipment", jobStatusList:[]},
      {id:"100005XXX", name:"Tree Power", jobStatusList:[]},
      {id:"100006XXX", name:"DMC Parking Lot", jobStatusList:[]}
    ];

    $scope.filteredJob = [
      {name:"The Wildwood Inn"},
      {name:"Jack Bells Apts Hercules 1229"},
      {name:"Law Enforcement Block Grant BS"},
      {name:"Law Enforcement Block Grant RE"},
      {name:"Law Enforcement Block Grant EX"},
      {name:"Law Enforcement Block Grant EX"}
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


    $scope.selectedValues = {dates:{monthStart:"", jdeYear:"", jdeFiscalYear:""}};

    $rootScope.$on('$viewContentLoaded', jobcostReportDates);

   $(document).ready(function(){
      //Enables popup help boxes over labels
      $('[data-toggle="popover"]').popover();
    });

    function buildPage(){
      //Set Job IDs
      for(i=0; i<$scope.filteredJob.length; i++){
        $scope.filteredJob[i].id = "300"+i+"0";
      }
      //Set Deatil IDs
      for(i=0; i<$scope.filteredDetails.length; i++){
        $scope.filteredDetails[i].id = i;
      }
    }

    $scope.changeSwing = function (swing) {
      $scope.swing = swing;
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
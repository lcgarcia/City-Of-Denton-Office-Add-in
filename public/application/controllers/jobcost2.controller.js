/**
 * Jobcost Controller
 */

app.controller('jobcost2Ctrl', [
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

    $scope.jobStatus = [
      {id:1, name:"Open", jobList:[]},
      {id:2, name:"Closed", jobList:[]}
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

    $scope.filteredFiscalYears = [
      {name:"2010-2011"},
      {name:"2011-2012"},
      {name:"2012-2013"},
      {name:"2013-2014"},
      {name:"2014-2015"},
      {name:"2015-2016"},
      {name:"2016-2017"}
    ];    

    $scope.filteredCatCode1 = [
      {name:"Sales Order Detail (F4211)", descriptionList:[]},
      {name:"Fund Group", descriptionList:[]},
      {name:"Fund Type", descriptionList:[]},
      {name:"Operating Department", descriptionList:[]},
      {name:"Special Revenue Dept", descriptionList:[]},
      {name:"Gen Gov Funding Resource", descriptionList:[]},
      {name:"Proprietary Funding Resource", descriptionList:[]}
    ];

    $scope.filteredCC1Descriptions = [
      {name:"Governmental Fund"},
      {name:"Proprietary Fund"},
      {name:"Fiduciary Fund"},
      {name:"Account Groups"}
    ];

    $scope.filteredCatCode2 = [
      {name:"Sales Order Detail (F4211)", descriptionList:[]},
      {name:"Fund Group", descriptionList:[]},
      {name:"Fund Type", descriptionList:[]},
      {name:"Operating Department", descriptionList:[]},
      {name:"Special Revenue Dept", descriptionList:[]},
      {name:"Gen Gov Funding Resource", descriptionList:[]},
      {name:"Proprietary Funding Resource", descriptionList:[]}
    ];

    $scope.filteredCC2Descriptions = [
      {name:"Blank"},
      {name:"Misc Grants"},
      {name:"Munincipal Court"},
      {name:"Police"},
      {name:"Fire"},
      {name:"Parks & Recreation"}
    ];

    $scope.filteredCatCode1Description = [];
    $scope.filteredCatCode2Description = [];

    $scope.selectedValues = {dates:{monthStart:"", yearStart:"", monthEnd:"", yearEnd:"", jdeYear:"", jdeFiscalYear:""}};

    $rootScope.$on('$viewContentLoaded', jobcost2ReportDates);


    /*
    $(window).load(function(){
    });
    */
   $(document).ready(function(){
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
      //Set Fiscal Year IDs
      for(i=0; i<$scope.filteredFiscalYears.length; i++){
        $scope.filteredFiscalYears[i].id = i;
      }
      //Set Category Code 1 Description IDs
      for(i=0; i<$scope.filteredCC1Descriptions.length; i++){
        $scope.filteredCC1Descriptions[i].id = "00" + i;
      }
      //Set Category Code 1 IDs and Descriptions
      for(i=0; i<$scope.filteredCatCode1.length; i++){
        $scope.filteredCatCode1[i].id = "0" + i;
        $scope.filteredCatCode1[i].descriptionList = $scope.filteredCC1Descriptions;
      }
      //Set Category Code 2 Description IDs
      for(i=0; i<$scope.filteredCC2Descriptions.length; i++){
        $scope.filteredCC2Descriptions[i].id = "00" + i;
      }
      //Set Category Code 2 IDs and Descriptions
      for(i=0; i<$scope.filteredCatCode2.length; i++){
        $scope.filteredCatCode2[i].id = "0" + i;
        $scope.filteredCatCode2[i].descriptionList = $scope.filteredCC2Descriptions;
      }
    }

    $scope.changeSwing = function (swing) {
      $scope.swing = swing;
    }

    $scope.selectedCatCode1 = function(type) {
      if(type){
        $scope.filteredCatCode1Description = type.descriptionList;
      }
      else{
        $scope.filteredCatCode1Description = [];
      }
    }
    $scope.selectedCatCode2 = function(type) {
      if(type){
        $scope.filteredCatCode2Description = type.descriptionList;
      }
      else{
        $scope.filteredCatCode2Description = [];
      }
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
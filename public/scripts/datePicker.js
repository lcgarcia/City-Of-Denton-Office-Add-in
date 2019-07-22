var currentDate = new Date();
currentDate.setFullYear(currentDate.getFullYear() - 1);
var currentYear = currentDate.getFullYear();

var budgetReportDates = function(event) {
  // $("#monthStart").datepicker({
  //     autoclose: !0,
  //     disableTouchKeyboard: !0,
  //     minViewMode: 1,
  //     maxViewMode: 1,
  //     format: "MM"
  // });
  
  //JDE Year
  $("#jdeYear").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    orientation: "top right",
    format: "yyyy",
    endDate: '+1d'
  });
  
  //JDE Year Events
  $("#jdeYear").datepicker().on('changeDate', function(selected) {
    if ($("#jdeYearSelection").val()) {
      year = parseInt($("#jdeYearSelection").val());
      dateRange = year + "-" + (year + 1);
      $("#jdeFiscalYearSelection").val(dateRange);
    }
  });
  $("#jdeYear").datepicker().on('show', function(selected) {
    if ($("#jdeYearSelection").val() && document.getElementsByClassName("datepicker-years").length > 0) {
      yearList = document.getElementsByClassName("datepicker-years")[0].getElementsByClassName("year");
      focusIndex = _.findIndex(yearList, ['className', "year focused"]);
      activeIndex = _.findIndex(yearList, ['className', "year active"]);
      
      if (activeIndex == -1) {
        activeIndex = _.findIndex(yearList, ['textContent', $("#jdeYearSelection").val()]);
      }
      
      if (focusIndex != -1) {
        yearList[focusIndex].className = "year";
      }
      if (activeIndex != -1) {
        yearList[activeIndex].className = "year active";
        yearList[activeIndex].setAttribute("style", "margin-right: -2px;");
        yearList[activeIndex + 1].setAttribute("style", "background-color: #daeeff;");
      }
    }
  });
  
  // $("#monthSelection").val("September"); 
  // $("#monthSelection").datepicker("update"); 
  
  $("#jdeYearSelection").val(currentYear.toString());
  $("#jdeYearSelection").datepicker("update");
}

var jobcostReportDates = function(event) {
  //Month & Year Start
  /*
  $("#monthStart").datepicker({
      autoclose: !0,
      disableTouchKeyboard: !0,
      minViewMode: 1,
      maxViewMode: 1,
      format: "MM"
  });
  */
  
  //JDE Year
  $("#jdeYear").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    orientation: "top right",
    format: "yyyy",
    endDate: '+1d'
  });
  
  //JDE Year Events
  $("#jdeYear").datepicker().on('changeDate', function(selected) {
    if ($("#jdeYearSelection").val()) {
      year = parseInt($("#jdeYearSelection").val());
      dateRange = year + "-" + (year + 1);
      $("#jdeFiscalYearSelection").val(dateRange);
    }
  });
  $("#jdeYear").datepicker().on('show', function(selected) {
    if ($("#jdeYearSelection").val() && document.getElementsByClassName("datepicker-years").length > 0) {
      yearList = document.getElementsByClassName("datepicker-years")[0].getElementsByClassName("year");
      focusIndex = _.findIndex(yearList, ['className', "year focused"]);
      activeIndex = _.findIndex(yearList, ['className', "year active"]);
      
      if (activeIndex == -1) {
        activeIndex = _.findIndex(yearList, ['textContent', $("#jdeYearSelection").val()]);
      }
      
      if (focusIndex != -1) {
        yearList[focusIndex].className = "year";
      }
      if (activeIndex != -1) {
        yearList[activeIndex].className = "year active";
        yearList[activeIndex].setAttribute("style", "margin-right: -2px;");
        yearList[activeIndex + 1].setAttribute("style", "background-color: #daeeff;");
      }
    }
  });
  
  /*
  $("#monthStartSelection").val("September"); 
  $("#monthStartSelection").datepicker("update"); 
  */
  
  $("#jdeYearSelection").val(currentYear.toString());
  $("#jdeYearSelection").datepicker("update");
  
}

var jobcost2ReportDates = function(event) {
  //Month & Year Start
  // $("#monthStart").datepicker({
  //     autoclose: !0,
  //     disableTouchKeyboard: !0,
  //     minViewMode: 1,
  //     maxViewMode: 1,
  //     format: "MM"
  // });
  $("#yearStart").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    format: "yyyy",
    endDate: '+1d'
  });
  
  //Month & Year End
  // $("#monthEnd").datepicker({
  //     autoclose: !0,
  //     disableTouchKeyboard: !0,
  //     minViewMode: 1,
  //     maxViewMode: 1,
  //     format: "MM"
  // });
  $("#yearEnd").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    format: "yyyy",
    endDate: '+1y'
  });
  
  //JDE Year
  $("#jdeYear").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    orientation: "top right",
    format: "yyyy",
    endDate: '+1d'
  });
  
  //Month Start Events
  // $("#monthStart").datepicker().on('changeDate', function(selected){
  //     if($("#yearStartSelection").val() && $("#yearEndSelection").val() &&
  //         $("#monthStartSelection").val() && $("#monthEndSelection").val()){
  //         startDate = $("#monthStartSelection").val();
  
  //         if(changeStartMonth()){
  //             $('#monthEndSelection').datepicker('setDate', startDate);
  //         }       
  //     }
  // });
  //Month End Events
  // $("#monthEnd").datepicker().on('changeDate', function(selected){
  //     if($("#yearStartSelection").val() && $("#yearEndSelection").val() &&
  //         $("#monthStartSelection").val() && $("#monthEndSelection").val()){
  //         startDate = $("#monthEndSelection").val();
  
  //         if(changeStartMonth()){
  //             $('#monthStartSelection').datepicker('setDate', startDate);
  //         }       
  //     }
  // });
  
  //Year Start Events
  $("#yearStart").datepicker().on('changeDate', function(selected) {
    if ($("#yearStartSelection").val() && $("#yearEndSelection").val()) {
      var selectedStartMonth = $('#monthStartSelection')[0];
      startDate = $("#yearStartSelection").val();
      startMonth = selectedStartMonth.selectedOptions[0].text;
      
      if (changeStartYear()) {
        $('#yearEndSelection').datepicker('setDate', startDate);
      }
      // if(changeStartMonth()){
      //     $('#monthEndSelection').datepicker('setDate', startMonth);
      // }   
      
    }
  });
  //Year End Events
  $("#yearEnd").datepicker().on('changeDate', function(selected) {
    if ($("#yearStartSelection").val() && $("#yearEndSelection").val()) {
      startDate = $("#yearEndSelection").val();
      
      if (changeStartYear()) {
        $('#yearStartSelection').datepicker('setDate', startDate);
      }
    }
  });
  
  //JDE Year Events
  $("#jdeYear").datepicker().on('changeDate', function(selected) {
    if ($("#jdeYearSelection").val()) {
      year = parseInt($("#jdeYearSelection").val());
      dateRange = year + "-" + (year + 1);
      $("#jdeFiscalYearSelection").val(dateRange);
    }
  });
  $("#jdeYear").datepicker().on('show', function(selected) {
    if ($("#jdeYearSelection").val() && document.getElementsByClassName("datepicker-years").length > 0) {
      yearList = document.getElementsByClassName("datepicker-years")[0].getElementsByClassName("year");
      focusIndex = _.findIndex(yearList, ['className', "year focused"]);
      activeIndex = _.findIndex(yearList, ['className', "year active"]);
      
      if (activeIndex == -1) {
        activeIndex = _.findIndex(yearList, ['textContent', $("#jdeYearSelection").val()]);
      }
      
      if (focusIndex != -1) {
        yearList[focusIndex].className = "year";
      }
      if (activeIndex != -1) {
        yearList[activeIndex].className = "year active";
        yearList[activeIndex].setAttribute("style", "margin-right: -2px;");
        yearList[activeIndex + 1].setAttribute("style", "background-color: #daeeff;");
      }
    }
  });
  
  // $("#monthStartSelection").val("September"); 
  // $("#monthStartSelection").datepicker("update"); 
  $("#yearStartSelection").val(currentYear.toString());
  $("#yearStartSelection").datepicker("update");
  
  // $("#monthEndSelection").val("September"); 
  // $("#monthEndSelection").datepicker("update"); 
  $("#yearEndSelection").val((currentYear + 1).toString());
  $("#yearEndSelection").datepicker("update");
  
  $("#jdeYearSelection").val(currentYear.toString());
  $("#jdeYearSelection").datepicker("update");
  
  function changeStartMonth() {
    var selectedStartMonth = $('#monthStartSelection')[0];
    var selectedEndMonth = $('#monthEndSelection')[0];
    // var startMonth = getMonthFromString($("#monthStartSelection").val());
    // var endMonth =  getMonthFromString($("#monthEndSelection").val());
    var startMonth = getMonthFromString(selectedStartMonth.selectedOptions[0].text);
    var endMonth = getMonthFromString(selectedEndMonth.selectedOptions[0].text);
    var startYear = parseInt($("#yearStartSelection").val());
    var endYear = parseInt($("#yearEndSelection").val());
    
    if ((startMonth > endMonth) && (startYear == endYear)) {
      return true;
    }
    return false;
  }
  
  function changeStartYear() {
    startYear = parseInt($("#yearStartSelection").val());
    endYear = parseInt($("#yearEndSelection").val());
    if (endYear < startYear) {
      return true;
    }
    return false;
  }
  
  function getMonthFromString(month) {
    var d = Date.parse(month + "1, " + currentYear);
    if (!isNaN(d)) {
      return new Date(d).getMonth() + 1;
    }
    return -1;
  }
  
  $("#yearStart2").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    format: "yyyy",
    endDate: '+1d'
  });
  
  $("#yearEnd2").datepicker({
    autoclose: !0,
    disableTouchKeyboard: !0,
    minViewMode: 2,
    maxViewMode: 2,
    format: "yyyy",
    endDate: '+1y'
  });
  
  //Year Start Events
  $("#yearStart2").datepicker().on('changeDate', function(selected) {
    if ($("#yearStartSelection2").val() && $("#yearEndSelection2").val()) {
      var selectedStartMonth = $("#monthStartSelection2")[0];
      startDate = $("#yearStartSelection2").val();
      startMonth = selectedStartMonth.selectedOptions[0].text;
      
      if (changeStartYear2()) {
        $('#yearEndSelection2').datepicker('setDate', startDate);
      }
    }
  });
  //Year End Events
  $("#yearEnd2").datepicker().on('changeDate', function(selected) {
    if ($("#yearStartSelection2").val() && $("#yearEndSelection2").val()) {
      startDate = $("#yearEndSelection2").val();
      
      if (changeStartYear2()) {
        $('#yearStartSelection2').datepicker('setDate', startDate);
      }
    }
  });
  
  $("#yearStartSelection2").val(currentYear.toString());
  $("#yearStartSelection2").datepicker("update");
  
  $("#yearEndSelection2").val((currentYear + 1).toString());
  $("#yearEndSelection2").datepicker("update");
  
  function changeStartYear2() {
    startYear = parseInt($("#yearStartSelection2").val());
    endYear = parseInt($("#yearEndSelection2").val());
    if (endYear < startYear) {
      return true;
    }
    return false;
  }
  
}
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
  function ($http, $scope, $rootScope, $state, $stateParams, jobcostService) {
    var debugCreated = false;
    var dataCreated = false;
    var debugRange = 3;

    var dataSheetName = "Data";
    var debugSheetName = "Debug";
    var debugMsgSize = 2000;

    $scope.showSpinner = false
    $scope.showingDetail = false;
    $scope.fetched = false;
    $scope.showReportDetails = false;

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
      if($stateParams.data.user){
        //page load after login, set user info
        $scope.user = $stateParams.data.user;
        sessionStorage.setItem('user', $scope.user.name);
      }
      else{
        //page refreshed, grab user name from session
        $scope.user.name = sessionStorage.getItem('user');
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

    this.showClientDetail = function (clientKey) {
      $scope.data = $scope.test;
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(dataSheetName);
        worksheet.activate();
        _.forEach($scope.hiddenRanges, function(o) {
          var range2 = worksheet.getRange(o)
          range2.rowHidden = true
        })
        var range = worksheet.getRange($scope.test);
        range.rowHidden = false;
        return ctx.sync()
            .then(function (res) {
              $scope.showingDetail = true
            }).catch(function (err) {
              $scope.err = JSON.stringify(err)
            })
      }).catch(function(err) {
        $scope.err = JSON.stringify(err)
      });
    }

    this.getDetail = function () {
      var thisClass = this;
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(dataSheetName);
        worksheet.activate();
        if($scope.showingDetail) {
          // Hide detail
          var firstRow = worksheet.getRange('A1:Z1');
          firstRow.format.fill.color = 'EEEEEE';
          _.forEach($scope.hiddenRanges, function(o) {
            var range2 = worksheet.getRange(o)
            range2.rowHidden = true
          })
          return ctx.sync()
            .then(function (res) {
              $scope.showingDetail = false
            }).catch(function (err) {
              $scope.err = JSON.stringify(err)
            })
        } else {
          var firstRow = worksheet.getRange('A1:Z1')
          firstRow.format.fill.clear()
          var fullrange = worksheet.getRange('A1:A700')
          fullrange.rowHidden = false
          return ctx.sync()
            .then(function (res) {
              $scope.showingDetail = true
            }).catch(function (err) {
              $scope.err = JSON.stringify(err)
            })
        } 
      }).catch(function(err) {
        $scope.err = JSON.stringify(err)
      });
    }

    /**
     * Step 0: Execute our chain of commands
     */
    var getData = function () {
      /*
      $scope.showLoadingModal("Loading...");
      async.waterfall([
        getHttpData,
        loadWorkSheets,
        findWorkSheets,
        initDebugSheet,
        initWorkSheet,
        formatHttpData,
        insertHttpDataIntoSpreadSheet,
        hideSpinner
      ])
      */
      $scope.showReportDetails = true;
    }

    this.getActiveSheet = function () {
      //$scope.showSpinner = true;
      async.waterfall([
        getHttpData,
        loadWorkSheets,
        findWorkSheets,
        initDebugSheet,
        hideSpinner
      ])
      
    }

    /**
     * Step 1: Get HTTP data from Harvest Server
     */
    var getHttpData = function (cb) {
      jobcostService.getSheetData('', 'September', 2015, '09', "00301", "902003XXX", "902003020")
      .then(function (response) {
        console.log(response);
        cb(null, {response: response})
      })
      /*
      var url = 'https://ks2harvestdashboard.mybluemix.net/dashboard/raw/' + moment($scope.dates.start).format('YYYY-MM-DD') + '/' + moment($scope.dates.end).format('YYYY-MM-DD');
      $http.get(url)
      .then(function (response) {
        console.log(response);
        cb(null, {response: response})
      })
      */
    }

    /**
     * Step 2: Load and pass workbook sheets and active sheet
     * @param {object}   data This is the Object passed from our async chain
     * @param {function} cb   This is the callback function for our async chain
     */
    var loadWorkSheets = function (data, cb) {
      Excel.run(function (ctx) {
        var sheets = ctx.workbook.worksheets;
        sheets.load("items");
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.load('name');

        return ctx.sync()
          .then(function(response) {
            data.sheets = sheets;
            data.activeSheet = activeWorksheet.name;
            cb(null, data)
          })
      })
    }

    /**
     * Step 3: Check all existing worksheets
     * @param {object}   data This is the Object passed from our async chain
     * @param {function} cb   This is the callback function for our async chain
     */
    var findWorkSheets = function (data, cb) {
      var allWorksheets = data.sheets;
      Excel.run(function (ctx) {
        debugCreated = false; 
        dataCreated = false;
        
        for (let i in allWorksheets.items) {
          if(allWorksheets.items[i].name == debugSheetName){
            debugCreated = true;
          }
          else if(allWorksheets.items[i].name == dataSheetName){
            dataCreated = true;
          }
        }

        return ctx.sync()
          .then(function(response) {
            cb(null, data)
          })
      })
    }


    /**
     * Step 4: Initalize debug worksheet to an empty sheet
     * @param {object}   data This is the Object passed from our async chain
     * @param {function} cb   This is the callback function for our async chain
     */
    var initDebugSheet = function (data, cb) {
      var activeSheet = data.activeSheet;
      $scope.debugMsg = JSON.stringify(activeSheet + " | " + debugCreated + " | " + dataCreated);

      if(!debugCreated){
        Excel.run(function (ctx) {
          var rowData = [];
          var rangeAddress = 'A1:D2';
          var worksheets = ctx.workbook.worksheets;
          var worksheet;
          if(activeSheet == "Sheet1"){
            worksheet = worksheets.getActiveWorksheet();
          }
          else{
            worksheet = worksheets.add();          
          }
          worksheet.name = debugSheetName;
          worksheet.load("name, position");

          var fullrange = worksheet.getRange();
          fullrange.load('values');
          fullrange.clear();

          rowData.push(["id", "Function", "Log Message", "Date"]);
          rowData.push(["1", "initDebugSheet", "Debug Created Success", getDateTime()]);

          var range = worksheet.getRange(rangeAddress);
          range.values = rowData;

          var header = range.getRow(0);
          header.format.fill.color = "#4472C4";
          header.format.font.color = "white";
          header.format.font.bold = true;
          header.format.rowHeight = 30.0;
          header.format.borders.getItem('InsideHorizontal').style = 'Continuous';
          header.format.borders.getItem('InsideVertical').style = 'Continuous';
          header.format.borders.getItem('EdgeBottom').style = 'Continuous';
          header.format.borders.getItem('EdgeLeft').style = 'Continuous';
          header.format.borders.getItem('EdgeRight').style = 'Continuous';
          header.format.borders.getItem('EdgeTop').style = 'Continuous';

          var idColumn = range.getColumn(0);
          idColumn.format.autofitColumns();

          var functionColumn = range.getColumn(1);
          functionColumn.format.autofitColumns();

          var msgColumn = range.getColumn(2);
          msgColumn.format.columnWidth = 600;
          
          var dateColumn = range.getColumn(3);
          dateColumn.numberFormat = 'mm/dd/yy hh:mm:ss.000';
          dateColumn.format.autofitColumns();
          
          //range.format.autofitColumns();
          range.load('text');
          worksheet.activate();
        
        return ctx.sync()
          .then(function(response) {
            cb(null, data);
          })
        })
      }
      else{
        cb(null, data);
      }
    }


    /**
     * Step 5: Initalize data worksheet to an empty sheet
     * @param {object}   data This is the Object passed from our async chain
     * @param {function} cb   This is the callback function for our async chain
     */
    var initWorkSheet = function (data, cb) {
      if(!dataCreated){
        Excel.run(function (ctx) {
          var worksheets = ctx.workbook.worksheets;
          var worksheet = worksheets.add();
          worksheet.name = dataSheetName;
          worksheet.load("name, position");
          insertDebugMsg("initWorkSheet","success!");

          worksheet.activate();

        return ctx.sync()
          .then(function(response) {
            cb(null, data);
          })
        })
      }
      else{
        cb(null, data);
      }
    }

    /**
     * Step 6: Format HTTP data for our spreadsheet
     * @param {object}   data This is the Object passed from our async chain
     * @param {function} cb   This is the callback function for our async chain
     */
    var formatHttpData = function(data, cb) {
      //var keyIndex = 1;
      var keyIndex = 3;
      if(!dataCreated){
        data = data.response
        Excel.run(function (ctx) {
          var ws = ctx.workbook.worksheets.getItem(dataSheetName);
          data = _.sortBy(data, function(o){ return o[keyIndex] })
          var currentCompany = '';
          var hours = 0;
          var startRange = 1;
          var newData = [];
          $scope.hiddenRanges = [];
          $scope.hideByClient = {};
          _.forEach(data, function(o, i) {
            if(currentCompany != o[keyIndex]) {
              if(currentCompany != '') {
                //var addRow = ['',currentCompany,hours,'','','','','','','','','','','',''];
                var addRow = ['','','','','',currentCompany,hours,'','','',''];
                newData.push(addRow);

                // Hide Range
                $scope.hiddenRanges.push('A'+(startRange+1)+':Z'+(newData.length));
                $scope.hideByClient[currentCompany] = 'A'+(startRange+1)+':Z'+(newData.length);
                startRange = newData.length+1;
              }
              insertDebugMsg("formatHttpData",currentCompany);

              currentCompany = o[keyIndex];
              hours = 0;
            }

            var tempHours = o[6];
            o.splice(6,1);
            o.splice(2, 0, tempHours);

            newData.push(o);
            hours += o[2];
          });

          // Add last set
          //var addRow = ['',currentCompany,hours,'','','','','','','','','','','',''];
          var addRow = ['','','','','',currentCompany,hours,'','','',''];
          newData.push(addRow);
          $scope.hiddenRanges.push('A'+(startRange+1)+':Z'+(newData.length));
          $scope.hideByClient[currentCompany] = 'A'+(startRange+1)+':Z'+(newData.length);

          $scope.debugMessage = JSON.stringify($scope.hiddenRanges);

          // Hide Ranges
          _.forEach($scope.hiddenRanges, function(o) {
            var range2 = ws.getRange(o);
            range2.rowHidden = true;
          })

          data = newData;
          data.unshift(['Dept','Company', 'x', 'Bus Unit','Object','Subsidary','Budget','Expendatures','Remaining','Encuberances','Unencumbered']);
          //data.unshift(['Date','Client','Hours','Project','Project Code','Task','Billable','Notes','Invoiced','First Name','Last Name','Department','Contractor?','Billable Rate','Cost Rate']);

          console.log('Formatted data');
          return ctx.sync()
            .then(function () {
              //$scope.debugMessage = "DONE";
              cb(null, data);
            }).catch(function (err) {
              $scope.debugMessage = err;
            })
        })
      }
      else{
        cb(null, data);
      }
    }

    /**
     * Step 7: Insert the data we formatted into the spreadsheet
     * @param {object}   data This is the Object passed from our async chain
     * @param {function} cb   This is the callback function for our async chain
     */
    var insertHttpDataIntoSpreadSheet = function(data, cb) {
      if(!dataCreated){
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(dataSheetName);
          var range = 'O';
          var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
          if (data.length > 0)
            var alphabetRangeValue = alphabet[data[0].length-1];
          var range = worksheet.getRange('A1:' + alphabetRangeValue + data.length)
          range.load('values')
          //$scope.debugMessage = data
          range.values = data
          range.format.autofitColumns()
          //$scope.debugMessage = data;
          return ctx.sync()
            .then(function (res) {
              //$scope.debugMessage = 'Added to sheet'
              cb(null, data)
            }).catch(function (err) {
              data.err = err
              cb(null, data)
            })
        });
      }
      else{
        cb(null, data);
      }
    }

    /**
     * Step 8: Remove loading stuff
     */
    var hideSpinner = function (data, cb) {
      $scope.$apply(function () {
        //$scope.showSpinner = false;
        $scope.hideLoadingModal();
        if(data.err) 
          $scope.err = JSON.stringify(err);
        else {
          $scope.showingDetail = false;
          $scope.fetched = true;
        }
      })  
    }

    function insertDebugMsg(id, msg) {
      Excel.run(function (ctx) {
        var rangeAddress = 'A'+debugRange+':D'+debugRange;
        var worksheet = ctx.workbook.worksheets.getItem(debugSheetName);
        var rowData = [];
        var dataMsg = JSON.stringify(msg);
        var rowValue = debugRange-1;
        var positionId;

        if(id == null || id == ''){
          positionId = "Unknown";
        }
        else{
          positionId = id;
        }
        dataMsg = dataMsg.substring(1, dataMsg.length-1);

        if(dataMsg.length > debugMsgSize){
          var startIndex = 0;
          var endIndex = debugMsgSize;

          rangeAddress = 'A'+debugRange;
          var count = 0;
          while(endIndex < dataMsg.length && count < 5){
            rowData.push([rowValue, positionId, dataMsg.substring(startIndex, endIndex), getDateTime()]);
            startIndex = endIndex;
            endIndex = endIndex + debugMsgSize;
            debugRange++;
            count++;
          }
          rowData.push([rowValue, positionId, dataMsg.substring(startIndex, endIndex), getDateTime()]);
          rangeAddress = rangeAddress+':D'+debugRange;
          
        }
        else{
          rowData.push([rowValue, positionId, dataMsg, getDateTime()]);
        }

        var range = worksheet.getRange(rangeAddress);
        range.values = rowData;

        if(rowValue%2 == 0){
          range.format.fill.color = '#c1e2ff';
        }
        

        var msgColumn = range.getColumn(2);
        msgColumn.format.wrapText = true;
      

        var idColumn = range.getColumn(0);
        idColumn.format.autofitColumns();

        
        var dateColumn = range.getColumn(3);
        dateColumn.numberFormat = 'mm/dd/yy hh:mm:ss.000';
        dateColumn.format.autofitColumns();
        
        //range.format.autofitColumns();
        range.load('text');
        worksheet.activate();
        debugRange++;

        return ctx.sync()
            .then(function (res) {
              //$scope.showingDetail = true;
            }).catch(function (err) {
              $scope.err = JSON.stringify(err);
            })
      }).catch(function(err) {
        $scope.err = JSON.stringify(err);
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
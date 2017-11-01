app.service("jobcostService", [
  '$http',
  function($http){

  	this.getReportData = function(type) {
  		console.log("Fetching Jobcost Data, Type: '" + type + "'");
      var query = getQueryType(type);

  		return $http.get("/ks2inc/job/ui/data" + query)
        .then(
    		function(response) {
    			return response.data;
    		},
        function (httpError) {
          // translate the error
          throw httpError.status + " : " + httpError.data;
        }
      );
  	};

    this.getCompanies = function(type, key) {
      console.log("Fetching Jobcost Companies, Type: '" + type + "'");
      var query = getQueryType(type);

      return $http.get("/ks2inc/job/companies/" + key + query)
        .then(
        function(response) {
          return response.data;
        },
        function (httpError) {
          // translate the error
          throw httpError.status + " : " + httpError.data;
        }
      );
    };

    this.getProjects = function(type, departmentKey, companyKey) {
      console.log("Fetching Jobcost Projects, Type: '" + type + "'");
      var query = getQueryType(type);
      
      return $http.get("/ks2inc/job/project/"+departmentKey+"/"+companyKey+query)
        .then(
        function(response) {
          return response.data;
        },
        function (httpError) {
          // translate the error
          throw httpError.status + " : " + httpError.data;
        }
      );
    };

    this.getJobs = function (type, departmentKey, companyKey, projectKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      return this.getJobsAPIRequest("/ks2inc/job/"+departmentKey+"/"+companyKey+"/"+projectKey+query);
    }

    this.getJobWithStatus = function (type, departmentKey, companyKey, projectKey, jobStatusKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      query += "&jobstatus=" + jobStatusKey;
      return this.getJobsAPIRequest("/ks2inc/job/"+departmentKey+"/"+companyKey+"/"+projectKey+query);
    };

    this.getJobsAPIRequest = function (url) {
      return $http.get(url)
        .then(
        function(response) {
          return response.data;
        },
        function (httpError) {
          // translate the error
          throw httpError.status + " : " +httpError.data;
        }
      );
    };

    this.getCatCodeDescription = function(type, departmentKey, companyKey, projectKey, jobStatusKey, jobKey, catCodeKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      
      return $http.get("/ks2inc/job/code/detail/"+departmentKey+"/"+companyKey+"/"+projectKey+"/"+jobStatusKey+"/"+jobKey+"/"+catCodeKey+query)
        .then(
        function(response) {
          return response.data;
        },
        function (httpError) {
          // translate the error
          throw httpError.status + " : " + httpError.data;
        }
      );
    };

    /**
     * Get data for the spreadsheet
     * @param  {string} type          Type of spreadsheet
     * @param  {string} departmentKey 
     * @param  {string} companyKey    
     * @param  {string} projectKey    
     * @param  {string} jobKey        
     * @param  {object} options       Object containing the data for new and ka jobcosts
     *                                { status: jobStatus, catField, catField1, catCode, catCode1 }
     * @return {promise}              Promise from the $http request
     */
    this.getSheetData = function (type, month, year, departmentKey, companyKey, projectKey, jobKey, layout, options) {
      var requestData = {
        month: month,
        year: year,
        layout: 'Cost Code/Type Details',
        department: departmentKey,
        company: companyKey,
        project: projectKey,
        job: jobKey,
        projectList: options.projects, 
      };

      if (type === 'new' || type === 'ka') {
        requestData.status = options.jobStatus;
        requestData.catField = options.catCode1;
        requestData.catField1 = options.catCode1Description;
        requestData.catCode = options.catCode2;
        requestData.catCode2 = options.catCode2Description;
      }

      return $http.post('/ks2inc/job/sheet/data', JSON.stringify(requestData), {headers: {'Content-Type': 'application/json'} })
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    };

    function getQueryType(type){
      if(type === 'ka') {return '?type=ka'}
      else if(type === 'e') {return '?type=e'}
      else if(type === 'new') {return '?type=new'}
      return '';
    }

    /**
     * Insert data into spreadsheet
     * @param  {object}   data Data object from the getSheetData call
     * @param  {Function} cb   Callback function
     * @return {(err, data)}   Data and error object form async call
     */
    this.insertSpreadSheetData = function (data, cb) {
      // Callback with (err, result)
      try {
        async.waterfall([
          function (next) {
            next(null, data);
          },
          loadWorkSheets,
          findWorkSheet,
          initalizeWorkSheet,
          hideRows,
          insertDataToWorkSheet,
          setSubTotalFormat,
          addGrandTotal,
          setHeader,
        ], cb);
      } catch (e) {
        cb(e);
      }
    };

    var loadWorkSheets = function (data, next) {
      Excel.run(function (ctx) {
        var sheets = ctx.workbook.worksheets;
        sheets.load("items");
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.load('name');

        return ctx.sync()
          .then(function(response) {
            data.sheets = sheets;
            data.activeSheet = activeWorksheet.name;
            next(null, data);
          }).catch(function (err) {
            next(err);
          });
      });
    };

    var findWorkSheet = function (data, next) {
      var allWorksheets = data.sheets;
      Excel.run(function (ctx) {
        var dataCreated = false;
        var dataSheetName = 'Jobcost-90'
        
        _.forEach(data.sheets.items, function (sheet) {
          if(sheet.name == dataSheetName)
            dataCreated = true;
        });

        return ctx.sync()
          .then(function (response) {
            data.dataSheetName = dataSheetName;
            data.dataCreated = dataCreated;
            next(null, data);
          }).catch(function (err) {
            next(err);
          });
      });
    }

    var initalizeWorkSheet = function (data, next) {
      if(!data.dataCreated){
        Excel.run(function (ctx) {
          var worksheets = ctx.workbook.worksheets;
          var worksheet = worksheets.add();
          worksheet.name = data.dataSheetName;
          worksheet.load("name, position");

          worksheet.activate();

        return ctx.sync()
          .then(function () {
            next(null, data);
          }).catch(function (err) {
            next(err);
          });
        });
      } else next(null, data);
    }

    var hideRows = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        var fullrange = worksheet.getRange('A1:Z1000');
        fullrange.rowHidden = false;

        _.forEach(data.hiddenRows, function (rowData) {
          var range = worksheet.getRange(rowData.range);
          range.rowHidden = true;
        });

        return ctx.sync()
          .then(function () {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'hideRows'});
          });
      });
    };

    var insertDataToWorkSheet = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = 'O';
        var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        if (data.sheetData.length > 0)
          var alphabetRangeValue = alphabet[data.sheetData[0].length-1];

        var fullrange = worksheet.getRange();
        fullrange.load('values');
        fullrange.clear();

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('A' + headerOffset + ':' + alphabetRangeValue + sheetLength)
        range.load('values')
        range.values = data.sheetData
        range.format.autofitColumns()

        var numberRange = worksheet.getRange('G' + headerOffset + ':' + alphabetRangeValue + sheetLength)
        var format = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';
        numberRange.numberFormat = _.fill(Array(data.sheetData.length),_.fill(Array(5), format));
        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'insertHttpDataIntoSpreadSheet', len: sheetLength });
          });
      });
    };

    var setSubTotalFormat = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

        _.forEach(data.subTotalRows, function (val) {
          var numberRange = worksheet.getRange('E'+val+':K'+val);
          var range = worksheet.getRange('A'+val+':Z'+val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          var format = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* "-"??_);_(@_)';
          numberRange.numberFormat = [_.fill(Array(7), format)];
        });

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('E' + headerOffset + ':K' + sheetLength)
        range.format.columnWidth = 110;

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'setSubTotalColor'});
          });
      })
    };

    var addGrandTotal = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var headerOffset = 6;
        var length = headerOffset + data.sheetData.length;
        var range = 'D' + length + ':K' + length;
        var grandTotalData = [['Grand Total', '', '', '=SUBTOTAL(9,G6:G' + (length-1) + ')', '=SUBTOTAL(9,H6:H' + (length-1) + ')', '=SUBTOTAL(9,I6:I' + (length-1) + ')', '=SUBTOTAL(9,J6:J' + (length-1) + ')', '=SUBTOTAL(9,K6:K' + (length-1) + ')']];

        var range = worksheet.getRange(range);
        range.load('values');
        range.values = grandTotalData;

        var format = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';
        range.numberFormat = [_.fill(Array(8), format)];
        range.format.font.bold = true;
        range.format.font.color = 'black';

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'addGrandTotal', len: sheetLength });
          });
      });
    };

    var setHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var jsonHiddenData = JSON.stringify(data.hiddenRows);

        var header = [
          ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart, ''],
          [jsonHiddenData, '', '', 'Date Run', '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', data.scope.selectedValues.dates.jdeYear + ' - ' + (parseInt(data.scope.selectedValues.dates.jdeYear)+1), ''],
          ['', '', '', 'Unaudited/Unofficial-Not intended for public distribution', '', '', 'Project:', data.scope.selectedValues.project.name, 'Layout:', 'Cost Code/Type Details', ''],
          ['', '', '', '', '', '', 'Job:', data.scope.selectedValues.job.name, '', '', ''],
          ["Dept", "Company", "Project", "Bus Unit", "Object", "Subsidary", "Budget", "Expendatures", "Remaining", "Encumbrances", "Unencumbered"]
        ];

        var range = worksheet.getRange('A1:K5');
        range.load('values');
        range.values = header;

        var jsonDataRange = worksheet.getRange('A1:C4');
        jsonDataRange.format.font.color = 'white';
        jsonDataRange.merge(true);

        var titleSection = worksheet.getRange('D1:D2');
        titleSection.format.font.color = '#174888';

        var titleCell = worksheet.getRange('D1');
        titleCell.format.font.bold = true;


        var infoCell = worksheet.getRange('D3');
        infoCell.format.font.color = 'red';
        infoCell.format.font.italic = true;

        var reportheaders = worksheet.getRange('G1:G4');
        reportheaders.format.font.color = '#174888';
        reportheaders.format.font.bold = true;

        var reportRangeHeader = worksheet.getRange('I1:I4');
        reportRangeHeader.format.font.color = '#174888';
        reportRangeHeader.format.font.bold = true;

        var tableHeader = worksheet.getRange('A5:K5');
        tableHeader.format.fill.color = '#174888';
        tableHeader.format.font.color = 'white';

        var leftColumns = worksheet.getRange('A:C');
        leftColumns.format.horizontalAlignment = 'Center';

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var fullSheetRange = worksheet.getRange('A1:K' + sheetLength);
        fullSheetRange.load('values');
        fullSheetRange.format.autofitColumns();

        var gCol = worksheet.getRange('G1:G' + sheetLength);
        gCol.format.columnWidth = 110;

        return ctx.sync()
          .then(function (res) {
            next(null, {header: header});
          }).catch(function (err) {
            next({err: err, stage: 'setHeader', range: 'A1:K' + sheetLength, header: header});
          });
      });
    };
  }
]);
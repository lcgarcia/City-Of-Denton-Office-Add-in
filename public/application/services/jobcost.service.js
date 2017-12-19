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

    this.insertTable = function (data, cb) {
      try {
        async.waterfall([
          function (next) {
            var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
            if (data.sheetData.length > 0)
              data.alphabetRangeValue = alphabet[data.sheetData[0].length-1];
            data.headerOffset = 6;
            next(null, data);
          },
          //deleteWorkSheets,
          loadWorkSheets,
          findWorkSheet,
          initalizeWorkSheet,
          clearSheet,
          setHeader,
          createTable,
          addTableHeader,
          addTableRows,
          addFilter,
          addGrandTotal,
          addFormatting,
          //removeOldSheet,
          //insertData
        ], cb);
      } catch (e) {
        cb(e);
      }
    };

    var removeOldSheet = function (data, next) {
      var deletePlaceholder = function (cb) {
        Excel.run(function (ctx) {
          var worksheets = ctx.workbook.worksheets.load('name');
          var worksheet = worksheets.getItem('report-' + data.dummySheetName);
          worksheet.delete();
          
          return ctx.sync()
            .then(function(response) {
              cb(null, data);  
            }).catch(function (err) {
              cb(err);
            });
        });
      }

      async.retry({times: 2, interval: 300}, deletePlaceholder, function(err, data) {
        next(null, data);
      });
    }

    var deleteWorkSheets = function (data, next) {
      Excel.run(function (ctx) {
        var sheets = ctx.workbook.worksheets;
        var worksheet = sheets.add();
        var date = new Date();
        data.dummySheetName = date.getTime();
        worksheet.name = 'report-' + data.dummySheetName;
        worksheet.load("name, position");
        worksheet.activate();
        sheets.load("items");
        var count = ctx.workbook.worksheets.getCount();
        return ctx.sync()
          .then(function(response) {
            var sheets = ctx.workbook.worksheets;
            sheets.load("items");
            var ids = _.map(sheets.items, function(sheet) { return sheet.id });
            _.forEach(ids, function (id, key) {
              var ws = ctx.workbook.worksheets.getItem(id);
              if (key < ids.length - 1) 
                ws.delete();
            });
           
            return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
          }).catch(function (err) {
            next(err);
          });
      });
    }

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
          worksheets.load("items, name");
          return ctx.sync()
          .then(function () {
            var sheetMap = _.map(ctx.workbook.worksheets.items, function(sheet) { return sheet.id });
            _.forEach(sheetMap, function (id, key) {
              var ws = worksheets.getItem(id);
              if ( key != sheetMap.length - 1 )
                ws.delete();
            });
           
            return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
          }).catch(function (err) {
            next(null, data);
          });
        });
      } else {
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var worksheets = ctx.workbook.worksheets;
          worksheets.load("items");
          return ctx.sync()
          .then(function () {
            var sheetMap = _.map(ctx.workbook.worksheets.items, function(sheet) { return sheet.id });

            _.forEach(sheetMap, function (id, key) {
              if (id != worksheet.id) {
                var ws = worksheets.getItem(id);
                ws.delete();
              };
            });
           
            return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
          }).catch(function (err) {
            next(null, data);
          });
        });
      }
    }

    var setHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var jsonHiddenData = JSON.stringify(data.hiddenRows);

        var header = [
          ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart, ''],
          [data.hiddenRows.length > 1000 ? '' : jsonHiddenData, '', '', moment().format('MM/DD/YYYY, h:mm:ss a'), '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', data.scope.selectedValues.dates.jdeYear + ' - ' + (parseInt(data.scope.selectedValues.dates.jdeYear)+1), ''],
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
        tableHeader.rowHidden = true;

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
            data.header = header;
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'setHeader', range: 'A1:K' + sheetLength, header: header});
          });
      });
    };

    var clearSheet = function (data, next) {
      Excel.run(function (ctx) {
        var ws = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = ws.getUsedRange();
        range.clear();

        return ctx.sync()
        .then(function (res) {
          next(null, data);
        }).catch(function (err) {
          next(null, data);
        })
      })
    }

    var createTable = function (data, next) {
      Excel.run(function (ctx) {
        var table = ctx.workbook.tables.add('\''+data.dataSheetName+'\'!A' + data.headerOffset + ':'+data.alphabetRangeValue+ data.headerOffset, true);
        table.load('name');

        return ctx.sync()
          .then(function (response) {
            data.tableName = table.name;
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addTableHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var tables = ctx.workbook.tables;
        tables.getItem(data.tableName).getHeaderRowRange().values = [["Dept", "Company", "Project", "Bus Unit", "Object", "Subsidary", "Budget", "Expendatures", "Remaining", "Encumbrances", "Unencumbered"]];

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addTableRows = function (data, next) {
      Excel.run(function (ctx) {
        if (data.sheetData.length > 5000) {
          var split = _.chunk(data.sheetData, data.sheetData.length/20);
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var tables = ctx.workbook.tables;
          tables.getItem(data.tableName).rows.add(0, split[0]);
          tables.getItem(data.tableName).rows.add(split[0].length, split[1]);
          tables.getItem(data.tableName).rows.add(split[1].length, split[2]);
          tables.getItem(data.tableName).rows.add(split[2].length, split[3]);
          tables.getItem(data.tableName).rows.add(split[3].length, split[4]);
          tables.getItem(data.tableName).rows.add(split[4].length, split[5]);
          tables.getItem(data.tableName).rows.add(split[5].length, split[6]);
          tables.getItem(data.tableName).rows.add(split[6].length, split[7]);
          tables.getItem(data.tableName).rows.add(split[7].length, split[8]);
          tables.getItem(data.tableName).rows.add(split[8].length, split[9]);
          tables.getItem(data.tableName).rows.add(split[9].length, split[10]);
          tables.getItem(data.tableName).rows.add(split[10].length, split[11]);
          tables.getItem(data.tableName).rows.add(split[11].length, split[12]);
          tables.getItem(data.tableName).rows.add(split[12].length, split[13]);
          tables.getItem(data.tableName).rows.add(split[13].length, split[14]);
          tables.getItem(data.tableName).rows.add(split[14].length, split[15]);
          tables.getItem(data.tableName).rows.add(split[15].length, split[16]);
          tables.getItem(data.tableName).rows.add(split[16].length, split[17]);
          tables.getItem(data.tableName).rows.add(split[17].length, split[18]);
          tables.getItem(data.tableName).rows.add(split[16].length, split[19]);
        } else {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var tables = ctx.workbook.tables;
          if (data.sheetData.length > 0) 
            tables.getItem(data.tableName).rows.add(0, data.sheetData);
          //else 
            //tables.getItem(data.tableName).rows.add(0, [_.repeat(11, '')]);
        }
        return ctx.sync()
          .then(function (response) {
            //data.tableName = table.name;
            next(null, data);  
          }).catch(function (err) {
            data.scope.$apply(function () {
              data.scope.debugMsg = err;
            });
            next(null, data);
          });
      });
    }

    var addFilter = function (data, next) {
      Excel.run(function (ctx) {
        var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var table = sheet.tables.getItem(data.tableName);

        filter = table.columns.getItem("Project").filter;
        filter.apply({
            filterOn: Excel.FilterOn.values,
            values: ["-"]
        });

        var len = data.sheetData.length + data.headerOffset;
        sheet.getUsedRange().format.autofitColumns();
        var sheetLength = data.sheetData.length + data.headerOffset - 1;
        var range = sheet.getRange('E' + data.headerOffset + ':K' + len)
        range.format.columnWidth = 110;
        return ctx.sync()
          .then(function (response) {
            //data.tableName = table.name;
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addFormatting = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var len = data.sheetData.length + data.headerOffset;
        var numberRange = worksheet.getRange('G1:' + data.alphabetRangeValue + len)
        var format = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* "-"??_);_(@_)';
        numberRange.numberFormat = _.fill(Array(len),_.fill(Array(5), format));

        var len = data.sheetData.length + data.headerOffset;
        worksheet.getUsedRange().format.autofitColumns();
        var sheetLength = data.sheetData.length + data.headerOffset - 1;
        var range = worksheet.getRange('E' + data.headerOffset + ':K' + len)
        range.format.columnWidth = 110;
        return ctx.sync()
          .then(function (response) {
            //data.tableName = table.name;
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    /**
     * Insert data into spreadsheet
     * @depricated             This function is depricated
     * 
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
          deleteWorkSheets,
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
        var range = 'D' + (length+1) + ':K' + (length+1);
        var grandTotalData = [['Grand Total', '', '', '=SUM(G5:G' + (length) + ')/2', '=SUM(H6:H' + (length) + ')/2', '=SUM(I6:I' + (length) + ')/2', '=SUM(J6:J' + (length) + ')/2', '=SUM(K6:K' + (length) + ')/2']];

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
  }
]);
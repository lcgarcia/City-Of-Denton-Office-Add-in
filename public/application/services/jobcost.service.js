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
    this.getSheetData = function (type, month, year, departmentKey, companyKey, projectKey, jobKey, options) {
      var requestData = {
        month: month,
        year: year,
        layout: 'Cost Code/Type Details',
        department: departmentKey,
        company: companyKey,
        project: projectKey,
        job: jobKey,
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

        _.forEach(data.hiddenRows, function (rowKey) {
          var rangeString = 'A'+(parseInt(rowKey)+1)+':Z'+(parseInt(rowKey)+2)
          var range = worksheet.getRange(rangeString);
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

        var range = worksheet.getRange('A1:' + alphabetRangeValue + data.sheetData.length)
        range.load('values')
        range.values = data.sheetData
        range.format.autofitColumns()
        return ctx.sync()
          .then(function (res) {
            next(null, data)
          }).catch(function (err) {
            next({err: err, stage: 'insertHttpDataIntoSpreadSheet'});
          })
      });
    }
  }
]);
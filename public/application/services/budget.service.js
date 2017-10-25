app.service("budgetService", [
  '$http',
  function($http){

  	this.getReportData = function(type) {
  		var query = '';
      console.log("Fetching Budget Data, Type: '" + type + "'");
  		if(type === 'a') query = '?type=a'
  		if(type === 'e') query = '?type=e'
  		if(type === 'f') query = '?type=f'
  		return $http.get("/ks2inc/budget/business/unit" + query)
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

    this.getSheetData = function (type, keys, month, buLevel, year, options) {
      var data = {
        type: type,
        keys: keys,
        month: month,
        buLevel: buLevel,
        year: year,
        accounts: "Between '0' and '3999'"
      };

      return $http.post('/ks2inc/budget/sheet/data', JSON.stringify(data), {headers: {'Content-Type': 'application/json'} })
      .then(function (response) {
        return response.data;
      },
      function (httpError) {
        throw httpError.status + " : " + httpError.data;
      });
    };

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
          setMainHeaderFormat,
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
        var dataSheetName = data.sheetKey + 'BudgetReport-90';
        
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

        var numberRange = worksheet.getRange('F' + headerOffset + ':' + alphabetRangeValue + sheetLength)
        var format = '_($* #,##0.00_);_($* (#,##0.00);_($* #,##0.00_);_(@_)';
        numberRange.numberFormat = _.fill(Array(data.sheetData.length),_.fill(Array(14), format));
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
          var numberRange = worksheet.getRange('F'+val+':S'+val);
          var range = worksheet.getRange('A'+val+':Z'+val);
          //range.format.font.color = 'blue';
          range.format.font.bold = true;
          var format = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* #,##0.00_);_(@_)';
          numberRange.numberFormat = [_.fill(Array(14), format)];
        });

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var range = worksheet.getRange('F' + headerOffset + ':S' + sheetLength)
        range.format.columnWidth = 110;

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'setSubTotalColor'});
          });
      })
    };

    var setMainHeaderFormat = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

        _.forEach(data.mainHeaders, function (val) {
          var numberRange = worksheet.getRange('F'+val+':S'+val);
          var range = worksheet.getRange('E'+val+':Z'+val);
          range.format.font.bold = false;
          var format = '_($* #,##0.00_);[Red]_($* (#,##0.00);_(" "_);_(@_)';
          numberRange.numberFormat = [_.fill(Array(14), format)];
        });

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'setSubTotalColor'});
          });
      });
    };

    var setHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

        var a = worksheet.getRange('A1:A3000');
        a.format.columnWidth = 2;
        var cd = worksheet.getRange('C1:D3000');
        cd.format.columnWidth = 3;

        // Disclaimer
        var disclaimerRange = worksheet.getRange('A1:E5');
        var disclaimeValues = [['', '', '', '', ''],['', '', '', '', ''],['', '', '', '', ''],['', '', '', '', ''],['', '', '', '', '']];
        disclaimeValues[3][0] = 'Unaudited - Not for public distribution';
        disclaimerRange.load('values')
        disclaimerRange.format.font.color = 'red';
        disclaimerRange.format.font.italic = true;
        disclaimerRange.values = disclaimeValues;
        disclaimerRange.merge(true);

        // Prior Year 
        var priorHeader = worksheet.getRange('F4:G4');
        var priorHeaderValues = [['Prior Year Actuals', '']];
        priorHeader.load('values');
        priorHeader.values = priorHeaderValues;
        priorHeader.format.horizontalAlignment = 'Center';
        priorHeader.format.font.color = 'white';
        priorHeader.format.fill.color = '#325694';
        priorHeader.merge(true);
        var priorRow = worksheet.getRange('F5:G5');
        var prValues = [['Annual', 'YTD']];
        priorRow.load('values');
        priorRow.values = prValues;
        priorRow.format.horizontalAlignment = 'Center';
        var fullPrior = worksheet.getRange('F4:G5');
        fullPrior.format.borders.getItem('EdgeBottom').style = 'Continuous';
        fullPrior.format.borders.getItem('EdgeLeft').style = 'Continuous';
        fullPrior.format.borders.getItem('EdgeRight').style = 'Continuous';
        fullPrior.format.borders.getItem('EdgeTop').style = 'Continuous';

        // Current annual budget
        var currentAnnual = worksheet.getRange('H4:J4');
        var currentAnnualValues = [['Current Annual Budget', '', '']];
        currentAnnual.load('values');
        currentAnnual.values = currentAnnualValues;
        currentAnnual.format.horizontalAlignment = 'Center';
        currentAnnual.format.font.color = 'white';
        currentAnnual.format.fill.color = '#325694';
        currentAnnual.merge(true);
        var annualRow = worksheet.getRange('H5:J5');
        var arValues = [['Original', 'Modified', 'Avail Balance']];
        annualRow.load('values');
        annualRow.values = arValues;
        annualRow.format.horizontalAlignment = 'Center';
        var fullAnnual = worksheet.getRange('H4:J5');
        fullAnnual.format.borders.getItem('EdgeBottom').style = 'Continuous';
        fullAnnual.format.borders.getItem('EdgeLeft').style = 'Continuous';
        fullAnnual.format.borders.getItem('EdgeRight').style = 'Continuous';
        fullAnnual.format.borders.getItem('EdgeTop').style = 'Continuous';

        // Current YTD
        var ytdHeader = worksheet.getRange('K4:N4');
        var ytdHeaderValues = [['Current Year to Date', '', '', '']];
        ytdHeader.load('values');
        ytdHeader.values = ytdHeaderValues;
        ytdHeader.format.horizontalAlignment = 'Center';
        ytdHeader.format.font.color = 'white';
        ytdHeader.format.fill.color = '#325694';
        ytdHeader.merge(true);
        var ytdRow = worksheet.getRange('K5:N5');
        var ytdrValues = [['Budget', 'Encumberances', '(Rev)/Expanded', 'Total']];
        ytdRow.load('values');
        ytdRow.values = ytdrValues;
        ytdRow.format.horizontalAlignment = 'Center';
        var fullYTD = worksheet.getRange('K4:N5');
        fullYTD.format.borders.getItem('EdgeBottom').style = 'Continuous';
        fullYTD.format.borders.getItem('EdgeLeft').style = 'Continuous';
        fullYTD.format.borders.getItem('EdgeRight').style = 'Continuous';
        fullYTD.format.borders.getItem('EdgeTop').style = 'Continuous';

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'setHeader'});
          });

      });
    };
  }
]);
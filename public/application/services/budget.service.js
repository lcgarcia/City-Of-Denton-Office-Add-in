app.service("budgetService", [
  '$http',
  function($http){
    //var timeoutMs = $timeout( function(){}, 20000 );
    var formatPricing = '_(* #,##0.00_);_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingRed = '_(* #,##0.00_);[Red]_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingTotal = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* #,##0.00_);_(@_)';

    var requestRetry = function (method) {
      return new Promise(function (resolve, reject) {
        async.retry({ times: 3, interval: 500 }, method, function (err, result) {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

  	this.getReportData = function(type) {
      var makeRequest = function (cb) {
        var query = '';
        console.log("Fetching Budget Data, Type: '" + type + "'");
        if(type === 'a') query = '?type=a'
        if(type === 'e') query = '?type=e'
        if(type === 'f') query = '?type=f'
        return $http.get("/ks2inc/budget/business/unit" + query)
          .then(
          function(response) {
            cb(null, response.data);
          },
          function (httpError) {
            cb(httpError.status + " : " + httpError.data);
          }
        );
      }

      return requestRetry(makeRequest);
  	};

    this.getSheetData = function (type, keys, month, buLevel, year, accounts, options) {
      var makeRequest = function (cb) {
        var data = {
          type: type,
          keys: keys,
          month: month,
          buLevel: buLevel,
          year: year,
          accounts: "Between '0' and '3999'"
        };
        data.accounts = accounts == 'Income Statement' ? "Between '4000' and '9999'" : data.accounts;

        if ('subledgers' in options) {
          data.subledgers = options.subledgers;
        }

        return $http.post('/ks2inc/budget/sheet/data', JSON.stringify(data), { headers: {'Content-Type': 'application/json'} })
        .then(function (response) {
          cb(null, response.data);
        },
        function (httpError) {
          cb(httpError.status + " : " + httpError.data);
        });
      }

      return requestRetry(makeRequest);
    };

    this.insertSpreadSheetData = function (data, cb) {
      // Callback with (err, result)
      try {
        async.waterfall([
          function (next) {
            next(null, data);
          },
          //deleteWorkSheets,
          loadWorkSheets,
          findWorkSheet,
          initalizeWorkSheet,
          hideRows,
          insertDataToWorkSheet,
          setSubTotalFormat,
          addGrandTotal,
          addSubtotalUnderline,
          setMainHeaderFormat,
          setHeader,
          removeOldSheet,
        ], cb);
      } catch (e) {
        cb(e);
      }
    };

    var removeOldSheet = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem('report-' + data.dummySheetName);
        worksheet.delete();
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    this.deleteWorkSheets = function (data, cb) {
      var date = new Date();
      data.dummySheetName = date.getTime();
      try {
        async.waterfall([
          function (next) {
            next(null, data);
          },
          createDummySheet,
          deleteAllSheets, 
        ], cb);
      } catch (e) {
        cb(e, data);
      }
    }

    var createDummySheet = function (data, next) {
      Excel.run(function (ctx) {
        var sheets = ctx.workbook.worksheets;
        var worksheet = sheets.add();
        worksheet.name = 'report-' + data.dummySheetName;
        worksheet.load("name, position");
        worksheet.activate();
        sheets.load("items");
        var count = ctx.workbook.worksheets.getCount();
        return ctx.sync()
          .then(function(response) {
            data.items = sheets.items;
            next(null, data);
          }).catch(function (err) {
            next(err, data);
          });
      });
    }

    var deleteAllSheets = function (data, next) {
      Excel.run(function (ctx) {
        var ids = _.map(data.items, function(sheet) { return sheet.id });
        _.forEach(ids, function (id, key) {
          var ws = ctx.workbook.worksheets.getItem(id);
          if (key < ids.length - 1) 
            ws.delete();
        });

        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function (err) {
            next(err, data);
          });        
      });
    }

    /*
    this.deleteWorkSheets = function (data, next) {
      var deleteAllSheets = function (cb) {
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
                cb(null, data);  
              }).catch(function (err) {
                cb(err);
              });
            }).catch(function (err) {
              cb(err);
            });
        });
      };

      async.retry({times: 5, interval: 300}, deleteAllSheets, function (err, data) {
        next(null, data);
      });
    }
    */

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
        var dataSheetName = data.sheetKey + '_BudgetReport-90';

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
            next(null, data);
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

          delete rowData["$$hashKey"];
          delete rowData.object;
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
        numberRange.numberFormat = _.fill(Array(data.sheetData.length),_.fill(Array(14), formatPricing));
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
          numberRange.numberFormat = [_.fill(Array(14), formatPricingRed)];
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

    var addGrandTotal = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var headerOffset = 6;
        var length = headerOffset + data.sheetData.length;
        var range = 'E' + length + ':S' + length;
        var grandTotalData = [['Net Income/(Loss)', '=SUBTOTAL(9,F6:F' + (length-1) + ')', '=SUBTOTAL(9,G6:G' + (length-1) + ')', '=SUBTOTAL(9,H6:H' + (length-1) + ')', '=SUBTOTAL(9,I6:I' + (length-1) + ')', '=SUBTOTAL(9,J6:J' + (length-1) + ')', '=SUBTOTAL(9,K6:K' + (length-1) + ')', '=SUBTOTAL(9,L6:L' + (length-1) + ')', '=SUBTOTAL(9,M6:M' + (length-1) + ')', '=SUBTOTAL(9,N6:N' + (length-1) + ')', '=SUBTOTAL(9,O6:O' + (length-1) + ')', '=SUBTOTAL(9,P6:P' + (length-1) + ')', '=SUBTOTAL(9,Q6:Q' + (length-1) + ')', '=SUBTOTAL(9,R6:R' + (length-1) + ')', '=SUBTOTAL(9,S6:S' + (length-1) + ')']];

        var range = worksheet.getRange(range);
        range.load('values');
        range.values = grandTotalData;
        range.numberFormat = [_.fill(Array(15), formatPricingTotal)];
        range.format.font.bold = true;
        range.format.font.color = '#00037B';
        range.format.rowHeight = 40;
        range.format.verticalAlignment = 'Center';

        return ctx.sync()
          .then(function (res) {
            next(null, data);
          }).catch(function (err) {
            next({err: err, stage: 'addGrandTotal', len: sheetLength });
          });
      });
    };

    var addSubtotalUnderline = function (data, next) {
      if ('allSubTotalRows' in data) {
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

          var allSubtotals = _.clone(data.allSubTotalRows);
          var boldSubtotals = _.clone(data.subTotalRows);
          _.pullAll(allSubtotals, boldSubtotals);

          _.forEach(allSubtotals, function (val) {
            var numberRange = worksheet.getRange('F'+val+':S'+val);
            numberRange.format.font.underline = 'Single';
          });

          return ctx.sync()
            .then(function (res) {
              next(null, data);
            }).catch(function (err) {
              next({err: err, stage: 'addSubtotalUnderline'});
            });
        });
      } else next(null, data);
    };

    var setMainHeaderFormat = function (data, next) {
      if ('mainHeaders' in data) {
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

          _.forEach(data.mainHeaders, function (val) {
            var numberRange = worksheet.getRange('F'+val+':S'+val);
            var range = worksheet.getRange('E'+val+':Z'+val);
            range.format.font.bold = false;
            numberRange.format.borders.getItem('EdgeTop').style = 'Continuous';
            numberRange.numberFormat = [_.fill(Array(14), formatPricingRed)];
          });

          return ctx.sync()
            .then(function (res) {
              next(null, data);
            }).catch(function (err) {
              next({err: err, stage: 'setMainHeaderFormat'});
            });
        });
      } else {
        next(null, data);
      }
    };

    var setHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var jsonHiddenData = JSON.stringify(data.hiddenRows);

        var a = worksheet.getRange('A1:A3000');
        a.format.columnWidth = 2;
        var cd = worksheet.getRange('C1:D3000');
        cd.clear();
        cd.format.columnWidth = 1;

        //Hidden JSON Data
        var jsonDataRange = worksheet.getRange('A1:E2');
        var jsonDataValues = [['', '', '', '', ''],['', '', '', '', '']];
        jsonDataValues[1][0] = jsonHiddenData;
        jsonDataRange.load('values');
        jsonDataRange.format.font.color = 'white';
        jsonDataRange.values = jsonDataValues;
        jsonDataRange.merge(true);

        //Disclaimer
        var disclaimerRange = worksheet.getRange('A3:E5');
        var disclaimeValues = [['', '', '', '', ''],['', '', '', '', ''],['', '', '', '', '']];
        disclaimeValues[1][0] = 'Unaudited - Not for public distribution';
        disclaimerRange.load('values')
        disclaimerRange.format.font.color = 'red';
        disclaimerRange.format.font.italic = true;
        disclaimerRange.values = disclaimeValues;
        disclaimerRange.merge(true);

        // This is just so it is more readable
        var ranges = [
          { fullRange: 'F4:G5', title: 'F4:G4', titleText: [['Prior Year Actuals', '']], subTitle: 'F5:G5',  subText: [['Annual', 'YTD']] },
          { fullRange: 'H4:J5', title: 'H4:J4', titleText: [['Current Annual Budget', '', '']], subTitle: 'H5:J5',  subText: [['Original', 'Modified', 'Avail Balance']] },
          { fullRange: 'K4:N5', title: 'K4:N4', titleText: [['Current Year to Date', '', '', '']], subTitle: 'K5:N5',  subText: [['Budget', 'Encumberances', '(Rev)/Expanded', 'Total']] },
          { fullRange: 'O4:R5', title: 'O4:R4', titleText: [['Current Period', '', '', '']], subTitle: 'O5:R5',  subText: [['Budget', 'Encumberances', '(Rev)/Expanded', 'Total']] },
          { fullRange: 'S4:S5', title: 'S4:S4', titleText: [['Proposed']], subTitle: 'S5:S5',  subText: [['Budget']] },
        ];

        var titles = _.flattenDeep(_.map(ranges, function(val){ return val.titleText }));
        var subTitles = _.flattenDeep(_.map(ranges, function(val){ return val.subText }));

        var titleRange = worksheet.getRange('F4:S4');
        titleRange.load('values');
        titleRange.values = [titles];
        //titleRange.format.horizontalAlignment = 'Center';
        titleRange.format.font.color = 'white';
        titleRange.format.fill.color = '#325694';

        var t0 = worksheet.getRange(ranges[0].title);
        var t1 = worksheet.getRange(ranges[1].title);
        var t2 = worksheet.getRange(ranges[2].title);
        var t3 = worksheet.getRange(ranges[3].title);
        var t4 = worksheet.getRange(ranges[4].title);
        t0.format.horizontalAlignment = 'Center';
        t1.format.horizontalAlignment = 'Center';
        t2.format.horizontalAlignment = 'Center';
        t3.format.horizontalAlignment = 'Center';
        t4.format.horizontalAlignment = 'Center';

        var subTitleRange = worksheet.getRange('F5:S5');
        subTitleRange.load('values');
        subTitleRange.values = [subTitles];
        subTitleRange.format.horizontalAlignment = 'Center';

        var rangeGroup1 = worksheet.getRange(ranges[0].fullRange);
        var rangeGroup2 = worksheet.getRange(ranges[1].fullRange);
        var rangeGroup3 = worksheet.getRange(ranges[2].fullRange);
        var rangeGroup4 = worksheet.getRange(ranges[3].fullRange);
        var rangeGroup5 = worksheet.getRange(ranges[4].fullRange);
        rangeGroup1.format.borders.getItem('EdgeBottom').style = 'Continuous';
        rangeGroup1.format.borders.getItem('EdgeLeft').style = 'Continuous';
        rangeGroup1.format.borders.getItem('EdgeRight').style = 'Continuous';
        rangeGroup1.format.borders.getItem('EdgeTop').style = 'Continuous';
        rangeGroup2.format.borders.getItem('EdgeBottom').style = 'Continuous';
        rangeGroup2.format.borders.getItem('EdgeLeft').style = 'Continuous';
        rangeGroup2.format.borders.getItem('EdgeRight').style = 'Continuous';
        rangeGroup2.format.borders.getItem('EdgeTop').style = 'Continuous';
        rangeGroup3.format.borders.getItem('EdgeBottom').style = 'Continuous';
        rangeGroup3.format.borders.getItem('EdgeLeft').style = 'Continuous';
        rangeGroup3.format.borders.getItem('EdgeRight').style = 'Continuous';
        rangeGroup3.format.borders.getItem('EdgeTop').style = 'Continuous';
        rangeGroup4.format.borders.getItem('EdgeBottom').style = 'Continuous';
        rangeGroup4.format.borders.getItem('EdgeLeft').style = 'Continuous';
        rangeGroup4.format.borders.getItem('EdgeRight').style = 'Continuous';
        rangeGroup4.format.borders.getItem('EdgeTop').style = 'Continuous';
        rangeGroup5.format.borders.getItem('EdgeBottom').style = 'Continuous';
        rangeGroup5.format.borders.getItem('EdgeLeft').style = 'Continuous';
        rangeGroup5.format.borders.getItem('EdgeRight').style = 'Continuous';
        rangeGroup5.format.borders.getItem('EdgeTop').style = 'Continuous';

        var titleWithKey = data.sheetKey + '- General Fund';
        var mainTitle = worksheet.getRange('F1:N1');
        mainTitle.load('values');
        mainTitle.values = [[titleWithKey, '', '', '', '', '', '', '', '']];
        mainTitle.format.horizontalAlignment = 'Center';
        mainTitle.format.font.size = 15;
        mainTitle.format.font.bold = true;
        mainTitle.merge(true);
        var mainTitle2 = worksheet.getRange('O1:S1');
        mainTitle2.load('values');
        mainTitle2.values = [[titleWithKey, '', '', '', '']];
        mainTitle2.format.horizontalAlignment = 'Center';
        mainTitle2.format.font.size = 15;
        mainTitle2.format.font.bold = true;
        mainTitle2.merge(true);

        var sheetTypeLabel = data.accountType;
        var sheetTypeTitle = worksheet.getRange('F2:N2');
        sheetTypeTitle.load('values');
        sheetTypeTitle.values = [[sheetTypeLabel, '', '', '', '', '', '', '', '']];
        sheetTypeTitle.format.horizontalAlignment = 'Center';
        sheetTypeTitle.format.font.size = 13;
        sheetTypeTitle.format.font.bold = true;
        sheetTypeTitle.merge(true);
        var sheetTypeTitle2 = worksheet.getRange('O2:S2');
        sheetTypeTitle2.load('values');
        sheetTypeTitle2.values = [[sheetTypeLabel, '', '', '', '']];
        sheetTypeTitle2.format.horizontalAlignment = 'Center';
        sheetTypeTitle2.format.font.size = 13;
        sheetTypeTitle2.format.font.bold = true;
        sheetTypeTitle2.merge(true);

        var periods = ["Four", "Five", "Six", "Seven", "Eight", "Nine","Ten", "Eleven", "Twelve", "One", "Two", "Three", "Thirteen"];
        var month = data.month == "13th" ? "September" : data.month;
        var year = parseInt(data.year) + 1;
        var dateFormatted = moment(year + ' ' + month, 'YYYY MMM', 'en').endOf('month').format('MMMM D, YYYY');
        var periodValue = data.month == "13th" ? 12 : new Date(dateFormatted).getMonth();
        var dateLabelValues = 'For the ' + periods[periodValue] + ' Periods Ending ' + dateFormatted;
        var dateLabel = worksheet.getRange('F3:N3');
        dateLabel.load('values');
        dateLabel.values = [[dateLabelValues, '', '', '', '', '', '', '', '']];
        dateLabel.format.horizontalAlignment = 'Center';
        dateLabel.merge(true);
        var dateLabel2 = worksheet.getRange('O3:S3');
        dateLabel2.load('values');
        dateLabel2.values = [[dateLabelValues, '', '', '', '']];
        dateLabel2.format.horizontalAlignment = 'Center';
        dateLabel2.merge(true);

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
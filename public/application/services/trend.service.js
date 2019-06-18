app.service("trendService", [
  '$http',
  '$timeout',
  function($http, $timeout){
    var formatPricing = '_(* #,##0.00_);_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingRed = '_(* #,##0.00_);[Red]_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingTotal = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* #,##0.00_);_(@_)';

    this.insertTable = function (data, cb) {
      try {
        if(data.sheetData.length == 0){
          async.waterfall([
            function (next) {
              data.sheetData = ["No Data Found. Please change your selections and try again"," "," "," "," "," "," "," "," "," "," "];
              data.alphabetRangeValue = 6;
              data.headerOffset = 6;
              data.isEmpty = true;
              data.layout = data.scope.selectedValues.details.name;
              data.budgetStart = 'G';
              data.budgetEnd = 6;

              next(null, data);
            },
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            addEmptyTableRows
          ], cb);
        }
        else{
          async.waterfall([
            function (next) {
              data.alphabetRangeValue = data.trend.lastColumn;
              data.headerOffset = 6;
              data.isEmpty = false;
              data.layout = data.scope.selectedValues.details.name;
              data.budgetStart = 'G';
              data.budgetEnd = data.trend.lastColumn;

              if (data.sheetData.length > 5000) {
                data.scope.modalData.message = 'This is going to take a while...';
              }
              next(null, data);
            },
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            createTable,
            addTableHeader,
            addTableRows,
            hideRows,
            addSubTotal,
            addGrandTotal,
            addFormatting
          ], cb);
        }
      } catch (e) {
        //USED FOR TESTING ERROR START
        // var errData = worksheet.getRange('M2');
        // errData.load("values");
        // errData.values = JSON.stringify("ERROOOORRR!!");
        //USED FOR TESTING ERROR END
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
            sheet.name = 'Jobcost-90_old';
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
    }

    var setHeader = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var jsonHiddenData = JSON.stringify(data.hiddenRows);

        var header = [
          ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart2.name +' - '+ data.scope.selectedValues.dates.monthEnd2.name, '', ''],
          [data.hiddenRows.length > 1000 ? '' : jsonHiddenData, '', '', moment().format('MM/DD/YYYY, h:mm:ss a'), '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', 'FY'+data.scope.selectedValues.dates.yearStart2 + ' thru FY' + data.scope.selectedValues.dates.yearEnd2, '', ''],
          ['', '', '', 'Unaudited/Unofficial-Not intended for public distribution', '', '', 'Project:', data.scope.selectedValues.project.name, 'Layout:', data.layout, '', ''],
          ['', '', '', '', '', '', 'Job:', data.scope.selectedValues.job.name, '', '', '', '']
        ];

        //USED FOR TESTING 
        // var sqlData = worksheet.getRange('N1');
        // sqlData.load("values");
        // sqlData.values = JSON.stringify(data.sql);

        var range = worksheet.getRange('A1:L4');
        range.load('values');
        range.values = header;

        var jsonDataRange = worksheet.getRange('A1:C4');
        jsonDataRange.format.font.color = 'white';
        jsonDataRange.merge(true);

        var spaceRange = worksheet.getRange('A5:L5');
        spaceRange.merge(true);

        var titleSection = worksheet.getRange('D1:D2');
        titleSection.format.font.color = '#174888';

        var titleCell = worksheet.getRange('D1');
        titleCell.format.font.bold = true;

        var infoCell = worksheet.getRange('D3');
        infoCell.format.font.color = 'red';
        infoCell.format.font.italic = true;

        var reportheaders = worksheet.getRange('H1:G4');
        reportheaders.format.font.color = '#174888';
        reportheaders.format.font.bold = true;

        var reportRangeHeader = worksheet.getRange('I1:I4');
        reportRangeHeader.format.font.color = '#174888';
        reportRangeHeader.format.font.bold = true;

        // var tableHeader = worksheet.getRange('A5:L5');
        // tableHeader.format.fill.color = '#174888';
        // tableHeader.format.font.color = 'white';
        // if(data.isEmpty) tableHeader.rowHidden = false;
        // else tableHeader.rowHidden = true;

        var leftColumns = worksheet.getRange('A:C');
        leftColumns.format.horizontalAlignment = 'Center';

        var rightColumns = worksheet.getRange('E:G');
        rightColumns.format.horizontalAlignment = 'Center';

        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        var fullSheetRange = worksheet.getRange('A1:L' + sheetLength);
        fullSheetRange.load('values');
        fullSheetRange.format.autofitColumns();

        var gCol = worksheet.getRange('H1:H' + sheetLength);
        gCol.format.columnWidth = 110;

        worksheet.freezePanes.freezeRows(6);
        return ctx.sync()
          .then(function (res) {
            data.header = header;
            next(null, data);
          }).catch(function (err) {

            next({err: err, stage: 'setHeader', range: 'A1:L' + sheetLength, header: header});
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
        var range = '\''+data.dataSheetName+'\'!A' + data.headerOffset + ':'+data.alphabetRangeValue+ (data.headerOffset + data.sheetData.length);
        var table = ctx.workbook.tables.add(range, true);
        table.load('name');

        return ctx.sync()
          .then(function (response) {
            data.tableName = table.name;
            data.tableId = table.id;
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
        tables.getItem(data.tableName).getHeaderRowRange().values = data.trend.header;

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }


    var addEmptyTableRows = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var messageData = [["No Data Found. Please change your selections and try again", "", "", "", "", "", "", "", "", "", ""]];
        var messageRange = worksheet.getRange('A6:K6');
        messageRange.merge(true);
        messageRange.load('values');
        messageRange.values = messageData;

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    };

    var addTableRows = function (data, next) {
      var splitLen = 40;
      var chunk = data.sheetData.length;
      var split = [data.sheetData];
      var water = [];
      
      if (data.sheetData.length > 5000) {
        chunk = 200;
        split = _.chunk(data.sheetData, chunk);
      }

      var j = 0;
      for(var i = 0; i < split.length; i++) {
        water.push(function (cb) {
          Excel.run(function(ctx) {
            var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
            
            if (split.length > 1 && j === (split.length - 1)) {
              var range = 'A' + (chunk * (j - 1) + split[j-1].length + data.headerOffset + 1) + ':' + data.budgetEnd + (chunk*j + split[j].length + data.headerOffset);
              sheet.getRange(range).values = split[j];
            } 
            else {
              var rangeAddress = 'A' + (chunk*j + data.headerOffset + 1) + ':' + data.budgetEnd + (chunk*j + split[j].length + data.headerOffset);
              var range = sheet.getRange(rangeAddress);
              range.format.font.color = 'black';
              range.format.font.bold = false;
              range.values = split[j];
            }

            data.scope.$apply(function () {
              if ((j+1) * chunk > data.sheetData.length) {
                data.scope.modalData.message = 'Loading ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
              } else {
                data.scope.modalData.message = 'Loading ' + (j+1)*chunk + ' rows of ' + data.sheetData.length;
              }
            });
            
            j++;

            return ctx.sync()
            .then(function (response) {
              cb(null);
            }).catch(function (err) {
              // var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
              // var sqlData = sheet.getRange("M1");
              // sqlData.load("values");
              // sqlData.values = JSON.stringify(err);
              cb(null);
            });
          });
        });
      }
      

      async.waterfall(water, function (err, res) {
        next(null, data);
      });
    }

    var addSubTotal = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

        _.forEach(data.subTotalRows, function (val) {
          var numberRange = worksheet.getRange(data.budgetStart+val+':'+data.budgetEnd+val);
          var range = worksheet.getRange('A'+val+':'+data.budgetEnd+val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          numberRange.numberFormat = [_.fill(Array(data.trend.periods), formatPricingRed)];
          
        });

        return ctx.sync()
          .then(function (response) {
            next(null, data);  
          }).catch(function (err) {
            next(null, data);
          });
      });
    }

    var addFormatting = function (data, next) {
      if (data.sheetData.length > 5000) {
        var len = data.sheetData.length + data.headerOffset;
        var formatArray = _.fill(Array(len),_.fill(Array(data.trend.periods), formatPricingRed));
        var chunk = 200;
        var split = _.chunk(formatArray, chunk);
        var water = [];
        var j = 0;

        for(var i = 0; i < split.length; i++) {
          water.push(function (cb) {
            Excel.run(function(ctx) {
              var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);

              if (split.length > 1 && j === (split.length - 1)) {
                var range = data.budgetStart + (chunk * (j - 1) + split[j-1].length + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk*j + split[j].length + data.headerOffset);
                sheet.getRange(range).numberFormat = split[j];
              } 
              else {
                var rangeAddress = data.budgetStart + (chunk*j + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk*j + split[j].length + data.headerOffset);
                var range = sheet.getRange(rangeAddress);
                range.numberFormat = split[j];
              }

              data.scope.$apply(function () {
                if ((j+1) * chunk > data.sheetData.length) {
                  data.scope.modalData.message = 'Formatting ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
                } 
                else {
                  data.scope.modalData.message = 'Formatting ' + (j+1)*chunk + ' rows of ' + data.sheetData.length;
                }
              });

              j++;

              return ctx.sync()
              .then(function (response) {
                cb(null);
              }).catch(function (err) {
                cb(null);
              });
            });
          });
        }
        async.waterfall(water, function (err, res) {
          next(null, data);
        });

      } else {
        Excel.run(function (ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var len = data.sheetData.length + data.headerOffset;
          var numberRange = worksheet.getRange(data.budgetStart + '7:' + data.alphabetRangeValue + len)
          numberRange.numberFormat = _.fill(Array(data.sheetData.length),_.fill(Array(data.trend.periods), formatPricingRed));

          var len = data.sheetData.length + data.headerOffset;
          worksheet.getUsedRange().format.autofitColumns();
          // var range = worksheet.getRange('E' + data.headerOffset + ':L' + len);
          // range.format.columnWidth = 110;
          return ctx.sync()
            .then(function (response) {
              next(null, data);  
            }).catch(function (err) {
              next(null, data);
            });
        });
      }
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

    var addGrandTotal = function (data, next) {
      Excel.run(function (ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var headerOffset = 6;
        var length = headerOffset + data.sheetData.length;
        var grandTotalData = data.trend.grandTotal;

        var grandRange = worksheet.getRange('D' + (length+1));
        grandRange.load('values');
        grandRange.values = "Grand Total";
        grandRange.format.font.bold = true;
        grandRange.format.font.color = '#00037B';

        var range = worksheet.getRange(data.budgetStart + (length+1) + ':' + data.budgetEnd + (length+1));
        range.load('values');
        range.values = grandTotalData;
        range.numberFormat = [_.fill(Array(data.trend.periods), formatPricingTotal)];
        range.format.font.bold = true;
        range.format.font.color = '#00037B';

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
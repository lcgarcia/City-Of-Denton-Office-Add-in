/**
 * Jobcost KA report only
 * @param  {[type]} $http     [description]
 * @param  {String} $timeout) {               var formatPricing [description]
 * @return {[type]}           [description]
 */
app.service("jobcostService2", [
  '$http',
  '$timeout',
  function($http, $timeout) {
    var formatPricing = '_(* #,##0.00_);_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingRed = '_(* #,##0.00_);[Red]_(* (#,##0.00);_(* #,##0.00_);_(@_)';
    var formatPricingTotal = '_($* #,##0.00_);[Red]_($* (#,##0.00);_($* #,##0.00_);_(@_)';
    var noDataFound = ["No Data Found. Please change your selections and try again", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "];
    
    this.insertTable = function(data, cb) {
      try {
        if (data.sheetData.length == 0) {
          async.waterfall([
            function(next) {
              var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
              data.sheetData = noDataFound;
              data.alphabetRangeValue = alphabet[data.sheetData[0].length - 1];
              data.headerOffset = 6;
              data.alphabet = alphabet;
              data.isEmpty = true;
              data.layout = data.scope.selectedValues.details.name;
              data.budgetStart = 'H';
              data.budgetEnd = 'L';
              if (data.layout == "No Details") {
                data.budgetStart = 'F';
                data.budgetEnd = 'J';
              }
              
              next(null, data);
            },
            deleteWorkSheets,
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            addEmptyTableRows,
            removeOldSheet
          ], cb);
        }
        else {
          async.waterfall([
            function(next) {
              var alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
              if (data.sheetData.length > 0)
                data.alphabetRangeValue = alphabet[data.sheetData[0].length - 1];
              data.headerOffset = 6;
              data.alphabet = alphabet;
              data.isEmpty = false;
              data.layout = data.scope.selectedValues.details.name;
              data.budgetStart = 'H';
              data.budgetEnd = 'L';
              if (data.layout == "No Details") {
                data.budgetStart = 'F';
                data.budgetEnd = 'J';
              }
              next(null, data);
            },
            deleteWorkSheets,
            loadWorkSheets,
            findWorkSheet,
            initalizeWorkSheet,
            clearSheet,
            setHeader,
            createTable,
            addTableHeader,
            addTableRows,
            hideRows,
            addFormatting,
            addSubTotal,
            addGrandTotal,
            removeOldSheet
          ], cb);
        }
      }
      catch (e) {
        //USED FOR TESTING ERROR START
        // var errData = worksheet.getRange('M2');
        // errData.load("values");
        // errData.values = JSON.stringify("ERROOOORRR!!");
        //USED FOR TESTING ERROR END
        cb(e);
      }
    };
    
    var removeOldSheet = function(data, next) {
      var deletePlaceholder = function(cb) {
        Excel.run(function(ctx) {
          var worksheets = ctx.workbook.worksheets.load('name');
          var worksheet = worksheets.getItem('report-' + data.dummySheetName);
          worksheet.delete();
          
          //Hidden JSON Data
          var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var jsonDataRange = sheet.getRange(data.hiddenRowsData.header);
          jsonDataRange.load('values');
          jsonDataRange.values = [data.hiddenRowsData.json];
          jsonDataRange.format.font.color = 'white';
          jsonDataRange.format.horizontalAlignment = 'Fill';
          jsonDataRange.format.columnWidth = 60;
          
          return ctx.sync()
            .then(function(response) {
              cb(null, data);
            }).catch(function(err) {
              cb(err);
            });
        });
      }
      
      async.retry({
        times: 2,
        interval: 300
      }, deletePlaceholder, function(err, data) {
        next(null, data);
      });
    }
    
    var deleteWorkSheets = function(data, next) {
      Excel.run(function(ctx) {
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
            var ids = _.map(sheets.items, function(sheet) {
              return sheet.id
            });
            _.forEach(ids, function(id, key) {
              var ws = ctx.workbook.worksheets.getItem(id);
              if (key < ids.length - 1)
                ws.delete();
            });
            
            return ctx.sync()
              .then(function(response) {
                next(null, data);
              }).catch(function(err) {
                next(null, data);
              });
          }).catch(function(err) {
            next(err);
          });
      });
    }
    
    var loadWorkSheets = function(data, next) {
      Excel.run(function(ctx) {
        var sheets = ctx.workbook.worksheets;
        sheets.load("items");
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.load('name');
        
        return ctx.sync()
          .then(function(response) {
            data.sheets = sheets;
            data.activeSheet = activeWorksheet.name;
            next(null, data);
          }).catch(function(err) {
            next(err);
          });
      });
    };
    
    var findWorkSheet = function(data, next) {
      //var allWorksheets = data.sheets;
      Excel.run(function(ctx) {
        var dataCreated = false;
        var dataSheetName = 'Jobcost-90';
        
        _.forEach(data.sheets.items, function(sheet) {
          if (sheet.name == dataSheetName) {
            dataCreated = true;
          }
        });
        
        return ctx.sync()
          .then(function(response) {
            data.dataSheetName = dataSheetName;
            data.dataCreated = dataCreated;
            next(null, data);
          }).catch(function(err) {
            next(err);
          });
      });
    }
    
    var initalizeWorkSheet = function(data, next) {
      if (!data.dataCreated) {
        Excel.run(function(ctx) {
          var worksheets = ctx.workbook.worksheets;
          var worksheet = worksheets.add();
          worksheet.name = data.dataSheetName;
          worksheet.load("name, position");
          
          worksheet.activate();
          
          return ctx.sync()
            .then(function() {
              next(null, data);
            }).catch(function(err) {
              next(err);
            });
        });
      }
      else next(null, data);
    }
    
    var setHeader = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var recordCount = data.sheetData === noDataFound ? "None" : data.sheetData.length;
        
        var header = [
          ['', '', '', 'City of Denton - Job Cost Summary', '', '', 'Dept:', data.scope.selectedValues.department.name, 'Month:', data.scope.selectedValues.dates.monthStart.name, '', ''],
          ['', '', '', moment().format('MM/DD/YYYY, h:mm:ss a'), '', '', 'Company:', data.scope.selectedValues.company.name, 'JDE Fiscal Year:', data.scope.selectedValues.dates.jdeYear + ' - ' + (parseInt(data.scope.selectedValues.dates.jdeYear) + 1), '', ''],
          ['', '', '', 'Unaudited/Unofficial-Not intended for public distribution', '', '', 'Project:', data.scope.selectedValues.project.name, 'Layout:', data.layout, '', ''],
          ['', '', '', '', '', '', 'Job:', data.scope.selectedValues.job.name, 'Records:', recordCount, '', '']
        ];
        
        var range = worksheet.getRange('A1:L4');
        range.load('values');
        range.values = header;
        
        var headerRange = worksheet.getRange('A1:C4');
        headerRange.format.font.color = 'white';
        headerRange.merge(true);
        
        var spaceRange = worksheet.getRange('A5:L5');
        spaceRange.merge(true);
        
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
        
        // var tableHeader = worksheet.getRange('A5:L5');
        // tableHeader.format.fill.color = '#174888';
        // tableHeader.format.font.color = 'white';
        // if(data.isEmpty) tableHeader.rowHidden = false;
        // else tableHeader.rowHidden = true;
        
        var leftColumns = worksheet.getRange('A:C');
        leftColumns.format.horizontalAlignment = 'Center';

        leftColumns = worksheet.getRange('E:G');
        leftColumns.format.horizontalAlignment = 'Center';
        
        var rightColumns = worksheet.getRange('J1:J4');
        rightColumns.format.horizontalAlignment = 'Left';
        
        var headerOffset = 6;
        var sheetLength = data.sheetData.length + headerOffset - 1;
        
        worksheet.freezePanes.freezeRows(6);
        return ctx.sync()
          .then(function(res) {
            data.header = header;
            next(null, data);
          }).catch(function(err) {
            
            next({
              err: err,
              stage: 'setHeader',
              range: 'A1:L' + sheetLength,
              header: header
            });
          });
      });
    };
    
    var clearSheet = function(data, next) {
      Excel.run(function(ctx) {
        var ws = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var range = ws.getUsedRange();
        range.clear();
        
        return ctx.sync()
          .then(function(res) {
            next(null, data);
          }).catch(function(err) {
            next(null, data);
          })
      })
    }
    
    var createTable = function(data, next) {
      Excel.run(function(ctx) {
        var range = '\'' + data.dataSheetName + '\'!A' + data.headerOffset + ':' + data.alphabetRangeValue + (data.headerOffset + data.sheetData.length);
        var table = ctx.workbook.tables.add(range, true);
        table.load('name');
        
        return ctx.sync()
          .then(function(response) {
            data.tableName = table.name;
            data.tableId = table.id;
            next(null, data);
          }).catch(function(err) {
            next(null, data);
          });
      });
    }
    
    var addTableHeader = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var tables = ctx.workbook.tables;
        var tableHeader = tables.getItem(data.tableName).getHeaderRowRange();
        if (data.layout == "No Details") {
          tableHeader.values = [
            ["Dept", "Company", "Project Manager", "Project", "Bus Unit", "Budget", "Expenditures", "Remaining", "Encumbrances", "Unencumbered"]
          ];
        }
        else tableHeader.values = [
          ["Dept", "Company", "Project Manager", "Project", "Bus Unit", "Object", "Subsidary", "Budget", "Expenditures", "Remaining", "Encumbrances", "Unencumbered"]
        ];
        tableHeader.format.horizontalAlignment = 'Center';
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function(err) {
            next(null, data);
          });
      });
    }
    
    var addEmptyTableRows = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var messageData = [
          ["No Data Found. Please change your selections and try again", "", "", "", "", "", "", "", "", "", ""]
        ];
        var messageRange = worksheet.getRange('A6:K6');
        messageRange.merge(true);
        messageRange.load('values');
        messageRange.values = messageData;
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function(err) {
            next(null, data);
          });
      });
    };
    
    var addTableRows = function(data, next) {
      var splitLen = 40;
      var chunk = data.sheetData.length;
      var split = [data.sheetData];
      var water = [];
      
      if (data.sheetData.length > 5000) {
        chunk = 200;
        split = _.chunk(data.sheetData, chunk);
      }
      
      var j = 0;
      for (var i = 0; i < split.length; i++) {
        water.push(function(cb) {
          Excel.run(function(ctx) {
            var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
            
            if (split.length > 1 && j === (split.length - 1)) {
              var range = 'A' + (chunk * (j - 1) + split[j - 1].length + data.headerOffset + 1) + ':' + data.budgetEnd + (chunk * j + split[j].length + data.headerOffset);
              sheet.getRange(range).values = split[j];
            }
            else {
              var rangeAddress = 'A' + (chunk * j + data.headerOffset + 1) + ':' + data.budgetEnd + (chunk * j + split[j].length + data.headerOffset);
              var range = sheet.getRange(rangeAddress);
              range.format.font.color = 'black';
              range.format.font.bold = false;
              range.values = split[j];
            }
            
            data.scope.$apply(function() {
              if ((j + 1) * chunk > data.sheetData.length) {
                data.scope.modalData.message = 'Loading ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
              }
              else {
                data.scope.modalData.message = 'Loading ' + (j + 1) * chunk + ' rows of ' + data.sheetData.length;
              }
            });
            
            j++;
            
            return ctx.sync()
              .then(function(response) {
                cb(null);
              }).catch(function(err) {
                // var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
                // var sqlData = sheet.getRange("M1");
                // sqlData.load("values");
                // sqlData.values = JSON.stringify(err);
                cb(null);
              });
          });
        });
      }
      
      async.waterfall(water, function(err, res) {
        next(null, data);
      });
    }
    
    var addSubTotal = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        _.forEach(data.subTotalRows, function(val) {
          var numberRange = worksheet.getRange('H' + val + ':L' + val);
          var range = worksheet.getRange('A' + val + ':Z' + val);
          range.format.font.color = 'blue';
          range.format.font.bold = true;
          numberRange.numberFormat = [_.fill(Array(5), formatPricingRed)];
          // if (data.layout == "FERC/Cost Code Subtotals" || data.layout == "Cost Type Subtotals") {
          //   numberRange = worksheet.getRange('H' + (val + 1) + ':L' + (val + 1));
          //   range = worksheet.getRange('A' + (val + 1) + ':Z' + (val + 1));
          //   range.format.font.color = 'blue';
          //   range.format.font.bold = true;
          //   numberRange.numberFormat = [_.fill(Array(5), formatPricingRed)];
          // }
          
        });
        
        return ctx.sync()
          .then(function(response) {
            next(null, data);
          }).catch(function(err) {
            next(null, data);
          });
      });
    }
    
    var addFormatting = function(data, next) {
      if (data.sheetData.length > 5000) {
        var len = data.sheetData.length + data.headerOffset;
        var formatArray = _.fill(Array(len), _.fill(Array(5), formatPricing));
        var chunk = 200;
        var split = _.chunk(formatArray, chunk);
        var water = [];
        var j = 0;
        
        for (var i = 0; i < split.length; i++) {
          water.push(function(cb) {
            Excel.run(function(ctx) {
              var sheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
              
              if (split.length > 1 && j === (split.length - 1)) {
                var range = data.budgetStart + (chunk * (j - 1) + split[j - 1].length + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk * j + split[j].length + data.headerOffset);
                sheet.getRange(range).numberFormat = split[j];
              }
              else {
                var rangeAddress = data.budgetStart + (chunk * j + data.headerOffset + 1) + ':' + data.alphabetRangeValue + (chunk * j + split[j].length + data.headerOffset);
                var range = sheet.getRange(rangeAddress);
                
                range.numberFormat = split[j];
              }
              
              data.scope.$apply(function() {
                if ((j + 1) * chunk > data.sheetData.length) {
                  data.scope.modalData.message = 'Formatting ' + data.sheetData.length + ' rows of ' + data.sheetData.length;
                }
                else {
                  data.scope.modalData.message = 'Formatting ' + (j + 1) * chunk + ' rows of ' + data.sheetData.length;
                }
              });


              if(i+1 >= split.length) {
                var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
                var len = data.sheetData.length + data.headerOffset;
                //worksheet.getUsedRange().format.autofitColumns();
                var range = worksheet.getRange('C' + (data.headerOffset+1) + ':C' + len);
                range.format.horizontalAlignment = 'Left';

                range = worksheet.getRange(data.budgetStart + (data.headerOffset+1) + ':' + data.budgetEnd + len);
                range.format.horizontalAlignment = 'Right';
              }
              
              j++;
              
              return ctx.sync()
                .then(function(response) {
                  cb(null);
                }).catch(function(err) {
                  cb(null);
                });
            });
          });
        }
        async.waterfall(water, function(err, res) {
          next(null, data);
        });
        
      }
      else {
        Excel.run(function(ctx) {
          var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
          var len = data.sheetData.length + data.headerOffset;
          var numberRange = worksheet.getRange(data.budgetStart + '7:' + data.alphabetRangeValue + len)
          numberRange.numberFormat = _.fill(Array(data.sheetData.length), _.fill(Array(5), formatPricing));
          //worksheet.getUsedRange().format.autofitColumns();
          
          var range = worksheet.getRange('C' + (data.headerOffset+1) + ':C' + len);
          range.format.horizontalAlignment = 'Left';

          range = worksheet.getRange(data.budgetStart + (data.headerOffset+1) + ':' + data.budgetEnd + len);
          range.format.horizontalAlignment = 'Right';
          return ctx.sync()
            .then(function(response) {
              //data.tableName = table.name;
              next(null, data);
            }).catch(function(err) {
              next(null, data);
            });
        });
      }
    }
    
    var hideRows = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        
        var fullrange = worksheet.getRange('A1:Z1000');
        fullrange.rowHidden = false;
        
        _.forEach(data.hiddenRows, function(rowData) {
          var range = worksheet.getRange(rowData.range);
          range.rowHidden = true;
        });
        
        return ctx.sync()
          .then(function() {
            next(null, data);
          }).catch(function(err) {
            next({
              err: err,
              stage: 'hideRows'
            });
          });
      });
    };
    
    var addGrandTotal = function(data, next) {
      Excel.run(function(ctx) {
        var worksheet = ctx.workbook.worksheets.getItem(data.dataSheetName);
        var tableBody = worksheet.tables.getItem(data.tableName).getDataBodyRange();
        var headerOffset = 6;
        var length = headerOffset + data.sheetData.length;
        var grandTotalData = [
          ['=SUBTOTAL(9,H7:H' + (length) + ')', '=SUBTOTAL(9,I7:I' + (length) + ')', '=SUBTOTAL(9,J7:J' + (length) + ')', '=SUBTOTAL(9,K7:K' + (length) + ')', '=SUBTOTAL(9,L7:L' + (length) + ')']
        ];
        
        if (data.layout == "No Details") {
          grandTotalData = [
            ['=SUBTOTAL(9,F7:F' + (length) + ')', '=SUBTOTAL(9,G7:G' + (length) + ')', '=SUBTOTAL(9,H7:H' + (length) + ')', '=SUBTOTAL(9,I7:I' + (length) + ')', '=SUBTOTAL(9,J7:J' + (length) + ')']
          ];
        }
        
        var grandRange = worksheet.getRange('D' + (length + 1));
        grandRange.load('values');
        grandRange.values = "Grand Total";
        grandRange.format.font.bold = true;
        grandRange.format.font.color = '#00037B';
        
        var range = worksheet.getRange(data.budgetStart + (length + 1) + ':' + data.budgetEnd + (length + 1));
        range.load('values');
        range.values = grandTotalData;
        range.numberFormat = [_.fill(Array(5), formatPricingTotal)];
        range.format.font.bold = true;
        range.format.font.color = '#00037B';
        tableBody.format.fill.color = 'white';

        worksheet.getUsedRange().format.autofitColumns();

        //Set Print Settings
        length++;
        var activeWorksheet = ctx.workbook.worksheets.getActiveWorksheet();
        activeWorksheet.pageLayout.orientation = Excel.PageOrientation.landscape;
        activeWorksheet.pageLayout.setPrintTitleRows("$1:$6");
        activeWorksheet.pageLayout.zoom = { scale: 60 };
        activeWorksheet.pageLayout.setPrintArea("$A$1:$"+data.budgetEnd+"$"+length);
        
        const inchPoint = 72;
        activeWorksheet.pageLayout.topMargin = 0.25 * inchPoint;
        activeWorksheet.pageLayout.bottomMargin = 0.5 * inchPoint;
        activeWorksheet.pageLayout.rightMargin = 0.3 * inchPoint;
        activeWorksheet.pageLayout.leftMargin = 0.3 * inchPoint;
        activeWorksheet.pageLayout.headerMargin = 0.25 * inchPoint;
        activeWorksheet.pageLayout.footerMargin = 0.25 * inchPoint;

        var headerFooter = activeWorksheet.pageLayout.headersFooters.defaultForAllPages;
        headerFooter.leftFooter = data.dataSheetName;
        headerFooter.centerFooter = "Page &P of &N";
        headerFooter.rightFooter = "&D &B& &I&B&T";
        
        return ctx.sync()
          .then(function(res) {
            next(null, data);
          }).catch(function(err) {
            next({
              err: err,
              stage: 'addGrandTotal',
              len: sheetLength
            });
          });
      });
    };
  }
]);
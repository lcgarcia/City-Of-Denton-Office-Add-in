/**
 * Budget Controller
 */

app.controller('budgetCtrl', [
  '$http', 
  '$scope', 
  '$rootScope',
  '$state',
  '$stateParams',
  'budgetService',
  'modalService',
  'BookService',
  function ($http, $scope, $rootScope, $state, $stateParams, budgetService, modalService, BookService) {
    $scope.modalBook = {
      msg:"",
      title:"",
      value:"",
      saveButton:"",
      detailList:[],
      error:""
    };
    $scope.selectedKeys = [];
    $scope.modalLoad = {};
    $scope.budgetList = [];
    $scope.parentList = [];
    $scope.monthValues = [{nameShort:"oct", name:"October"}, {nameShort:"nov", name:"November"}, {nameShort:"dec", name:"December"}, {nameShort:"jan", name:"January"}, {nameShort:"feb", name:"February"}, {nameShort:"mar", name:"March"}, {nameShort:"apr", name:"April"}, {nameShort:"may", name:"May"}, {nameShort:"jun", name:"June"}, {nameShort:"jul", name:"July"}, {nameShort:"aug", name:"August"}, {nameShort:"sep", name:"September"}, {nameShort:"13th", name:"13th"}];
    $scope.filteredBooks = [
      {id:"00", name:"---Select Book---", user:"default",
        selectionList:[]
      }
    ];
    $scope.userSelection = {id:"1", name:"", user:"defaultUser",
      selectionList:[]
    };

    $rootScope.$on('$viewContentLoaded', budgetReportDates);
    $(document).ready(function(){
      //Enables popup help boxes over labels
      $('#toggle-two').bootstrapToggle({
        on: 'Yes',
        off: 'No'
      });
    });

    $scope.reportDetails = {};
    $scope.dataErrorMsg = "No Data Returned";

    /**
     * [buildPage sets selected values]
     */
    function buildPage(){
      $scope.selectedValues.dates = {};
      $scope.selectedValues.reportType ="Income Statement";
      $scope.selectedValues.totalSheet = "No";
      $scope.selectedValues.month = "";
      $scope.selectedValues.year = "";

      $scope.selectedValues.dates.jdeFiscalYear = "";
      $scope.selectedValues.dates.jdeYear = "";

      $scope.selectedValues.searchInput = ""; 
      $scope.selectedValues.book = {};
      $scope.selectedValues.selectAll = false;

      $scope.reportDetails.msg = "";

      $scope.selectedValues.worksheet = "";

      //Set Month IDs
      var i;
      for(i=0; i<$scope.monthValues.length; i++){
        $scope.monthValues[i].key = i;
      }
      $scope.selectedValues.month = $scope.monthValues[11];

      var userd = $stateParams.data.user;
      if (userd != '' && userd != undefined && userd != null) {
        $scope.user = userd;
        $scope.userSelection.userId = $scope.user.oid;
        $scope.userSelection.user = $scope.user.displayName;
        BookService.getUserBooks($scope.user.oid, ($stateParams.type || 'default'))
        .then(function (books) {
          $scope.$apply(function () {
            $scope.filteredBooks = _.concat($scope.filteredBooks, books);
          });
        }).catch(function (err) {
          console.log(err);
        });
      }
      $scope.selectedValues.book = $scope.filteredBooks[0];
      setReportData();
    }

    $scope.$on('userData', function (event, user) {
      $scope.userSelection.userId = user.oid;
      $scope.userSelection.user = user.displayName;
      BookService.getUserBooks(user.oid, ($stateParams.type || 'default'))
        .then(function (books) {
          $scope.$apply(function () {
            $scope.filteredBooks = _.concat($scope.filteredBooks, books);
          });
        }).catch(function (err) {
          console.log(err);
        });
    });


    /**
     * [setReportData calls API to get report data]
     */
    function setReportData(){
      var rType = $scope.selectedValues.report.type;
      
      modalService.showDataLoadingModal();
      budgetService.getReportData(rType).then(function(data){
        $scope.$apply(function () {
          var children;
          $scope.parentList = _.orderBy(data, ['mcco'], ['asc']);
          _.forEach($scope.parentList, function(parent) {
            children = parent.childList;
            _.forEach(children, function(child) {
              child.selected = false;
              child.id = (child.id).trim();
            });
            parent.selected = false;
            parent.id = (parent.id).trim();
            parent.childList = children;
          });
          modalService.hideDataLoadingModal();
        });
      });
    }

    /**
     * [selectedReportType sets selected report type]
     * @param type [report type selected]
     */
    $scope.selectedReportType = function (type) {
      $scope.selectedValues.reportType = type;
    }

    
    /**
     * [selectedTotalSheet ]
     */
    $scope.selectedTotalSheet = function () {
      if($scope.selectedValues.totalSheet == "No"){
        $scope.selectedValues.totalSheet = "Yes";
      }
      else{
        $scope.selectedValues.totalSheet = "No";
      }
    }


    /**
     * [editBook sets the modal view depending on option selected from the book menu]
     * @param  {[String]} option [the option selected]
     */
    $scope.editBook = function(option){
      var book = $scope.selectedValues.book;
      $scope.modalBook.title = option;
      $scope.modalBook.error = "";
      $scope.modalBook.msg = "";
      $scope.modalBook.value = "";

      $("#bookModalBody").show();
      $("#bookModalInput").show();
      $("#bookModalError").hide();
      if(option == 'View'){
        $scope.modalBook.title = "Selections";
        $scope.modalBook.saveButton = "OK";
        $scope.modalBook.detailList = [];
        //
        $("#selectionDetails").show();
        $("#selectionWarning").hide();
        
        var element, childElement, noSelections;
        noSelections = true;
        //
        _.forEach($scope.parentList, function(parent) {
          if(parent.selected || (_.findIndex(parent.childList, ['selected', true]) != -1) ){
            element = {};
            element.name = parent.ccname;
            element.childList = [];
            noSelections = false;
            //
            if(parent.selected){
              childElement = {};
              childElement.name = parent.mcco + "-" + parent.ccname;
              element.childList.push(childElement);
            }
            //
            _.forEach(parent.childList, function(child) {
              if(child.selected){
                childElement = {};
                childElement.name = child.id + "-" + child.name;
                element.childList.push(childElement);
              }
            });
            $scope.modalBook.detailList.push(element);
          }
        });

        if(noSelections){
          $scope.modalBook.error = "No Selections Made";
          $("#selectionDetails").hide();
          $("#selectionWarning").show();
        }
      }
      else if(option == 'Rename'){
        $scope.modalBook.msg = "Enter a new name for '" + book.name + "'";
        $scope.modalBook.saveButton = "Save";
      }
      else if(option == 'Copy'){
        $scope.modalBook.msg = "Enter a name for the copy of '" + book.name + "'";
        $scope.modalBook.saveButton = "Save";
        $scope.modalBook.value = book.name + "_copy";
      }
      else if(option == 'Delete'){
        $scope.modalBook.msg = "Are you sure you want to delete '" + book.name + "'?";
        $scope.modalBook.saveButton = "Delete";
        $("#bookModalInput").hide();
      }
      else if(option == 'Save Changes'){
        $scope.modalBook.msg = "Save changes to '" + book.name + "'?";
        $scope.modalBook.saveButton = "Save";
        $("#bookModalInput").hide();
      }
      else if(option == 'Save'){
        var noSelections = true;
        
        //
        _.forEach($scope.parentList, function(parent) {
          if (parent.selected) noSelections = false;
          else if(_.findIndex(parent.childList, ['selected', true]) != -1){
            noSelections = false;
          }
        });

        if(noSelections){
          $scope.modalBook.error = "Cannot save empty book";
          $("#bookModalBody").hide();
          $("#bookModalError").show();
          $scope.modalBook.saveButton = "OK";
        }
        else{
          $scope.modalBook.msg = "Enter a name for this book";
          $scope.modalBook.saveButton = "Save";
        }
      }
    }

    /**
     * [saveBook logic for when user clicks on the modal button to save book details]
     */
    $scope.saveBook = function(){
      var bookIndex = _.findIndex($scope.filteredBooks, ['id', $scope.selectedValues.book.id]);
      var book = $scope.filteredBooks[bookIndex];
      var name = $scope.modalBook.value.trim();
      var option = $scope.modalBook.title;

      $scope.modalBook.error = "";
      if(option == 'View'){

      }
      else if(option == 'Rename'){
        $scope.modalBook.error = getBookSaveError(name);
        if($scope.modalBook.error == ""){
          book.name = name;
          book.reportType = $stateParams.type || 'default';
          book.userId = $scope.user.oid || 'xxx';
          // Save book to cloudant 
          BookService.updateBook(book)
            .then(function (data) {
              $scope.$apply(function () {
                var bookIndex = _.findIndex($scope.filteredBooks, ['id', $scope.selectedValues.book.id]);
                $scope.filteredBooks[bookIndex] = data;
                $scope.selectedValues.book = data;
              });
            }).catch(function (err) {
              console.log(err);
            });
        }
      }
      else if(option == 'Copy'){
        $scope.modalBook.error = getBookSaveError(name);
        if($scope.modalBook.error == ""){
          var bookCopy = _.clone(book);
          
          delete bookCopy["$$hashKey"];
          delete bookCopy.rev;
          delete bookCopy.id;
          bookCopy.name = name;
          bookCopy.reportType = $stateParams.type || 'default';
          bookCopy.userId = $scope.user.oid || 'xxx';

          // Save book to cloudant 
          BookService.createBook(bookCopy)
            .then(function (data) {
              $scope.$apply(function () {
                $scope.filteredBooks.push(data);
                $scope.selectedValues.book = $scope.filteredBooks[$scope.filteredBooks.length-1];
              });
            }).catch(function (err) {
              console.log(err);
            });
        }
      }
      else if(option == 'Delete'){
        var bookIndex = _.findIndex($scope.filteredBooks, ['id', book.id]);
        $scope.filteredBooks.splice(bookIndex, 1);
        $scope.selectedValues.book = $scope.filteredBooks[0];
        $scope.changeBook();
        book.reportType = $stateParams.type || 'default';
        book.userId = $scope.user.oid || 'xxx';
        BookService.deleteBook(book)
          .then(function (data) {
            if ($scope.filteredBooks.length === 1) {
              $('#menu1').addClass("disabled");
            }
          }).catch(function (err) {
            console.log(err);
          });
      }
      else if(option == 'Save Changes'){
        var selectionCopy = _.cloneDeep($scope.parentList);
        book.selectionList = selectionCopy;
        book.reportType = $stateParams.type || 'default';
        book.userId = $scope.user.oid || 'xxx';
        BookService.updateBook(book)
          .then(function (data) {
            $scope.$apply(function () {
              var bookIndex = _.findIndex($scope.filteredBooks, ['id', $scope.selectedValues.book.id]);
              $scope.filteredBooks[bookIndex] = data;
              $scope.selectedValues.book = data;
            });
          }).catch(function (err) {
            console.log(err);
          });
      }
      else if(option == 'Save'){
        $scope.modalBook.error = getBookSaveError(name);
        if($scope.modalBook.error == ""){
          var bookCopy = _.clone($scope.userSelection);
          var selectionCopy = _.cloneDeep($scope.parentList);

          //bookCopy.id = getNextBookId();
          delete bookCopy.id;
          bookCopy.name = name;
          bookCopy.selectionList = selectionCopy;

          bookCopy.reportType = $stateParams.type || 'default';
          bookCopy.userId = $scope.user.oid || 'xxx';

          // Save book to cloudant 
          BookService.createBook(bookCopy)
            .then(function (data) {
              $scope.$apply(function () {
                $scope.filteredBooks.push(data);
                $scope.selectedValues.book = $scope.filteredBooks[$scope.filteredBooks.length-1];
              });
            }).catch(function (err) {
              console.log(err);
            });

          //enable book menu options
          $('#menu1').removeClass("disabled");
        }
      }

      var error = document.getElementById("bookModalError");
      if($scope.modalBook.error == ""){
        $scope.hideBookModal();
        error.style.display = "none";
      }
      else if($scope.modalBook.error == "Empty Field"){
        error.style.display = "none";
      }
      else{
        error.style.display = "";
      }
    }

    /**
     * [modalKeyPressed checks for 'Enter' key press in book modal]
     * @param  {[key event]} event [key pressed]
     */
    $scope.modalKeyPressed = function(event){
      if(event && event.keyCode == 13){
        $scope.saveBook();
      }
    }

    /**
     * [changeBook selects values depending on current selected book]
     */
    $scope.changeBook = function() {
      clearBookSelections();
      var book = $scope.selectedValues.book;
      if(book){
        var index = _.findIndex($scope.filteredBooks, ['id', book.id]);
        //check for book index and make sure that it is not the default 'please select' value
        if(index != -1 && index != 0){
          var i, j, item, parent, child;

          for (i = 0; i < book.selectionList.length; i++) {
            item = book.selectionList[i];
            parent = _.find($scope.parentList, ['id', item.id]);
            if(item.selected){
              parent.selected = true;
              $scope.selectedKeys.push(parent);
              setParentSelected(parent, true);
            }
            if(item.childList && item.childList.length > 0){
              //check for children selections
              if((_.findIndex(item.childList, ['selected', true])) != -1){
                //open children options
                showCollapsedElement(item.id);
                for (j = 0; j < item.childList.length; j++) {
                  //set children selections
                  child = _.find(parent.childList, ['id', item.childList[j].id]);
                  if(item.childList[j].selected == null || item.childList[j].selected == false){
                    setChildSelected(child, false);
                  }
                  else{
                    setChildSelected(child, true);
                    $scope.selectedKeys.push(child);
                  }
                }
              }
            }
          }
          
          //enable book menu options
          $('#menu1').removeClass("disabled");
        }
        else{
          //disabled book menu options
          $('#menu1').addClass("disabled");
        }
      }
      else{
        //disabled book menu options
        $('#menu1').addClass("disabled");
      }
    }

    /**
     * [selectedParent parent value selected. Set selected value for all children of parent]
     * @param parentSelected [selected parent]
     */
    $scope.selectedParent = function(parent) {
      if(parent.selected){
        $scope.selectedKeys.push(parent);
        _.forEach(parent.childList, function(child) {
          setChildSelected(child, true);
        });
      }
      else{
        _.remove($scope.selectedKeys, { id: parent.id });
        _.forEach(parent.childList, function(child) {
          setChildSelected(child, false);
        });
      }
      setParentSelected(parent, parent.selected);
      $scope.debugMsg = JSON.stringify($scope.selectedKeys[0]);
    }

    /**
     * [selectedChild child value selected. Parent value selected if all children are selected. Otherwise, parent will not be selected.]
     * @param parent [parent of selected child]
     */
    $scope.selectedChild = function(parent, child) {
      if(child.selected) $scope.selectedKeys.push(child);
      else _.remove($scope.selectedKeys, { id: child.id });
      setChildSelected(child, child.selected);
    }

    /**
     * [searchOptions shows/hides options depending on the value that is entered in searchbox]
     */
    $scope.searchOptions = function(){
      var filter, ul, li, childLists, displayLabels, parentText, childText, i, j, collapseId;
      filter = $scope.selectedValues.searchInput.toUpperCase();
      ul = document.getElementById("myUL");
      li = ul.getElementsByClassName("parentLi");
      for (i = 0; i < li.length; i++) {
        childLists = li[i].getElementsByClassName("childLi");
        collapseId = li[i].getElementsByTagName("div")[1].id;
        parentText = li[i].getElementsByTagName("label")[0].innerText.toUpperCase().trim();
        
        displayLabels = false;
        if (parentText.indexOf(filter) > -1) {
          li[i].style.display = "";
          $("#"+collapseId).collapse('hide');
        }
        else{
          for (j = 0; j < childLists.length; j++) {
            childText = childLists[j].innerText.toUpperCase().trim();
            if(childText.indexOf(filter) > -1) {
              displayLabels = true;
            }
          }
          if(displayLabels){
            li[i].style.display = "";
            $("#"+collapseId).collapse('show');
          }
          else{
            li[i].style.display = "none";
            $("#"+collapseId).collapse('hide');
          }
        }   
      }
    }


    $scope.hideBookModal = function() {
      $('#bookModal').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
    }

    /**
     * [getBookSaveError returns book error message when saving book]
     * @param  {[String]} value [value entered by user in modal]
     * @return {[String]}       [the error message]
     */
    var getBookSaveError = function(value){
      if(value == ""){
        //empty field
        $("#bookModalInput").velocity("callout.shake");
        $("#bookModalInput").focus();
        return "Empty Field";
      }
      if(_.findIndex($scope.filteredBooks, ['name', value]) != -1){
        //existing book name
        return "'" + value +"' already exists";
      }
      return "";
    }

    /**
     * [clearAll clear all selected book/business unit values]
     */
    $scope.clearAll = function() {  
      $scope.selectedValues.book = $scope.filteredBooks[0];
      $scope.selectedKeys = [];
      $scope.selectedValues.selectAll = false;
      $scope.changeBook();
    }

    /**
     * [selectedOptionsAll selectAll checkbox selected. Set Business Unit values to selectAll value]
     */
    $scope.selectedOptionsAll = function(){
      _.forEach($scope.parentList, function(parent) {
        setParentSelected(parent, $scope.selectedValues.selectAll);
        _.forEach(parent.childList, function(child) {
          setChildSelected(child, $scope.selectedValues.selectAll);
        });
      });
    }

    function setParentSelected(parent, selected){
      parent.selected = selected;
      if(selected){
        $('#parentLabel-'+parent.id).css("font-weight", "bold");
      }
      else{
        $('#parentLabel-'+parent.id).css("font-weight", "normal");
      }
    }

    function setChildSelected(child, selected){
      child.selected = selected;
      if(selected){
        $('#childLabel-'+child.id).css("font-weight", "bold");
      }
      else{
        $('#childLabel-'+child.id).css("font-weight", "normal");
      }
    }

    /**
     * [clearBookSelections clears search input, and selected options]
     */
    function clearBookSelections(){
      var children;
      //unselect all values
      _.forEach($scope.parentList, function(parent) {
        children = parent.childList;
        _.forEach(children, function(child) {
          setChildSelected(child, false);
        });
        setParentSelected(parent, false);
        parent.childList = children;
      });

      //clear search input
      $scope.selectedValues.searchInput = "";
      $scope.searchOptions();
    }

    /**
     * [showCollapsedElement expands children within parent id]
     * @param id [parent id used to expand children]
     */
    function showCollapsedElement(id){
      var childOptions = $("#childOptions-"+id);

      childOptions.collapse('show');
      if(childOptions.attr("aria-expanded") == "false"){
        var pxHeight = childOptions[0].getElementsByTagName("li").length * 24;
        var parentLabel = $("#parentLabel-"+id);
        parentLabel.attr( "aria-expanded", "true");
        parentLabel.removeClass("ng-binding collapsed").addClass("ng-binding");
        childOptions.attr("aria-expanded", "true");
        childOptions.removeClass("collapse").addClass("collapse in");
        childOptions.height(pxHeight);
      }
    }

    /**
     * [getNextBookId sets unique id for new book created]
     * @return {[String]} [timestamp]
     */
    function getNextBookId(){
      return Date.now().toString();
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

    $scope.getKeysAndSubledgers = function () {
      var keys = [], subledgers = [];

      _.forEach($scope.selectedKeys, function (val) {
        if (val.id == 'ferc') {
          subledgers = _.map(val.childList, function(val){ return val.id });
        } else if ('subledger' in val) {
          subledgers.push(val.id);
        } else {
          keys.push({
            id: val.id,
            buLevel: _.isArray(val.childList) ? 'comp' : 'busu'
          });
          //keys.push(val.id);
        }
      });
      var ledgerText = 'in ' + JSON.stringify(subledgers).replace(/"/gi,"'").replace(/\[/gi,"(").replace(/\]/gi,")");
      return { keys: keys, subledgers: ledgerText };
    };
    

    $scope.getSheetData = function () {
      $scope.modalData.message = 'Loading...';
      var keys = _.map($scope.selectedKeys, function (key) { 
        return {
          id: key.id,
          buLevel: _.isArray(key.childList) ? 'comp' : 'busu'
        }
      });
      var accounts = $scope.selectedValues.reportType;
      var subledgers;

      modalService.showReportLoadingModal();
      
      if(keys && keys.length > 0){
        $scope.reportDetails.msg = "";
        if ($scope.selectedValues.report.type == 'f') {
          var keysAndSubledgers = $scope.getKeysAndSubledgers();
          keys = keysAndSubledgers.keys;
          subledgers = keysAndSubledgers.subledgers;
        }
        
        budgetService.getSheetData($scope.selectedValues.report.type, keys, $scope.selectedValues.month.name, 'Comp', $scope.selectedValues.dates.jdeYear, accounts, { subledgers: subledgers })
        .then(function (data) {
          /**
           * [data has object data ararys that contain sheet data by keys]
           * Example:
           *   data["00100"]
           *   -> 00100:{sheetData: Array(232), hiddenRows: Array(19), subTotalRows: Array(19), mainHeaders: Array(3)}
           *   
           * hiddenRows contain the name and the range to show/hide in excel
           * Example:
           *   data["00100"].hiddenRows[0]
           *   -> 0:{range: "A7:Z25", key: "CASH AND DEPOSITS"}
           * 
           */
          $scope.$apply(function () {})
          budgetService.deleteWorkSheets({ scope: $scope }, function (err, newSheetData) {
            var dummySheetName = newSheetData.dummySheetName;

            var count = 0;
            _.forEach(data, function (sheetData, key) {
              _.forEach(sheetData.hiddenRows, function(child) {
                child.selected = false;
              });
              sheetData.scope = $scope;
              sheetData.accountType = accounts;
              sheetData.month = $scope.selectedValues.month.name;
              sheetData.year = $scope.selectedValues.dates.jdeYear;
              sheetData.sheetKey = key;
              sheetData.dummySheetName = dummySheetName;

              $scope.sheetData = sheetData;

              budgetService.insertSpreadSheetData(sheetData, function (err, data) {
                if (++count == keys.length)
                  $rootScope.$broadcast('reloadHiddenRows', { rows: data.hiddenRows });
                modalService.hideReportLoadingModal();
              });
            });
          });
        }).catch(function (err) {
          modalService.hideReportLoadingModal();
          //console.log(err);
        });

      }
      else{
        modalService.hideReportLoadingModal();
      }

    };

    buildPage();

  }]);
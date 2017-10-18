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
  function ($http, $scope, $rootScope, $state, $stateParams, budgetService) {
    $scope.modalBook = {
      msg:"",
      title:"",
      value:"",
      saveButton:"",
      detailList:[],
      error:""
    };
    $scope.modalLoad = {};

    $scope.budgetList = [];

    

    $scope.filteredBooks = [
      {id:"00", name:"--Please select---", user:"default",
        selectionList:[]
      }
    ];

    $scope.userSelection = {id:"", name:"", user:"defaultUser",
      selectionList:[]
    };

    $scope.parentList = [
      {id:"00210", name:"Police Fund", childList:[]},
      {id:"00250", name:"Traffic Safety Fund", childList:[]},
      {id:"00290", name:"Airport Gas Well", childList:[]},
      {id:"00291", name:"Park Gas Well", childList:[]},
      {id:"00293", name:"Roadway Impact Fees", childList:[]},
      {id:"00300", name:"Grant Fund", childList:[]}
    ];

    $scope.childList = [
      [{id:"210", name:"Option1",},{id:"2100", name:"Option2"},{id:"21000", name:"Option3"}],
      [{id:"250", name:"Option1"},{id:"2500", name:"Option2"}],
      [{id:"290", name:"Option1"},{id:"2900", name:"Option2"}],
      [{id:"291", name:"Option1"},{id:"2910", name:"Option2"},{id:"291801", name:"Option3"}],
      [{id:"293", name:"Option1"},{id:"2930", name:"Option2 Park"}],
      [{id:"300", name:"Option1"}]
    ];

    $rootScope.$on('$viewContentLoaded', budgetReportDates);

    $(document).ready(function(){
      //Enables popup help boxes over labels
      $('#toggle-two').bootstrapToggle({
        on: 'Yes',
        off: 'No'
      });
    });

    /**
     * [buildPage sets selected values]
     */
    function buildPage(){
      $scope.selectedValues.reportType ="Balance";
      $scope.selectedValues.totalSheet = "No";
      $scope.selectedValues.month = "";
      $scope.selectedValues.year = "";
      $scope.selectedValues.searchInput = ""; 
      $scope.selectedValues.book = {};
      var rType = $scope.selectedValues.report.type;
      
      budgetService.getBudgetReportData(rType).then(function(data){
        var children;
        $scope.parentList = _.orderBy(data, ['MCCO'], ['asc']);
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

      });

      if($scope.user && $scope.user.name){
        $scope.userSelection.user = $scope.user.name
      }
      $scope.selectedValues.book = $scope.filteredBooks[0];



    }

    /**
     * [selectedReportType sets selected report type]
     * @param type [report type selected]
     */
    $scope.selectedReportType = function (type) {
      $scope.selectedValues.reportType = type;
    }

    
    $scope.selectedTotalSheet = function () {
      if($scope.selectedValues.totalSheet == "No"){
        $scope.selectedValues.totalSheet = "Yes";
      }
      else{
        $scope.selectedValues.totalSheet = "No";
      }
      
    }

    /**
     * [selectedReport sets the view depending on which report is selected]
     * @param report [the report selected]
     */
    $scope.selectedReport = function(report) {
      var budrpt = document.getElementById("budgetReport");
      if(report.name.includes("budrpt")){
        budrpt.style.display = "";
      }
      else{
        budrpt.style.display = "none";
        $state.go("setup.jobcost");
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
          if(_.findIndex(parent.childList, ['selected', true]) != -1){
            noSelections = false
            element = {};
            element.name = parent.name;
            element.childList = [];
            //
            _.forEach(parent.childList, function(child) {
              if(child.selected){
                childElement = {};
                childElement.name = child.name;
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
          if(_.findIndex(parent.childList, ['selected', true]) != -1){
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
        }
      }
      else if(option == 'Copy'){
        $scope.modalBook.error = getBookSaveError(name);
        if($scope.modalBook.error == ""){
          var bookCopy = _.clone(book);
          
          delete bookCopy["$$hashKey"];
          bookCopy.name = name;
          bookCopy.id = bookCopy.id+"0";
          $scope.filteredBooks.push(bookCopy);
          $scope.selectedValues.book = $scope.filteredBooks[$scope.filteredBooks.length-1];
        }
      }
      else if(option == 'Delete'){
        var bookIndex = _.findIndex($scope.filteredBooks, ['id', book.id]);
        $scope.filteredBooks.splice(bookIndex, 1);
      }
      else if(option == 'Save Changes'){
        var selectionCopy = _.cloneDeep($scope.parentList);
        book.selectionList = selectionCopy;
      }
      else if(option == 'Save'){
        $scope.modalBook.error = getBookSaveError(name);
        if($scope.modalBook.error == ""){
          var bookCopy = _.clone($scope.userSelection);
          var selectionCopy = _.cloneDeep($scope.parentList);

          bookCopy.id = getNextBookId();
          bookCopy.name = name;
          bookCopy.selectionList = selectionCopy;
          $scope.filteredBooks.push(bookCopy);
          $scope.selectedValues.book = $scope.filteredBooks[$scope.filteredBooks.length-1];

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
              //select all parent and children
              parent.selected = true;
              _.forEach(parent.childList, function(children) {
                children.selected = true;
              });
            }
            else if(item.childList && item.childList.length > 0){
              //check for children selections
              if((_.findIndex(item.childList, ['selected', true])) != -1){
                //open children options
                showCollapsedElement(item.id);
                for (j = 0; j < item.childList.length; j++) {
                  //set children selections
                  child = _.find(parent.childList, ['id', item.childList[j].id]);
                  if(item.childList[j].selected == null){
                    //option with no select tag - means set selection to true
                    child.selected = true;
                  }
                  else{
                    child.selected = item.childList[j].selected;
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
    $scope.selectedParent = function(parentSelected) {
      var parent = _.find($scope.parentList, ['id', parentSelected.id]);

      _.forEach(parent.childList, function(child) {
        child.selected = parent.selected;
      });
    }

    /**
     * [selectedChild child value selected. Parent value selected if all children are selected. Otherwise, parent will not be selected.]
     * @param parent [parent of selected child]
     */
    $scope.selectedChild = function(parent) {
      var test = $scope.parentList;
      if(_.findIndex(parent.childList, ['selected', false]) == -1){
        //all children are selected
        parent.selected = true;
      }
      else{
        //one or more children are not selected
        parent.selected = false;
      }
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

    

    $scope.showLoadingModal = function(msg) {
      $scope.modalLoad.msg = msg;
      $('#loadModal').modal({
        backdrop: 'static',
        show: true
      });
    }

    $scope.hideLoadingModal = function() {
      $('#loadModal').modal('hide');
      $('body').removeClass('modal-open');
      $('.modal-backdrop').remove();
      $("#collapse1").collapse('hide');
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
     * [clearAll clear all selected book values]
     */
    $scope.clearAll = function() {  
      $scope.selectedValues.book = $scope.filteredBooks[0];
      $scope.changeBook();
    }


    /**
     * [clearBookSelections clears search input, and selected options]
     */
    var clearBookSelections = function(){
      var children;
      //unselect all values
      _.forEach($scope.parentList, function(parent) {
        children = parent.childList;
        _.forEach(children, function(child) {
          child.selected = false;
        });
        parent.selected = false;
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
    var showCollapsedElement = function(id){
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

    var getNextBookId = function(){
      return Date.now().toString();
    }

    buildPage();

  }]);
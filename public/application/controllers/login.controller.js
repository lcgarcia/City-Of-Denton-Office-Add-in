/**
 * Login Controller
 */

app.controller('loginCtrl', [
  '$http', 
  '$scope', 
  '$rootScope',
  '$state',
  '$stateParams',
  function ($http, $scope, $rootScope, $state, $stateParams) {
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();

  	$scope.user = {name:"", username:"", password:"", isLoggedIn:false};

  	var userList = [
      {name:"Sample User", username:"user", password:"user"},
    ];

  	$scope.modalLoad = {};

    //nextClick();
    var dialog;

    $scope.openDialog = function () {
      try {
        Office.initialize = function (reason) {
          $(document).ready(function () {
            Office.context.ui.displayDialogAsync(getHost() + '/dialog', {height: 50, width: 60}, function (result) {
              //$scope.debugMsg = result;
              dialog = result.value;
              dialog.addEventHandler(Office.EventType.DialogMessageReceived, $scope.loginHandler);
              dialog.addEventHandler(Office.EventType.DialogEventReceived, $scope.eventHandler);
            });
          });
        }
      } catch (e) {
        $scope.debugMsg = e;
      }
    }

    var getHost = function () {
      if (/addin-dev/gi.test(window.location.host) || /cityofdenton/gi.test(window.location.host))
        return 'https://cityofdenton.mybluemix.net';
      else
        return 'https://localhost:3000';
    }

    //$scope.debugMsg = JSON.stringify(data);
    var data = localStorage.getItem('user');
    if (data != '' && data != undefined && data != null) {
      data = JSON.parse(data);
      $scope.user = data;
      nextClick();
    }

  	$scope.login = function(event) {
  		if(event){
  			if(event.keyCode == 13){
  				validateCredentials();
  			}
  		}
  		else{
  			if($scope.user.isLoggedIn){
  				nextClick();
	      }
	      else{
	      	validateCredentials();
	      }
  		}
   }

   $scope.eventHandler = function (arg) {
    dialog.close();
    $scope.$apply(function () {
      window.location.reload(true);
    });
   }

   $scope.loginHandler = function (arg) {
    $scope.user = JSON.parse(arg.message);
    dialog.close();
    localStorage.setItem('user', JSON.stringify($scope.user));
    $scope.$apply(function () { });
    nextClick();
   }

  	function buildPage() {
		$("#login").velocity("transition.slideUpIn", 1250);
		$(".row").delay(500).velocity("transition.slideLeftIn", {stagger: 500}) ;
		$("#error").hide();
		sessionStorage.clear();
	};

	function validateCredentials() {
		var username = $scope.user.username;
		var password = $scope.user.password;

		if(username != "" && password != ""){
			var index = _.findIndex(userList, ['username', username]);
			if(index == -1){
				//Username does not exist
				showError();
			}
			else{
				//username found
				if(password != userList[index].password){
					//invalid password
					showError();
				}
				else{
					//correct password, login
					$scope.user.name = userList[index].name;
					$("#error").hide();
					showLoadingModal();
					setTimeout(nextClick, 1500);
				}
			}
			
		}
		//Animate shake for empty fields
		else{
			if(username == "" && password == ""){
				$("#username").velocity("callout.shake");
				$("#password").delay(50).velocity("callout.shake");
				$("#username").focus();
			}
			else if(username == ""){
				$("#username").velocity("callout.shake");
				$("#username").focus();
			}
			else if(password == ""){
				$("#password").velocity("callout.shake");
				$("#password").focus();
			}
		}
	}


	function showLoadingModal() {
      $('#loadModal').modal({
        backdrop: 'static',
        show: true
      });

      $('#loadModal').delay(1500).fadeOut(500);
      setTimeout(hideLoadingModal, 1000);
    }

   function hideLoadingModal() {
      $('#loadModal').modal('hide');
   }


	function showError(){
		$("#error").fadeIn(100);
		$("#error").velocity("callout.pulse", {duration: 200});
	}

	function nextClick(){
		$scope.user.isLoggedIn = true;
    	$scope.user.id = 1;

		var stateObject = {type:'', data:{user:$scope.user}};
		$state.go("setup.budget", stateObject);
    //$state.go('setup.jobcost', {type: '', data:{user:$scope.user}})
	}

	buildPage();

  }]);




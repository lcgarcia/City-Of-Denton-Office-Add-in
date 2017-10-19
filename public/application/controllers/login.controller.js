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

  	$scope.user = {name:"", username:"", password:"", isLoggedIn:false};

  	var userList = [
      {name:"Sample User", username:"user", password:"user"},
      {name:"Sample User2", username:"user2", password:"user2"},
      {name:"Luis Garcia", username:"lgarcia", password:"mustang100"}
    ];

  	$stateParams.data = {
  		user:""
  	}
  	$scope.modalLoad = {};


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
		$stateParams.data.user = $scope.user;
		$state.go("setup.budget", $stateParams);
	}

	buildPage();

  }]);




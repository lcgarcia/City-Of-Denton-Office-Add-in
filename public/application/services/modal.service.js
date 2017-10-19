app.service("modalService", [
	'$http',
  	function ($http){

		this.showDataLoadingModal = function(){
		   $('#quickLoad').modal({
		     backdrop: 'static',
		     show: true
		   });
		}

	   this.hideDataLoadingModal = function(){
	      $('#quickLoad').fadeOut(500);
	      $('#quickLoad').modal('hide');
	   }

	}
]);
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

	   this.showReportLoadingModal = function() {
	      $('#loadModal').modal({
	        backdrop: 'static',
	        show: true
	      });
	   }

	   this.hideReportLoadingModal = function() {
	      $('#loadModal').modal('hide');
	      $('body').removeClass('modal-open');
	      $('.modal-backdrop').remove();

	      $("#collapse1").collapse('hide');
	    }

	}
]);
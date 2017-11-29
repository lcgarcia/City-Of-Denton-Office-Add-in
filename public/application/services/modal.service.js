app.service("modalService", [
	'$http',
  	function ($http){

		this.showDataLoadingModal = function(){
			if (!($("#quickLoad").data('bs.modal') || {}).isShown) {
			  $('#quickLoad').modal({
			    backdrop: 'static',
			    show: true
			  });
			}
		}

	   this.hideDataLoadingModal = function(){
	      $('#quickLoad').fadeOut(500);
	      $('#quickLoad').modal('hide');
	   }

	   this.showReportLoadingModal = function() {
	   		if (!($("#loadModal").data('bs.modal') || {}).isShown) {
	   			$('#loadModal').modal({
		        backdrop: 'static',
		        show: true
		      });
	   		}
	   }

	   this.hideReportLoadingModal = function() {
	      $('#loadModal').modal('hide');

	      while ($('body').hasClass('modal-open')) {
	      	$('body').removeClass('modal-open');
	      	$('.modal-backdrop').remove();
	      }
	      
	      $("#collapse1").collapse('hide');
	    }

	}
]);
app.service("jobcostService", [
  '$http',
  function ($http){


	this.getJobcostReportData = function(type) {
		var query = '';
    console.log("Fetching Budget Data, Type: '" + type + "'");
		if(type === 'ka') query = '?type=ka'
		if(type === 'e') query = '?type=e'
		if(type === 'new') query = '?type=new'
		return $http.get("/ks2inc/job/ui/data" + query)
        .then(
    		function(response) {
    			return response.data;
    		},
            function (httpError) {
                // translate the error
                throw httpError.status + " : " + httpError.data;
             }
      );
	};

  }
]);
app.service("budgetService", [
  '$http',
  function ($http){


	this.getBudgetReportData = function(type) {
		var query = '';
    console.log("Fetching Budget Data, Type: '" + type + "'");
		if(type === 'a') query = '?type=a'
		if(type === 'e') query = '?type=e'
		if(type === 'f') query = '?type=f'
		return $http.get("/ks2inc/budget/business/unit" + query)
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
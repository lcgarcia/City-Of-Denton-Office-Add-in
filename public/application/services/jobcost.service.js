app.service("jobcostService", [
  '$http',
  function($http){

  	this.getReportData = function(type) {
  		console.log("Fetching Jobcost Data, Type: '" + type + "'");
      var query = getQueryType(type);

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

    this.getCompaniesByDepartmentKey = function(type, key) {
      console.log("Fetching Jobcost Companies, Type: '" + type + "'");
      var query = getQueryType(type);

      return $http.get("/ks2inc/job/companies/" + key + query)
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

    this.getProjectsByDepartmentAndCompanyKeys = function(type, dKey, cKey) {
      console.log("Fetching Jobcost Projects, Type: '" + type + "'");
      var query = getQueryType(type);
      
      return $http.get("/ks2inc/job/project/" + dKey + "/" + cKey + query)
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

    this.getJobs = function(type, dKey, cKey, pKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      
      return $http.get("/ks2inc/job/" + dKey + "/" + cKey + "/" + pKey + query)
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


    function getQueryType(type){
      if(type === 'ka') {return '?type=ka'}
      else if(type === 'e') {return '?type=e'}
      else if(type === 'new') {return '?type=new'}
      return '';
    }



  }
]);
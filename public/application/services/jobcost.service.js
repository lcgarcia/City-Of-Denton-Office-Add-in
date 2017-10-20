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

    this.getCompanies = function(type, key) {
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

    this.getProjects = function(type, departmentKey, companyKey) {
      console.log("Fetching Jobcost Projects, Type: '" + type + "'");
      var query = getQueryType(type);
      
      return $http.get("/ks2inc/job/project/"+departmentKey+"/"+companyKey+query)
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

    this.getJobs = function (type, departmentKey, companyKey, projectKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      return this.getJobsAPIRequest("/ks2inc/job/"+departmentKey+"/"+companyKey+"/"+projectKey+query);
    }

    this.getJobWithStatus = function (type, departmentKey, companyKey, projectKey, jobStatusKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      query += "&jobstatus=" + jobStatusKey;
      return this.getJobsAPIRequest("/ks2inc/job/"+departmentKey+"/"+companyKey+"/"+projectKey+query);
    };

    this.getJobsAPIRequest = function (url) {
      return $http.get(url)
        .then(
        function(response) {
          return response.data;
        },
        function (httpError) {
          // translate the error
          throw httpError.status + " : " +httpError.data;
        }
      );
    };

    this.getCatCodeDescription = function(type, departmentKey, companyKey, projectKey, jobStatusKey, jobKey, catCodeKey) {
      console.log("Fetching Jobcost Jobs, Type: '" + type + "'");
      var query = getQueryType(type);
      
      return $http.get("/ks2inc/job/code/detail/"+departmentKey+"/"+companyKey+"/"+projectKey+"/"+jobStatusKey+"/"+jobKey+"/"+catCodeKey+query)
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
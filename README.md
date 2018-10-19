# City of Denton API

This project is supposed to be launched on prem at the City of Denton. The goal for this project is to be the API for the City of Denton Office 365 Add-In. The purpose of this repository is to separate move the data access component from the old Excel spreadsheet and move it to a remote server.

## Project structure
* `bin/www` - Server entry point
	* `app.js` - Server config and Azure Authentication code
* `routes/budget.js` - API endpoints for any budget reports
* `routes/book.js` - API endpoints for saving Books to Cloudant
* `rouets/job.js` - API endpoints for any Job Cost reports
* `lib/KnexQuery.js` - This is where all of the data is fetched from Oracle and then formatted into the data structures needed on the front end.
* `lib/SheetFormatter.js` - This is another file with some helpful functions to format the data returned from Oracle
* `lib/*SQLGenerator.js` - These are files that generate Oracle style SQL for the various reports.
* `public/application/` - This is the folder where the angular controllers, partials, and services live
* `public/app.js` - This is the entry point to the Angular.js application

> Note: For the most part these are the most important folders for this project and should make it relativly easy to maintain if you can understand them.

### Installing Oracle Local
If you follow the steps on the [node-oracledb site](https://github.com/oracle/node-oracledb/blob/v1.13.1/INSTALL.md#instosx) for Mac it should let you run the project locally.

### Local Excel set up instructions
Follow the instructions to [side load the app locally](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/sideload-an-office-add-in-on-ipad-and-mac) for Mac or whatever it should work no problem.

Use the `cityOfDenton-local-manifest-ks2.xml` file for the file you load into the `wef` folder.

If you need to change your local Add-in to point to a cloud endpoint for testing change all occurances of `localhost:3000` in the `cityOfDenton-local-manifest-ks2.xml` file.

### Testing

Make sure if you create a new function to do your best to write unit tests for it. We are using the `mocha` framework to test so writing tests should be straight forward. Running the `npm test` command will execute all tests in the `tests` folder.

### Permissions
Permissions for the app are stored and managed in the City of Denton Azure AD service. A user must be added to one of the following services.

13d4a1b3-a96e-43e0-a747-bbea092ae269 -> Accounting
01300353-41d6-4320-bed4-618e2bfeb19d -> Budget and Jobcost
dc448ad6-3a34-437d-ab81-63498fb36dc0 -> Electric

* Job cost -> Accounting, Electric, Budget and JobCost
* Budget Report -> Accounting, Electric, Budget and JobCost
* Job cost KA -> Accounting
* Job cost E -> Accounting, Electric
* new Job cost -> Accounting, Electric
* Budget Repot A -> Accounting
* Budget Repot E -> Accounting, Electric
* Budget Report Ferc -> Accounting, Electric
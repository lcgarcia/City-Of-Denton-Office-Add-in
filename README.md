# City of Denton API

This project is supposed to be launched on prem at the City of Denton. The goal for this project is to be the API for the City of Denton Office 365 Add-In. The purpose of this repository is to separate move the data access component from the old Excel spreadsheet and move it to a remote server.

### Testing

Make sure if you create a new function to do your best to write unit tests for it. We are using the `mocha` framework to test so writing tests should be straight forward. Running the `npm test` command will execute all tests in the `tests` folder.

### Permissions
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
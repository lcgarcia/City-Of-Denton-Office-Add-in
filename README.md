# City of Denton API

This project is supposed to be launched on prem at the City of Denton. The goal for this project is to be the API for the City of Denton Office 365 Add-In. The purpose of this repository is to separate move the data access component from the old Excel spreadsheet and move it to a remote server.

### Testing

Make sure if you create a new function to do your best to write unit tests for it. We are using the `mocha` framework to test so writing tests should be straight forward. Running the `npm test` command will execute all tests in the `tests` folder.
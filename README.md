# ST_API_LIB

**ST_API_LIB** is a Google Apps Script library for managing sessions and interacting with the ServiceTrade API. It includes automated session handling, API data retrieval, and helper functions for a smooth user experience within Google Sheets and other Google services. It is currently a WIP as I am building it in my spare time for tasks that I have had to recreate or copy/paste from one off project to one off project.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [login](#login)
  - [logout](#logout)
  - [getCompanies](#getcompanies)
- [Private Functions](#private-functions)
- [License](#license)
### Installation
To install, add this script to your Google Apps Script project. This library requires Google Apps Script permissions for `UrlFetchApp` and `PropertiesService`. (For now)

### Usage

#### login
- **Description**: Logs into ServiceTrade, initiating a session.
- **Parameters**:
  - `email` (string): ServiceTrade account email.
  - `password` (string): Account password.
  - `timeoutLength` (number, optional): Session duration in hours (default: 1).
  - `checkHourFreq` (number, optional): Frequency (hours) for session checks.
- **Returns**: `{ success: boolean, message: string }`
- **Example**:
  ```javascript
  const response = login("user@example.com", "password123");
  if (response.success) {
    Logger.log("Login successful");
  } else {
    Logger.log(response.message);
  }
#### logout
- **Description**: Ends the session and clears stored session data.
- **Returns**: A message indicating logout success or failure.
- **Example**:
  ```javascript
  const result = logout();
  Logger.log(result);
#### getCompanies
- **Description**: Retrieves a filtered list of companies from ServiceTrade.
- **Parameters**:
  - `options` (object, optional): An object containing filtering options. The following properties are available:
    - **type** (string, optional): Company type (`'vendor'`, `'customer'`, `'contractor'`, `'contractee'`).
    - **name** (string, optional): Partial name match (case insensitive).
    - **city** (string, optional): Matches if the company is in a specified city.
    - **state** (string, optional): 2-letter state abbreviation (case insensitive).
    - **status** (string, optional, default `'active'`): Status of the company; options include `'active'`, `'pending'`, `'inactive'`, or `'on_hold'`.
    - **createdBefore** (number, optional): Filters for companies created on or before this date (timestamp).
    - **createdAfter** (number, optional): Filters for companies created on or after this date (timestamp).
    - **updatedBefore** (number, optional): Filters for companies updated on or before this date (timestamp).
    - **updatedAfter** (number, optional): Filters for companies updated on or after this date (timestamp).
    - **tag** (string, optional): Comma-separated list of tags; returns companies with all specified tags.
    - **officeId** (string, optional): Comma-separated list of office IDs; returns companies with at least one location in these offices.
- **Returns**: `{ success: boolean, data: object }` where `data` includes `totalPages`, `page`, and `companies`.
- **Example**:
  ```javascript
  const companies = getCompanies({ type: "customer", state: "CA" });
  if (companies.success) {
    Logger.log(companies.data.companies);
  } else {
    Logger.log(companies.message);
  }
### Private Functions
Private functions are prefixed with an underscore `_` and are intended for internal use. These include:

#### _getSessionCookies
- **Description**: Retrieves the session cookies stored in script properties.
- **Returns**: `string|null` - The session cookies or `null` if not logged in.

#### _setSessionTimeout
- **Description**: Sets the session expiration time.
- **Parameters**:
  - `timeoutLength` (number): Length of the session in hours.

#### _isUserLoggedIn
- **Description**: Checks if the session is active based on stored cookies and expiration.
- **Returns**: `boolean` - `true` if the session is active, `false` otherwise.

#### _createSessionCheckTrigger
- **Description**: Sets up a time-based trigger to periodically check the session status.
- **Parameters**:
  - `checkHourFreq` (number): Frequency in hours to check session status.

#### _deleteExistingTriggers
- **Description**: Deletes all existing triggers for a specified function name.
- **Parameters**:
  - `functionName` (string): The function name for which to remove triggers.

#### _sessionStatusDispatcher
- **Description**: Dispatch function to check session status; set as the trigger target.

#### _checkSessionStatus
- **Description**: Checks if the session is still valid, logging out if the session has expired.

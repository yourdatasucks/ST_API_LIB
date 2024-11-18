# ST_API_LIB

**ST_API_LIB** is a Google Apps Script library for managing sessions and interacting with the ServiceTrade API. It includes automated session handling, API data retrieval, and helper functions for a smooth user experience within Google Sheets and other Google services. It is currently a WIP as I am building it in my spare time for tasks that I have had to recreate or copy/paste from one off project to one off project.

## Table of Contents
- [Create the Library](#create-the-library)
- [Adding the Library to Your Project](#adding-the-library-to-your-project)
- [Usage](#usage)
  - [Initial Setup](#initial-setup)
  - [login](#login)
  - [logout](#logout)
  - [getCompanies](#getcompanies)
- [Private Functions](#private-functions)
- [License](#license)
## Create the Library

To install this library, start by creating a Google Apps Script project and adding these files. If you’re using `clasp`, this process will be easier and quicker. Note that this library requires permissions for `UrlFetchApp` and `PropertiesService` in Google Apps Script.

## Adding the Library to Your Project

Once you have saved the initial library project, make a note of its unique **Script ID**. You can find this ID by going to **File > Project settings** and copying the value from the `Script ID` field. To add this library to a new project, follow these steps:

1. **Create or Open a New Project**:
   - In Google Apps Script, start a new project or open an existing one.

2. **Add the Library**:
   - In the new project, go to **Libraries** by selecting **Resources > Libraries...** from the menu.
   - Enter the **Script ID** of the library project in the **Add a Library** field.
   - Click **Add**.

3. **Set Version and Identifier**:
   - After adding the library, you’ll see a dropdown menu to select the **version**. Choose the version you want to use (typically the latest).
   - Optionally, change the **Identifier** (default is `STLIB`), but we will keep it as `STLIB` for this guide.
   - Click **Save**.

Your library is now available in the new project! You can call library functions using the `STLIB` identifier, such as `STLIB.login(...)`.





## Usage
### Initial Setup
- **Description**: You will need to setup a special function to use for the session checking as Google Apps Scripts does not support directly using library functions in triggers
- Add the following function
```javascript
function librarySessionCheckTrigger() {
    STLIB.internalTriggerForSessionCheck(); // Calls the library function to check session status
}
```
### login
- **Description**: Logs into ServiceTrade, initiating a session.
- **Parameters**:
  - `email` (string): ServiceTrade account email.
  - `password` (string): Account password.
  - `timeoutLength` (number): Session length, interpreted based on the `unit` parameter.
  - `unit` (string, optional): The unit of `timeoutLength`, either `'hours'` or `'minutes'`. Default is `'hours'`.
- **Returns**: `{ success: boolean, message: string }`

- **Note on allowed values:**
    - If `unit` is `'hours'`, `timeoutLength` must be a positive whole number (e.g., 1, 2, etc.).
    - If `unit` is `'minutes'`, `timeoutLength` must be one of the following values: 1, 5, 10, 15, or 30 minutes (these are the only intervals Google Apps Script supports for time-based triggers).

- **Example**:
  ```javascript
  // default behavior is set for one hour
  const response = login("user@example.com", "password123");
  if (response.success) {
    Logger.log("Login successful");
  } else {
    Logger.log(response.message);
  }
  // Login with a 1-hour session timeout
  const response = login("user@example.com", "password123", 1, 'hours');
  
  // Login with a 15-minute session timeout
  const response = login("user@example.com", "password123", 15, 'minutes');
### logout
- **Description**: Ends the session and clears stored session data.
- **Returns**: A message indicating logout success or failure.
- **Example**:
  ```javascript
  const result = logout();
  Logger.log(result);
### getCompanies
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
## Private Functions
Private functions are prefixed with an underscore `_` and are intended for internal use. These include:

### _getSessionCookies
- **Description**: Retrieves the session cookies stored in script properties.
- **Returns**: `string|null` - The session cookies or `null` if not logged in.

### _setSessionTimeout
- **Description**: Sets the session expiration time.
- **Parameters**:
  - `timeoutLength` (number): Length of the session in hours.

### _isUserLoggedIn
- **Description**: Checks if the session is active based on stored cookies and expiration.
- **Returns**: `boolean` - `true` if the session is active, `false` otherwise.

### _createSessionCheckTrigger
- **Description**: Sets up a time-based trigger to periodically check the session status.
- **Parameters**:
  - `checkHourFreq` (number): Frequency in hours to check session status.

### _deleteExistingTriggers
- **Description**: Deletes all existing triggers for a specified function name.
- **Parameters**:
  - `functionName` (string): The function name for which to remove triggers.

### _sessionStatusDispatcher
- **Description**: Dispatch function to check session status; set as the trigger target.

### _checkSessionStatus
- **Description**: Checks if the session is still valid, logging out if the session has expired.

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
  - [getUsers](#getusers)
  - [userValue](#uservalue)
- [Private Functions](#private-functions)
- [License](#license)
## Create the Library

To install this library, start by creating a Google Apps Script project and adding these files. If you're using `clasp`, this process will be easier and quicker. Note that this library requires permissions for `UrlFetchApp` and `PropertiesService` in Google Apps Script.

## Adding the Library to Your Project

Once you have saved the initial library project, make a note of its unique **Script ID**. You can find this ID by going to **File > Project settings** and copying the value from the `Script ID` field. To add this library to a new project, follow these steps:

1. **Create or Open a New Project**:
   - In Google Apps Script, start a new project or open an existing one.

2. **Add the Library**:
   - In the new project, go to **Libraries** by selecting **Resources > Libraries...** from the menu.
   - Enter the **Script ID** of the library project in the **Add a Library** field.
   - Click **Add**.

3. **Set Version and Identifier**:
   - After adding the library, you'll see a dropdown menu to select the **version**. Choose the version you want to use (typically the latest).
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
### getUsers
- **Description**: Retrieves a filtered list of users from ServiceTrade.
- **Parameters**:
  - `options` (object, optional): An object containing filtering options. The following properties are available:
    - **name** (string, optional): User name includes this string (case insensitive).
    - **email** (string, optional): User email includes this string (case insensitive).
    - **phone** (string, optional): User phone number includes this string.
    - **status** (string, optional, default `'active'`): User status; options include `'active'` or `'inactive'`.
    - **role** (string, optional): User role; options include `'admin'`, `'manager'`, `'technician'`, `'sales'`, or `'office'`.
    - **officeId** (string, optional): Comma-separated list of office IDs; returns users assigned to these offices.
    - **createdBefore** (number, optional): Filters for users created on or before this date (timestamp).
    - **createdAfter** (number, optional): Filters for users created on or after this date (timestamp).
    - **updatedBefore** (number, optional): Filters for users updated on or before this date (timestamp).
    - **updatedAfter** (number, optional): Filters for users updated on or after this date (timestamp).
- **Returns**: `{ success: boolean, data: object }` where `data` includes `totalPages`, `page`, and `users`.
- **Example**:
  ```javascript
  const users = getUsers({ status: "active", role: "technician" });
  if (users.success) {
    Logger.log(users.data.users);
  } else {
    Logger.log(users.message);
  }
### userValue
- **Description**: Retrieves or manages user values from ServiceTrade.
- **Parameters**:
  - `options` (object): An object containing the following properties:
    - **id** or **userId** (number, optional): The ID of the user to get/set values for. If not provided, returns values for the authenticated user.
    - **key** (string, optional): The key of the user value to retrieve or set.
    - **value** (string, optional): The value to set (only used with POST/PUT methods).
    - **method** (string, optional, default `'GET'`): The HTTP method to use (`'GET'`, `'POST'`, `'PUT'`, `'DELETE'`).
- **Returns**: `{ success: boolean, data: object }` where `data` contains the user value information.
- **Example**:
  ```javascript
  // Get all values for a specific user
  const userValues = userValue({ id: 123, method: 'GET' });
  
  // Get a specific value for a user
  const specificValue = userValue({ id: 123, key: 'preference', method: 'GET' });
  
  // Set a value for a user
  const setValue = userValue({ id: 123, key: 'preference', value: 'newValue', method: 'POST' });
  
  // Update a value for a user
  const updateValue = userValue({ id: 123, key: 'preference', value: 'updatedValue', method: 'PUT' });
  
  // Delete a value for a user
  const deleteValue = userValue({ id: 123, key: 'preference', method: 'DELETE' });
  ```

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
/**
 * Retrieves the session cookies from the library.
 * @public
 * @returns {string|null} - The session cookies or null if not logged in.
 */
function getSessionCookies() {
  return PropertiesService.getScriptProperties().getProperty("SESSION_COOKIES");
}


/**
 * Logs in to ServiceTrade and stores only the PHPSESSID for session management.
 * @public
 * @param {string} email - The email for ServiceTrade login.
 * @param {string} password - The password for ServiceTrade login.
 * @param {number} timeoutLength - Optional session length in hours (default is 1).
 * @param {number} checkHourFreq - Optional frequency to check session status (default is 1).
 * @returns {Object} - Success status and optional message on failure.
 */
function login(email, password, timeoutLength = 1, checkHourFreq = 1) {
  const loginUrl = "https://api.servicetrade.com/api/auth";
  const payload = { username: email, password: password };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(loginUrl, options);

  if (response.getResponseCode() === 200) {
    const sessionCookies = response.getAllHeaders()['Set-Cookie'];
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty("SESSION_COOKIES", sessionCookies);
    setSessionTimeout(timeoutLength);
    createSessionCheckTrigger(checkHourFreq);
    return { success: true };
  } else {
    return { success: false, message: "Invalid login credentials" };
  }
}


/**
 * Logs out the current session, clears cookies, and removes triggers.
 * @public
 * @returns {string} - Message confirming logout success or failure.
 */
function logout() {
  const scriptProps = PropertiesService.getScriptProperties();
  const sessionCookies = scriptProps.getProperty("SESSION_COOKIES");

  if (sessionCookies) {
    const logoutUrl = "https://api.servicetrade.com/api/auth"; // ServiceTrade logout endpoint
    const options = {
      method: "delete",
      headers: { "Cookie": sessionCookies },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(logoutUrl, options);
    scriptProps.deleteProperty("SESSION_COOKIES");
    scriptProps.deleteProperty("SESSION_EXPIRATION");
    deleteExistingTriggers("checkSessionStatus"); // Remove the trigger on logout
    return response.getResponseCode() === 204 ? "Logout successful" : "Logout failed";
  }
  return "No active session to log out from.";
}

/**
 * Sets session expiration.
 * @public
 * @param {number} timeoutLength - Length of the session in hours.
 */
function setSessionTimeout(timeoutLength) {
  const scriptProps = PropertiesService.getScriptProperties();
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + timeoutLength);
  scriptProps.setProperty("SESSION_EXPIRATION", expiration.toISOString());
}


/**
 * Checks if the user is logged in and if the session is still active.
 * @public
 * @returns {boolean} - True if session is active; false if expired.
 */
function isUserLoggedIn() {
  const scriptProps = PropertiesService.getScriptProperties();
  const sessionCookies = scriptProps.getProperty("SESSION_COOKIES");
  const expiration = scriptProps.getProperty("SESSION_EXPIRATION");

  if (!sessionCookies) return false;

  if (expiration) {
    const expirationDate = new Date(expiration);
    if (new Date() > expirationDate) {
      logout(); // Auto-logout if session expired
      return false;
    }
  }
  return true;
}

/**
 * Creates a time-based trigger to periodically check the session.
 * Ensures there are no duplicate triggers for the session check function.
 * @public
 * @param {number} checkHourFreq - Frequency in hours for session status check.
 */
function createSessionCheckTrigger(checkHourFreq) {
  deleteExistingTriggers("sessionStatusDispatcher");

  ScriptApp.newTrigger("sessionStatusDispatcher")
    .timeBased()
    .everyHours(checkHourFreq)
    .create();
}

/**
 * Deletes all existing triggers for a specified function name.
 * Helps avoid duplicates by ensuring only one trigger is active for a function.
 * @private
 * @param {string} functionName - The function name to remove triggers for.
 */
function deleteExistingTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Dispatch function to check the session status.
 * Set as the trigger target and calls the internal session check.
 * @private
 */
function sessionStatusDispatcher() {
  _checkSessionStatus();
}

/**
 * Checks session status; logs out if the session has expired.
 * @private
 */
function _checkSessionStatus() {
  if (!isUserLoggedIn()) {
    Logger.log("User session has expired and has been logged out.");
  }
}

/**
 * Retrieves a list of companies from ServiceTrade with optional filters and type selection.
 * @public
 * @param {Object} [options={}] Options for filtering the request.
 * @param {string} [options.type] - Company type to filter by. Options are:
 *                                  - 'vendor': Lists only service vendors (sets `isVendor` to true).
 *                                  - 'customer': Lists only customers (sets `isCustomer` to true).
 *                                  - 'contractor': Lists only vendors or prime contractors (sets `isContractor` to true).
 *                                  - 'contractee': Lists only customers or prime contractors (sets `isContractee` to true).
 *                                  If omitted, no specific type filter is applied.
 * @param {string} [options.name] - Company name includes this string (case insensitive).
 * @param {string} [options.refNumber] - Exact match of reference number.
 * @param {string} [options.city] - City includes this string (case insensitive).
 * @param {string} [options.state] - 2-letter state abbreviation (case insensitive).
 * @param {string} [options.postalCode] - Postal code includes this string (case insensitive).
 * @param {string} [options.status='active'] - Company status. One of ('active', 'pending', 'inactive', 'on_hold').
 * @param {number} [options.createdBefore] - Timestamp; matches records created on or before this date.
 * @param {number} [options.createdAfter] - Timestamp; matches records created on or after this date.
 * @param {number} [options.updatedBefore] - Timestamp; matches records updated on or before this date.
 * @param {number} [options.updatedAfter] - Timestamp; matches records updated on or after this date.
 * @param {string} [options.tag] - Comma-separated list of tags; returns companies with all tags specified.
 * @param {string} [options.officeId] - Comma-separated list of office IDs; returns companies with at least one location in these offices.
 * @returns {Object} An object with a `success` flag and `data` object containing `totalPages`, `page`, and an array of `companies`.
 * @returns {boolean} return.success - Indicates if the API call was successful.
 * @returns {Object} return.data - Data returned from the API call.
 * @returns {number} return.data.totalPages - The total number of pages available for the query.
 * @returns {number} return.data.page - The current page number.
 * @returns {Array} return.data.companies - An array of company objects returned by the query.
 */
function getCompanies({ type, ...params } = {}) {
  const baseUrl = "https://api.servicetrade.com/api/company";
  const sessionCookies = PropertiesService.getScriptProperties().getProperty("SESSION_COOKIES");
  if (!sessionCookies) return { success: false, message: "Not authenticated. Please log in first." };

  // Map type to default parameters
  const typeDefaults = {
    vendor: { isVendor: true },
    customer: { isCustomer: true },
    contractor: { isContractor: true },
    contractee: { isContractee: true }
  };

  // set typeParam to the passed in type
  let typeParams = {};
  if (type && typeDefaults[type]) {
    typeParams = typeDefaults[type];
  } else {
    typeParams = {};
  }

  // Merge type defaults with other parameters
  const finalParams = { 
    ...typeParams,
    ...params
  };

  // Convert parameters to query string manually
  const queryParams = Object.keys(finalParams)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(finalParams[key])}`)
    .join('&');

  const url = `${baseUrl}?${queryParams}`;

  const options = {
    method: "get",
    headers: { "Cookie": sessionCookies },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      return { success: true, data: JSON.parse(response.getContentText()) };
    }
    return { success: false, message: `Failed to retrieve companies: ${response.getResponseCode()}` };
  } catch (error) {
    return { success: false, message: `Error retrieving companies: ${error.message}` };
  }
}

// Global object
var STLIB = STLIB || {};

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
        _setSessionTimeout(timeoutLength);
        _createSessionCheckTrigger(checkHourFreq);
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
    const sessionCookies = _getSessionCookies();

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
        _deleteExistingTriggers("checkSessionStatus"); // Remove the trigger on logout
        return response.getResponseCode() === 204 ? "Logout successful" : "Logout failed";
    }
    return "No active session to log out from.";
}

/**
 * Checks if the user is logged in and if the session is still active.
 * @public
 * @returns {boolean} - True if session is active; false if expired.
 */
function isUserLoggedIn() {
    const scriptProps = PropertiesService.getScriptProperties();
    const sessionCookies = _getSessionCookies();
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

STLIB.login = login;
STLIB.logout = logout;
STLIB.isUserLoggedIn = isUserLoggedIn;

/**
* Sets session expiration.
* @private
* @param {number} timeoutLength - Length of the session in hours.
*/
function _setSessionTimeout(timeoutLength) {
    const scriptProps = PropertiesService.getScriptProperties();
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + timeoutLength);
    scriptProps.setProperty("SESSION_EXPIRATION", expiration.toISOString());
}




/**
 * Creates a time-based trigger to periodically check the session.
 * Ensures there are no duplicate triggers for the session check function.
 * @private
 * @param {number} checkHourFreq - Frequency in hours for session status check.
 */
function _createSessionCheckTrigger(checkHourFreq) {
    _deleteExistingTriggers("_sessionStatusDispatcher");

    ScriptApp.newTrigger("_sessionStatusDispatcher")
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
function _deleteExistingTriggers(functionName) {
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
function _sessionStatusDispatcher() {
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
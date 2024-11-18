// Global object
var STLIB = STLIB || {};

/**
 * Logs in to ServiceTrade and manages session with a specified timeout.
 * - `timeoutLength` represents hours if `unit` is set to 'hours' (default).
 * - `timeoutLength` represents minutes if `unit` is set to 'minutes', with only specific intervals allowed.
 * 
 * @param {string} email - The email for ServiceTrade login.
 * @param {string} password - The password for ServiceTrade login.
 * @param {number} timeoutLength - Session length, interpreted based on `unit`.
 * @param {string} unit - The unit of `timeoutLength`, either 'hours' or 'minutes'.
 * @returns {Object} - Success status and optional message on failure.
 * 
 * Examples:
 * - `timeoutLength = 1, unit = 'hours'` means 1 hour.
 * - `timeoutLength = 15, unit = 'minutes'` means 15 minutes.
 * 
 * Notes on allowed values:
 * - If `unit` is 'hours', `timeoutLength` must be a positive whole number (e.g., 1, 2, etc.).
 * - If `unit` is 'minutes', `timeoutLength` must be one of the following intervals:
 *     - 1, 5, 10, 15, or 30 minutes (these are the only intervals Google Apps Script supports for time-based triggers).
 */
function login(email, password, timeoutLength = 1, unit = 'hours') {
    const loginUrl = "https://api.servicetrade.com/api/auth";
    const payload = { username: email, password: password };

    // Guard clause: Validate timeoutLength based on unit
    const allowedMinuteIntervals = [1, 5, 10, 15, 30];
    if (unit === 'hours') {
        if (!Number.isInteger(timeoutLength) || timeoutLength < 1) {
            throw new Error("Invalid timeout length for hours. Use a whole number (e.g., 1, 2, etc.)");
        }
    } else if (unit === 'minutes') {
        if (!allowedMinuteIntervals.includes(timeoutLength)) {
            throw new Error(`Invalid timeout length for minutes. Use one of the following values: ${allowedMinuteIntervals.join(', ')}`);
        }
    } else {
        throw new Error("Invalid unit provided. Use 'hours' or 'minutes'.");
    }

    // Proceed with login request
    const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(loginUrl, options);

    if (response.getResponseCode() !== 200) {
        return { success: false, message: "Invalid login credentials" };
    }

    // Store session cookies and set timeout and trigger based on unit
    const sessionCookies = response.getAllHeaders()['Set-Cookie'];
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty("SESSION_COOKIES", sessionCookies);

    _setSessionTimeout(timeoutLength, unit);
    _createSessionCheckTrigger(timeoutLength, unit);

    return { success: true };
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
        _deleteExistingTriggers("librarySessionCheckTrigger"); // Remove the trigger on logout
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
STLIB.internalTriggerForSessionCheck = internalTriggerForSessionCheck;


/**
 * Sets session expiration based on specified duration.
 * @private
 * @param {number} timeoutLength - Length of the session.
 * @param {string} unit - Unit for the timeout ('minutes' or 'hours').
 */
function _setSessionTimeout(timeoutLength, unit) {
    const scriptProps = PropertiesService.getScriptProperties();
    const expiration = new Date();

    if (unit !== 'minutes' && unit !== 'hours') {
        throw new Error("Invalid unit provided. Use 'minutes' or 'hours'.");
    }

    if (unit === 'minutes') {
        expiration.setMinutes(expiration.getMinutes() + timeoutLength);
    }

    if (unit === 'hours') {
        const minutesToAdd = timeoutLength * 60;
        expiration.setMinutes(expiration.getMinutes() + minutesToAdd);
    }

    scriptProps.setProperty("SESSION_EXPIRATION", expiration.toISOString());
}




/**
 * Creates a time-based trigger to periodically check the session.
 * @private
 * @param {number} frequency - Frequency of the session status check.
 * @param {string} unit - Unit for the frequency ('minutes' or 'hours').
 */
function _createSessionCheckTrigger(frequency, unit) {
    _deleteExistingTriggers("librarySessionCheckTrigger");

    const trigger = ScriptApp.newTrigger("librarySessionCheckTrigger").timeBased();

    if (unit === 'minutes') {
        // Choose closest allowable minute interval
        if (frequency <= 1) {
            trigger.everyMinutes(1);
        }

        if (frequency > 1 && frequency <= 5) {
            trigger.everyMinutes(5);
        }

        if (frequency > 5 && frequency <= 10) {
            trigger.everyMinutes(10);
        }

        if (frequency > 10 && frequency <= 15) {
            trigger.everyMinutes(15);
        }

        if (frequency > 15) {
            trigger.everyMinutes(30); // Default to 30 if higher than available intervals
        }
    }

    if (unit === 'hours') {
        trigger.everyHours(frequency);
    }

    trigger.create();
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
 * @public (now exposed for trigger use)
 */
function internalTriggerForSessionCheck() {
    _checkSessionStatusInternal();
}

/**
 * Checks session status; logs out if the session has expired.
 * @private
 */
function _checkSessionStatusInternal() {
    if (!isUserLoggedIn()) {
        Logger.log("User session has expired and has been logged out.");
        logout();
    }
}
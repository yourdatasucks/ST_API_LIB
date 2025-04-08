// Global object
var STLIB = STLIB || {};

/**
 * Retrieves a list of users from ServiceTrade with optional filters.
 * @public
 * @param {Object} [options={}] Options for filtering the request.
 * @param {string} [options.name] - User name includes this string (case insensitive).
 * @param {string} [options.email] - User email includes this string (case insensitive).
 * @param {string} [options.phone] - User phone number includes this string.
 * @param {string} [options.status='active'] - User status. One of ('active', 'inactive').
 * @param {string} [options.role] - User role. One of ('admin', 'manager', 'technician', 'sales', 'office').
 * @param {string} [options.officeId] - Comma-separated list of office IDs; returns users assigned to these offices.
 * @param {number} [options.createdBefore] - Timestamp; matches records created on or before this date.
 * @param {number} [options.createdAfter] - Timestamp; matches records created on or after this date.
 * @param {number} [options.updatedBefore] - Timestamp; matches records updated on or before this date.
 * @param {number} [options.updatedAfter] - Timestamp; matches records updated on or after this date.
 * @returns {Object} An object with a `success` flag and `data` object containing `totalPages`, `page`, and an array of `users`.
 * @returns {boolean} return.success - Indicates if the API call was successful.
 * @returns {Object} return.data - Data returned from the API call.
 * @returns {number} return.data.totalPages - The total number of pages available for the query.
 * @returns {number} return.data.page - The current page number.
 * @returns {Array} return.data.users - An array of user objects returned by the query.
 */
function getUsers(params = {}) {
    const baseUrl = "https://api.servicetrade.com/api/user";
    const sessionCookies = PropertiesService.getScriptProperties().getProperty("SESSION_COOKIES");
    if (!sessionCookies) return { success: false, message: "Not authenticated. Please log in first." };

    // Convert parameters to query string manually
    const queryParams = buildQueryParams(params);

    const url = `${baseUrl}?${queryParams}`;

    const options = {
        method: "get",
        headers: { "Cookie": sessionCookies },
        muteHttpExceptions: true
    };

    try {
        const response = UrlFetchApp.fetch(url, options);
        if (response.getResponseCode() === 200) {
            return { success: true, ...JSON.parse(response.getContentText()) };
        }
        return { success: false, message: `Failed to retrieve users: ${response.getResponseCode()}` };
    } catch (error) {
        return { success: false, message: `Error retrieving users: ${error.message}` };
    }
}

/**
 * Retrieves or manages user values from ServiceTrade.
 * @public
 * @param {Object} [options={}] Options for the request.
 * @param {number} [options.userId] - The ID of the user to get/set values for. If not provided, returns values for the authenticated user.
 * @param {string} [options.key] - The key of the user value to retrieve or set.
 * @param {string} [options.value] - The value to set (only used with POST/PUT methods).
 * @param {string} [options.method='GET'] - The HTTP method to use ('GET', 'POST', 'PUT', 'DELETE').
 * @returns {Object} An object with a `success` flag and `data` object containing the user value(s).
 * @returns {boolean} return.success - Indicates if the API call was successful.
 * @returns {Object} return.data - Data returned from the API call.
 * @returns {string} return.data.key - The key of the user value.
 * @returns {string} return.data.value - The value associated with the key.
 * @returns {number} return.data.userId - The ID of the user this value belongs to.
 */
function userValue({ userId, key, value, method = 'GET' } = {}) {
    const baseUrl = "https://api.servicetrade.com/api/user/value";
    const sessionCookies = PropertiesService.getScriptProperties().getProperty("SESSION_COOKIES");
    if (!sessionCookies) return { success: false, message: "Not authenticated. Please log in first." };

    let url = baseUrl;
    if (userId) {
        url = `https://api.servicetrade.com/api/user/${userId}/value`;
    }
    if (key) {
        url += `/${key}`;
    }

    const options = {
        method: method.toLowerCase(),
        headers: {
            "Cookie": sessionCookies,
            "Content-Type": "application/json"
        },
        muteHttpExceptions: true
    };

    // Add payload for POST/PUT requests
    if ((method === 'POST' || method === 'PUT') && value !== undefined) {
        options.payload = JSON.stringify({ value });
    }

    try {
        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();

        if (responseCode === 200 || responseCode === 204) {
            const content = response.getContentText();
            return {
                success: true,
                ...(content ? JSON.parse(content) : { data: null })
            };
        }
        return {
            success: false,
            message: `Failed to ${method.toLowerCase()} user value: ${responseCode}`
        };
    } catch (error) {
        return {
            success: false,
            message: `Error ${method.toLowerCase()}ing user value: ${error.message}`
        };
    }
} 
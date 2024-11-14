// Global object
var STLIB = STLIB || {};

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
    const queryParams = buildQueryParams(finalParams)

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
        return { success: false, message: `Failed to retrieve companies: ${response.getResponseCode()}` };
    } catch (error) {
        return { success: false, message: `Error retrieving companies: ${error.message}` };
    }
}

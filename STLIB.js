// Global object 
var STLIB = STLIB || {};

/**
 * Retrieves the session cookies from the library.
 * @private
 * @returns {string|null} - The session cookies or null if not logged in.
 */
function _getSessionCookies() {
  return PropertiesService.getScriptProperties().getProperty("SESSION_COOKIES");
}


/**
 * Build query parameters for api endpoints
 * @private
 *
 */
function buildQueryParams(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}
/**
 * demo extend: response helper
 * access via app.customExtend
 */
module.exports = (app) => ({
  /**
   * build unified response body
   * @param {object} data
   * @param {string} message
   * @returns {object}
   */
  ok(data, message = "ok") {
    return { code: 0, message, data };
  },
});
/**
 * demo service: greeting business logic
 * access via app.services.customModule.customService
 */
module.exports = (app) =>
  class CustomService {
    /**
     * build greeting message
     * @param {string} name
     * @returns {Promise<string>}
     */
    async getGreeting(name = "world") {
      return `hello ${name}`;
    }
  };
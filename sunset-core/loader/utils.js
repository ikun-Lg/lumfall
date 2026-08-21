/**
 * convert kebab/snake case name to camelCase
 * eg: custom-module => customModule
 * @param {string} name
 * @returns {string}
 */
const camelCase = (name) =>
  name.replace(/[-_][a-z0-9]/gi, (match) => match[1].toUpperCase());

module.exports = { camelCase };
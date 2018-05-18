/* eslint no-console: 0 */

const chalk = require("chalk");
const chalkTemplate = require("chalk/templates");

module.exports.log = function log(...args) {
    if (process.env.NODE_ENV === "test") {
        return;
    }
    console.log(...args.map(argument => chalkTemplate(chalk, argument)));
};

module.exports.error = function error(...args) {
    if (process.env.NODE_ENV === "test") {
        return;
    }
    console.error(...args.map(argument => chalkTemplate(chalk, argument)));
};

module.exports.debug = function debug(...args) {
    if (process.env.NODE_ENV !== "debug") {
        return;
    }
    console.log(chalk`{blue: DEBUG:}`, ...args.map(argument => chalkTemplate(chalk, argument)));
};
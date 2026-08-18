const fs = require("fs");
const path = require("path");
const log4js = require("log4js");

/**
 * log tool
 * @param {*} app
 * usage: app.logger.info("test");
 */
module.exports = (app) => {
  let logger;

  if (app.env.isLocal()) {
    logger = console;
  } else {
    const logDir = path.join(process.cwd(), "logs");
    fs.mkdirSync(logDir, { recursive: true });
    log4js.configure({
      appenders: {
        console: {
          type: "console",
        },
        dateFile: {
          type: "dateFile",
          filename: path.join(logDir, "application.log"),
          pattern: ".yyyy-MM-dd",
        },
      },
      categories: {
        default: { appenders: ["console", "dateFile"], level: "trace" },
      },
    });
    logger = log4js.getLogger();
  }

  return logger;
};

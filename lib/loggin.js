'use strict';
const winston = require('winston');
const fs = require('fs');
const v = require("../config/vars");
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = winston.createLogger({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            level: 'info'
        }),
        new (require('winston-daily-rotate-file'))({
            filename: `${logDir}/log`,
            timestamp: tsFormat,
            datePattern: v.DATE_FORMAT_DEF,
            prepend: true,
            level: env === 'development' ? 'verbose' : 'info'
        })
    ]
});


module.exports = logger;

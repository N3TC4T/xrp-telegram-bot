'use strict';
const winston = require('winston');
const fs = require('fs');
const v = require('../config/vars');
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.message}`),
    ),
    transports: [
        new winston.transports.Console(),
        new (require('winston-daily-rotate-file'))({
            filename: `${logDir}/log`,
            datePattern: v.DATE_FORMAT_DEF,
            prepend: true,
        }),
    ],
});

module.exports = logger;

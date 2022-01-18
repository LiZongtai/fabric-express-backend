import log4js from 'log4js';

/*
 * Please assign the logger with the file name for the application logging and assign the logger with "PgService"
 * for database logging for any file name. Please find an example below.
 *
 * To stacktrace, please pass the error.stack object to the logger. If there is no error.stack object pass in a
 * string with description.
 *
 * const helper = require("./app/helper");
 * const logger = helper.getLogger("main");
 * logger.setLevel('INFO');
 */

/**
 *
 * Returns Logger
 * @param {*} moduleName
 * @returns
 */
export class helper {
	static getLogger(moduleName: string): any {
		const logger = log4js.getLogger(moduleName);

		let appLog = 'logs/app/app.log';
		let dbLog = 'logs/db/db.log';
		let consoleLog = 'logs/console/console.log';

		if (process.env.SYNC_LOG_PATH) {
			appLog = `${process.env.SYNC_LOG_PATH}/app/app.log`;
			dbLog = `${process.env.SYNC_LOG_PATH}/db/db.log`;
			consoleLog = `${process.env.SYNC_LOG_PATH}/console/console.log`;
		}

		let appLevel = 'debug';
		let dbLevel = 'debug';
		let consoleLevel = 'info';

		if (process.env.LOG_LEVEL_APP) {
			appLevel = process.env.LOG_LEVEL_APP;
		}
		if (process.env.LOG_LEVEL_DB) {
			dbLevel = process.env.LOG_LEVEL_DB;
		}
		if (process.env.LOG_LEVEL_CONSOLE) {
			consoleLevel = process.env.LOG_LEVEL_CONSOLE;
		}
        let logConfig = {
            appenders: {
                network: {
                    type: 'tcp'
                }
            },
            categories: {
                default: { appenders: ['network'], level: appLevel },
                PgService: { appenders: ['network'], level: dbLevel }
            }
        };

		log4js.configure(logConfig);

		return logger;
	}
}

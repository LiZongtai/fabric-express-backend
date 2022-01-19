/**
 *
 *
 * @class ForkSenderHandler
 */
export class ForkSenderHandler {
	/**
	 * Creates an instance of ForkSenderHandler.
	 * @memberof ForkSenderHandler
	 */
	/*eslint-disable */
	constructor() {}
	/* eslint-enable */

	async initialize() {
		process.on('message', msg => {
			console.debug('Message from parent: %j', msg);
		});
	}

	/**
	 *
	 *
	 * @param {*} message
	 * @memberof ForkSenderHandler
	 */
	send(message) {
		if (process.send) {
			process.send(message);
		}
	}

	/**
	 *
	 *
	 * @memberof ForkSenderHandler
	 */
	close() {
		// TODO
	}
}

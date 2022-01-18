
/**
 *
 *
 * @class NetworkService
 */
 export class NetworkService {
	platform: any;
	/**
	 * Creates an instance of NetworkService.
	 * @param {*} platform
	 * @memberof NetworkService
	 */
	constructor(platform) {
		this.platform = platform;
	}

    /**
	 *
	 *
	 * @returns
	 * @memberof NetworkService
	 */
	async networkList() {
		// Get the list of the networks from the  configuration that was loaded from the config.json
		const networklist = [];
		const networks = this.platform.getNetworks();
		console.debug('Network list ', networks);
		for (const [network_id, clientObj] of networks.entries()) {
			console.debug('Network list ', clientObj.name);
			networklist.push({
				id: network_id,
				name: clientObj.name,
				authEnabled: clientObj.instance.fabricGateway.getEnableAuthentication()
			});
		}

		console.debug('Network list ', networklist);
		return networklist;
	}
}
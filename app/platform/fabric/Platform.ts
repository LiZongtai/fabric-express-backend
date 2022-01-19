import * as path from 'path';
import fs from 'fs-extra';
import * as FabricConst from './utils/FabricConst';
import { FabricConfig } from './FabricConfig';
import * as FabricUtils from './utils/FabricUtils';
import { ExplorerError } from '../../common/ExplorerError';
import { explorerError } from '../../common/ExplorerMessage';
import { Proxy } from './Proxy';
import { FabricServerListener } from './sync/listener/FabricServerListener';
// import { MetricService } from '../../persistence/fabric/MetricService';
import { CRUDService } from '../../persistence/fabric/CRUDService';

const config_path = path.resolve(__dirname, './config.json');
const fabric_const = FabricConst.fabric.const;

export class Platform {
	persistence: any;
	defaultNetwork: string;
	network_configs: Record<string, any>;
	networks: Map<string, any>;
	proxy: any;
	explorerListeners: any[];

	constructor(persistence) {
		this.persistence = persistence;
		this.network_configs = null;
		this.defaultNetwork = null;
		this.networks = new Map();
		this.proxy = null;
		this.explorerListeners = [];
	}

	async initialize() {
		// Loading the config.json
		const all_config = JSON.parse(fs.readFileSync(config_path, 'utf8'));
		const network_configs = all_config[fabric_const.NETWORK_CONFIGS];
		this.proxy = new Proxy(this);

		// Build client context
		console.debug(
			'******* Initialization started for hyperledger fabric platform ******'
		);
		console.debug(
			'******* Initialization started for hyperledger fabric platform ******,',
			network_configs
		);

		await this.buildClients(network_configs);

		if (this.networks.size === 0) {
			console.error(
				'************* There is no client found for Hyperledger fabric platform *************'
			);
			throw new ExplorerError(explorerError.ERROR_2008);
		}
	}


	/**
	 * @param {*} network_configs
	 * @memberof Platform
	 */
	async buildClients(network_configs) {
		// Setting organization enrolment files
		console.debug('Setting admin organization enrolment files');
		this.network_configs = network_configs;

		for (const network_id in this.network_configs) {
			const network_config = this.network_configs[network_id];
			if (!this.defaultNetwork) {
				this.defaultNetwork = network_id;
			}
			console.info(
				' network_config.id ',
				network_id,
				' network_config.profile ',
				network_config.profile
			);
			// Create client instance
			console.debug('Creating network client [%s] >> ', network_id, network_config);

			const config = new FabricConfig();
			config.initialize(network_id, network_config);

			const client = await FabricUtils.createFabricClient(
				config,
				this.persistence
			);

			if (client) {
				// Set client into clients map
				const clientObj = { name: network_config.name, instance: client };
				this.networks.set(network_id, clientObj);
			}
		}

	}

	/**
	 *
	 *
	 * @param {*} syncconfig
	 * @memberof Platform
	 */
	initializeListener() {
		/* eslint-disable */
		for (const [network_id, clientObj] of this.networks.entries()) {
			const network_name = clientObj.name;
			const network_client = clientObj.instance;
			console.info(
				'initializeListener, network_id, network_client ',
				network_id,
				network_client.getNetworkConfig()
			);
			if (network_client.getStatus()) {
				const fabricServerListener = new FabricServerListener(this);
				fabricServerListener.initialize([network_id, network_name, '1']);
				// fabricServerListener.send('Successfully send a message to child process');
				// this.explorerListeners.push(fabricServerListener);
			}
		}
		/* eslint-enable */
	}

		/**
	 *
	 *
	 * @memberof Platform
	 */
		 setPersistenceService() {
			// Setting platform specific CRUDService and MetricService
			// this.persistence.setMetricService(
			// 	new MetricService(this.persistence.getPGService())
			// );
			this.persistence.setCrudService(
				new CRUDService(this.persistence.getPGService())
			);
		}


	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getNetworks() {
		return this.networks;
	}

	/**
	 *
	 *
	 * @param {*} network_id
	 * @returns
	 * @memberof Platform
	 */
	getClient(network_id) {
		console.info(`getClient (id:${network_id})`);
		const clientObj = this.networks.get(network_id || this.defaultNetwork);
		return clientObj.instance;
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getProxy() {
		return this.proxy;
	}

	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getPersistence() {
		return this.persistence;
	}

}
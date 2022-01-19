import { ListenerHandler } from "./ListenerHandler";
/**
 *
 *
 * @class ExplorerListener
 */
export class FabricServerListener {
    public platform: any;
    public syncListenerHandler: any;

    /**
     * Creates an instance of ExplorerListener.
     * @param {*} platform
     * @memberof ExplorerListener
     */
    constructor(platform) {
        this.platform = platform;
        this.syncListenerHandler = null;
    }

    	/**
	 *
	 *
	 * @param {*} args
	 * @memberof ExplorerListener
	 */
	async initialize(args) {
        this.syncListenerHandler = new ListenerHandler(this.platform);
		if (this.syncListenerHandler) {
			this.syncListenerHandler.initialize(args);
		}
	}

    /**
	 *
	 *
	 * @param {*} message
	 * @memberof ExplorerListener
	 */
	send(message) {
		if (this.syncListenerHandler) {
			this.syncListenerHandler.send({
				message
			});
		}
	}

	/**
	 *
	 */
	close() {
		if (this.syncListenerHandler) {
			this.syncListenerHandler.close();
		}
	}
}
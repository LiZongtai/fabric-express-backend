import { PersistenceFactory } from './persistence/PersistenceFactory';
import { PlatformBuilder } from './platform/PlatformBuilder';
import Express from 'express';
import { explorerConst } from './common/ExplorerConst';
import {FabricApi} from './rest/FabricApi';


export class FabricServer {
    config: any;
    persistence: any;
    platforms: any[];
    router:any;
    constructor(config: any) {
        this.config = config;
        this.platforms = [];
    }


    async initialize(app) {
        this.persistence = await PersistenceFactory.create(this.config[explorerConst.PERSISTENCE], this.config[this.config[explorerConst.PERSISTENCE]]);
        const platform = await PlatformBuilder.build(
            this.persistence,
        );
        platform.setPersistenceService();
        // platform.setPersistenceService();
        await platform.initialize();
        // Initializing the rest app services
        this.router = Express.Router();
        const fabricApi=FabricApi(this.router,platform);
        // dbroutes(apirouter, platform);
        // await platformroutes(apirouter, platform);
        app.use('/api', this.router);

        platform.initializeListener();

        this.platforms.push(platform);
    }

    	/**
	 *
	 *
	 * @returns
	 * @memberof Platform
	 */
	getRouter() {
		return this.router;
	}

    /**
     *
     *
     * @memberof Explorer
     */

    close() {
        if (this.persistence) {
            this.persistence.closeconnection();
        }
        for (const platform of this.platforms) {
            if (platform) {
                platform.destroy();
            }
        }
    }
}
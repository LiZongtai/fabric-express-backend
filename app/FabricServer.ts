import { PersistenceFactory } from './persistence/PersistenceFactory';
import { PlatformBuilder } from './platform/PlatformBuilder';

export class FabricServer {
    config: any;
    persistence: any;
    platforms: any[];
    constructor(config: any) {
        this.config = config;
        this.platforms = [];
    }


    async initialize() {
        this.persistence = await PersistenceFactory.create(this.config.db, this.config);
        const platform = await PlatformBuilder.build(
            this.persistence,
        );
        await platform.initialize();


        this.platforms.push(platform);
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
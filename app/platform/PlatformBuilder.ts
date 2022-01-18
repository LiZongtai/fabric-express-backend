import { Platform } from "./fabric/Platform";

/**
 * @class PlatformBuilder
 */
export class PlatformBuilder {
    static async build(persistence: any) {
        const platform = new Platform(persistence);
        return platform;
    }
}
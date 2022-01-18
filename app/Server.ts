import { PersistenceFactory } from './persistence/PersistenceFactory';
export class Server{
    config:any;
    persistence: any;
    constructor(config:any){
        this.config=config;
    }
    async init(){
        this.persistence = await PersistenceFactory.create(this.config.db,this.config);
    }
}
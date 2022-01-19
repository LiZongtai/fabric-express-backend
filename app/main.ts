import express from 'express';
import { FabricServer } from './FabricServer';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

// rest of the code remains same
const app = express();
const PORT = 8081;

const DBconfig = {
  db:"postgreSQL",
  host:"localhost",
  username: "hppoc",
  database: "fabricexplorer",
  passwd: "Fabric2022",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 3000,
}
const fabricServer =new FabricServer(DBconfig);

async function startServer(){
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );
  fabricServer.initialize(app);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
  });
  
}
startServer();


import express from 'express';
import { FabricServer } from './FabricServer';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

// rest of the code remains same
const app = express();
const PORT = 8081;

const DBconfig = {
  db: "postgreSQL",
  host: "localhost",
  username: "hppoc",
  database: "fabricexplorer",
  passwd: "Fabric2022",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 3000,
}
const fabricServer = new FabricServer(DBconfig);

async function startServer() {
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );
  //设置跨域访问
  app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
  });
  fabricServer.initialize(app);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
  });

}
startServer();


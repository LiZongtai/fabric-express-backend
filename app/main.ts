import express from 'express';
import { FabricServer } from './FabricServer';


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
  fabricServer.initialize();
}
startServer();

app.get('/', async (req, res) =>{
  res.send('Express + TypeScript Server');
} 
);
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
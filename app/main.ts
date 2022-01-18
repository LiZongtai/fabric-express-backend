import express from 'express';
import { Server } from './Server';

// rest of the code remains same
const app = express();
const PORT = 8081;
const config = {
  host:"localhost",
  username: "hppoc",
  database: "fabricexplorer",
  passwd: "Fabric2022",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 3000,
}
let server =new Server(config);

async function startServer(){
  server.init();
}
startServer();

app.get('/', async (req, res) =>{
  res.send('Express + TypeScript Server');
} 
);
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
## Prerequisites
### dependcies
* Node 14 (tested with v14.18.2)
* PostgreSQL 9.5 or greater (tested with v13.4 ubuntu)
### start fabric network
Just do it.
### set host
* This is a temp solution of an Unresolved issues.
Set host in `/etc/hosts`.
For example,
```
172.18.0.4 orderer.example.com
172.18.0.2 peer0.org1.example.com
172.18.0.3 peer0.org2.example.com
```
The IP value is the docker static IPAddress, you can get it with command:
```
docker inspect [peer_container_name] | grep IPAddress
```
### Database Setup
```
$ cd app
```

* Modify `app/explorerconfig.json` to update PostgreSQL database settings.

    ```json
    "postgreSQL": {
        "host": "127.0.0.1",
        "port": "5432",
        "database": "fabricexplorer",
        "username": "hppoc",
        "passwd": "Fabric2022"
    }
    ```
Then, run create database script:  
* **Ubuntu**

    ```
    $ cd app/persistence/fabric/postgreSQL/db
    $ sudo -u postgres ./createdb.sh
    ```

* **MacOS**

    ```
    $ cd app/persistence/fabric/postgreSQL/db
    $ ./createdb.sh
    ```
## Start App
```
npm install
npm run build
npm start
```
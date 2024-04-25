'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const bodyParser = require('body-parser');
const http = require('http');
const https = require("https");
const fs = require("fs");
const util = require('util');
const express = require('express')
const app = express();
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const constants = require('./config/constants.json');
const validator = require('validator');
const { 
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;


const helper = require('./app/helper')
const invoke = require('./app/invoke')
const qscc = require('./app/qscc')
const query = require('./app/query')

const mysql = require('mysql2'); 
// const databaseCon = mysql.createConnection(
//     {
//         host: "127.0.0.1",
//         user: "root",
//         password: "root@sql*123456789",
//         database: "mydb"
//     }
// );
const databaseCon = mysql.createConnection(
    {
        host: "127.0.0.1",
        user: "root",
        password: "root",
        database: "mydb"
    }
);

const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
let url = "mongodb://127.0.0.1:27017/mydb";
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});
url = "mongodb://127.0.0.1:27017/";

app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
    secret: 'thisismysecret'
}).unless({
    path: ['/users','/users/login', '/register']
}));
app.use(bearerToken());

logger.level = 'debug';

app.use((req, res, next) => {
    logger.debug('New req for %s', req.originalUrl);
    if (
            req.originalUrl.indexOf('/users') >= 0 || 
            req.originalUrl.indexOf('/users/login') >= 0 || 
            req.originalUrl.indexOf('/register') >= 0
        ) {
        return next();
    }
    const token = req.token;
    jwt.verify(token, app.get('secret'), (err, decoded) => {
        if (err) {
            console.log(`Error ================:${err}`)
            res.send({
                success: false,
                message: 'Failed to authenticate token. Make sure to include the ' +
                    'token returned from /users call in the authorization header ' +
                    ' as a Bearer token'
            });

        } else {
            req.username = decoded.username;
            req.orgname = decoded.orgName;
            req.role = decoded.role;
            req.userType = decoded.userType;
            logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
            return next();
        }
    });
});

const server = http.createServer(app).listen(port, function () {
    console.log(`Server started on ${port}`)
});
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}
// const server = https.createServer(options, app).listen(port, function(){
//     console.log(`Server started on ${port}`);
// });
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

function getErrorMessage(field) {
    return {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
}

const adminUsername = "username@Admin";
const adminPassword = "12345678";

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//------------------------------------User database(SQL)----------------------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------

app.post('/database/table/create', async function(req, res){
    
    if (req.username !== adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected!");
            const sql = "CREATE TABLE organizations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), username VARCHAR(255), password VARCHAR(255), userType VARCHAR(255), role VARCHAR(255), information TEXT, batchSize INT, nickname VARCHAR(255))";
            databaseCon.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    res.json({ success: false, message: err});
                    return;
                }
                res.json({ success: true, message: result});
            });
        }
    );

});

app.post('/database/table/drop', async function(req, res){
    
    if (req.username !== adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected!");
            var sql = "DROP TABLE organizations";
            databaseCon.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    res.json({ success: false, message: err});
                    return;
                }
                res.json({ success: true, message: result});
            });
        }
    );

});

app.post('/organizations/insert', async function(req, res){

    if (req.username !== adminUsername) {
        res.json({ success: false, message: "Permission denied."});
    }

    const names = req.body.names;
    const usernames = req.body.usernames;
    const passwords = req.body.passwords;
    const usersType = req.body.usersType;
    const roles = req.body.roles;
    const informations = req.body.informations;
    const batchSize = req.body.batchSize;
    const nickname = req.body.nickname;

    console.log(names);
    console.log(usernames);
    console.log(passwords);
    console.log(roles);
    console.log(informations);
    console.log(usersType);
    console.log(batchSize);

    if (usernames.length == passwords.length == roles.length == usersType.length == batchSize.length) {
        res.json({ success: false, message: "Invalid input arguments." });
        return;
    }

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected to database.");
            const sql = "INSERT INTO organizations (name, username, password, userType, role, information, batchSize, nickname) VALUES ?";
            var values = [];
            for(let i = 0; i < usernames.length; i++) {
                values.push([names[i], usernames[i], passwords[i], usersType[i], roles[i], informations[i], batchSize[i], nickname[i]]);
            }
            databaseCon.query(sql,[values], function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("Number of records inserted: " + result.affectedRows);
                res.json({ success: true, message: "Number of records inserted: " + result.affectedRows});
            });
        }
    );

});

app.get('/organizations', async function(req, res){

//    if (req.username !== adminUsername) {
//        res.json({ success: false, message: "Permission denied."});
//        return;
//    }

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected to database.");
            const sql = "SELECT * FROM organizations";
            databaseCon.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                res.json({ success: true, message: result});
            });
        }
    );

});

app.get('/user/profile', async function(req, res){

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected to database.");
            const sql = "SELECT id, name, role, information, batchSize, nickname, imageUrl FROM organizations WHERE `username`= '" + req.username + "';";
            databaseCon.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                res.json({ success: true, message: result});
            });
        }
    );

});

app.get('/organizations/roles', async function(req, res){

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected to database.");
            const sql = "SELECT id, username, role, nickname FROM organizations";
            databaseCon.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                res.json({ success: true, message: result});
            });
        }
    );

});

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//------------------------------------Market database(MongoDb)----------------------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------

app.post('/collection/create', async function(req, res){

    var name = req.body.name;
    
    if (req.username !== adminUsername) {
        res.json({ success: false, message: "Permission denied."});
    }

    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log(err);
            res.json({ success: false, message: err});
            return;
        }
        const dbo = db.db("mydb");
        dbo.createCollection(name, function(err, result) {
            if (err) {
                dbo.collection(name).deleteMany({});
                console.log(err);
                res.json({ success: false, message: err});
                return;
            }
            dbo.collection(name).deleteMany({});
            console.log("Collection created!");
            res.json({ success: true, message: "Collection created!"});
            db.close();
        });
    }); 

});

app.get('/collection/:collectionName/objects', async function(req, res){

    const collectionName = req.params.collectionName;

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection(collectionName).find({}).toArray(function(err, result) {

            if (err) {
                console.log(err);
                res.json({ success: false, message: err});
                return;
            }
            console.log(result);
            res.json({ success: true, message: result});
            db.close();

        });
    }); 

});

app.post('/mongo/collection/drop', async function(req, res){
    
    if (req.username !== adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    const collectionName = req.body.name;

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection(collectionName).drop(function(err, delOK) {
          if (err) {
            res.json({ success: false, message: err});
            return;
          }
          res.json({ success: true, message: delOK});
          db.close();
        });
    }); 

});

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//------------------------------------Register and login----------------------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------

// Register and enroll user
app.post('/users', async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    // var orgName = req.body.orgName;
    let orgName = "Org2";
    if (username === adminUsername) {
        orgName = "Org1";
    }

    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                return;
            }
            console.log("Connected to database.");
            const sql = "SELECT * FROM organizations WHERE `username` = '" + username + "' AND `password` = '" + password + "'";
            databaseCon.query(sql, async function (err, result) {
                let resLength = 0;
                if (err) {
                    console.log(err);
                    // return;
                } else {
                    resLength = result.length;
                }
                if (resLength !== 0 || (username === adminUsername && password === adminPassword)){

                    let role = "";
                    let userType = "";
                    if (resLength === 0) {
                        role = "Admin";
                        userType = "Admin";
                    } else {
                        role = result[0].role;
                        userType = result[0].userType;
                    }

                    const token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
                        username: username,
                        orgName: orgName,
                        role: role,
                        userType: userType
                    }, app.get('secret'));

                    let response = await helper.getRegisteredUser(username, orgName, true);
                
                    logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
                    if (response && typeof response !== 'string') {
                        logger.debug('Successfully registered the username %s for organization %s', username, orgName);
                        response.token = token;
                        res.json(response);
                    } else {
                        logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
                        res.json({ success: false, message: response });
                    }
                } else {
                    res.json({ success: true, message: "Invalid username or password."});
                }

            });
        }
    );
    

});

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//-----------------------------Invoke transaction on smart contract-----------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------

app.post('/channels/:channelName/chaincodes/:chaincodeName/batch/create', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {

        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        
        let id = uuidv4();
        let owner = req.username;
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const price = req.body.price;
        //new
        const assetType = "Batch";
        const tag = req.body.tag;
        const status = req.body.status;

        let role = req.role;
        let userType = req.userType;

        console.log("id ======================== "+id)

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('price  : ' + price);
        logger.debug('assetType  : ' + assetType);
        logger.debug('tag  : ' + tag);
        logger.debug('status  : ' + status);
        logger.debug('====================================');
        logger.debug('role  : ' + role);
        logger.debug('userType  : ' + userType);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (price == null) {
            res.json(getErrorMessage('\'price\''));
            return;
        }

        let message = await invoke.createAsset(channelName, chaincodeName, req.username, req.orgname, id, assetType, tag, status, price, owner);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        MongoClient.connect(url, function(err, db) {
            if (err) {
                console.log(err);
            }
            const dbo = db.db("mydb");
            const myobj = {
                user: owner,
                assetId: id,
                assetType: "Asset",
                tx: "Create",
                date: Date(),
                details: message.result
            };
            dbo.collection("Logs").insertOne(myobj, function(err, result) {
                if (err) {
                    console.log(err);
                }
                console.log("Log successful");
                db.close();
            });
        });

        res.send(response_payload); 

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/create/bulk', async function (req, res) {

    if (req.username === adminUsername || req.userType !== "Factory") {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {

        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const price = req.body.price;
        const count = req.body.count;

        let owner = req.username;

        //new
        const assetType = req.body.assetType;
        const tag = req.body.tag;
        const status = req.body.status;


        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('price  : ' + price);
        logger.debug('assetType  : ' + assetType);
        logger.debug('tag  : ' + tag);
        logger.debug('status  : ' + status);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (price == null) {
            res.json(getErrorMessage('\'price\''));
            return;
        }


        let firstIterate = true;
        let assetsIdsStr = "";
        for (let i = 0; i < count; i++)  {
            if(!firstIterate) {
                assetsIdsStr = assetsIdsStr + "#";
            }
            firstIterate = false;
            assetsIdsStr = assetsIdsStr + uuidv4(); 
        }
        assetsIdsStr = assetsIdsStr + "";
        console.log("assetsIds array : " + assetsIdsStr);


        let message = await invoke.createBulkAssets(channelName, chaincodeName, req.username, req.orgname, assetsIdsStr, assetType, tag, status, price, owner);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        MongoClient.connect(url, function(err, db) {
            if (err) {
                console.log(err);
            }
            const dbo = db.db("mydb");
            const myobj = {
                user: owner,
                assetId: "",
                assetType: "Asset",
                tx: "Create Bulk",
                date: Date(),
                details: message.result
            };
            dbo.collection("Logs").insertOne(myobj, function(err, result) {
                if (err) {
                    console.log(err);
                }
                console.log("Log successful");
                db.close();
            });
        });

        res.send(response_payload); 

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/batch/create/asset/bulk', async function (req, res) {

    if (req.username === adminUsername || req.userType !== "Factory") {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const price = req.body.price;
        let owner = req.username;
        //-------------------------------------
        //new
        const assetType = req.body.assetType;
        const tag = req.body.tag;
        const status = req.body.status;

        const batchId = uuidv4();

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('price  : ' + price);

        logger.debug('assetType  : ' + assetType);
        logger.debug('tag  : ' + tag);
        logger.debug('status  : ' + status);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (price == null) {
            res.json(getErrorMessage('\'price\''));
            return;
        }

        databaseCon.connect(
            function(err){
                if (err) {
                    console.log(err);
                    const response_payload = {
                        result: null,
                        error: err,
                        errorData:null
                    }
                    res.send(response_payload)
                    return;
                }
                console.log("Connected to database.");
                const sql = "SELECT * FROM organizations WHERE `username` = '" + owner + "'";
                databaseCon.query(sql, async function (err, result) {

                    if (err) {
                        console.log(err);
                        const response_payload = {
                            result: null,
                            error: err,
                            errorData:null
                        }
                        res.send(response_payload)
                        return;
                    }

                    const count = result[0].batchSize;

                    if (count <= 0) {
                        console.log("You dont have permission to create batch.");
                        const response_payload = {
                            result: null,
                            error: "You dont have permission to create batch.",
                            errorData:null
                        }
                        res.send(response_payload)
                        return;
                    }

                    let firstIterate = true;
                    let assetsIdsStr = "";
                    for (let i = 0; i < count; i++)  {
                        if(!firstIterate) {
                            assetsIdsStr = assetsIdsStr + "#";
                        }
                        firstIterate = false;
                        assetsIdsStr = assetsIdsStr + uuidv4(); 
                    }
                    assetsIdsStr = assetsIdsStr + "";
                    console.log("assetsIds array : " + assetsIdsStr);
            
            
                    let message = await invoke.createBulkAssetsInBatch(channelName, chaincodeName, req.username, req.orgname, assetsIdsStr, assetType, tag, status, price, owner, batchId);
                    console.log(`message result is : ${message}`)
            
                    const response_payload = {
                        result: message,
                        error: null,
                        errorData: null
                    }
            
                    MongoClient.connect(url, function(err, db) {
                        if (err) {
                            console.log(err);
                        }
                        const dbo = db.db("mydb");
                        const myobj = {
                            user: owner,
                            assetId: batchId,
                            assetType: "Batch",
                            tx: "Create bulk assets in batch.",
                            date: Date(),
                            details: message.result
                        };
                        dbo.collection("Logs").insertOne(myobj, function(err, result) {
                            if (err) {
                                console.log(err);
                            }
                            console.log("Log successful");
                            db.close();
                        });
                    });
            
                    res.send(response_payload); 


    
                });
            }
        );


    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/token/buy', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const price = req.body.price;


        let user = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('price  : ' + price);
        logger.debug('user  : ' + user);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!price) {
            res.json(getErrorMessage('\'price\''));
            return;
        }

        let message = await invoke.buyToken(channelName, chaincodeName, req.username, req.orgname, user, price);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/token/transfer', async function (req, res) {
    
    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }
    
    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const amount = req.body.amount;
        const receiver = req.body.receiver;

        let user = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('amount  : ' + amount);
        logger.debug('receiver  : ' + receiver);
        logger.debug('user  : ' + user);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!amount) {
            res.json(getErrorMessage('\'amount\''));
            return;
        }
        if (!receiver) {
            res.json(getErrorMessage('\'receiver\''));
            return;
        }

        let message = await invoke.transferToken(channelName, chaincodeName, req.username, req.orgname, user, receiver, amount);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/attr/put', async function (req, res) {

    if ( req.username === adminUsername ) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const key = req.body.key;
        const value = req.body.value;
        const instruction = req.body.instruction;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('key  : ' + key);
        logger.debug('value  : ' + value);
        logger.debug('instruction  : ' + instruction);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!key) {
            res.json(getErrorMessage('\'key\''));
            return;
        }
        if (!value) {
            res.json(getErrorMessage('\'value\''));
            return;
        }
        if (!instruction) {
            res.json(getErrorMessage('\'instruction\''));
            return;
        }

        // uuid validation.
        const validate = validator.default.isUUID(id, 4)
        if (!validate) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.putAttr(channelName, chaincodeName, req.username, req.orgname, id, key, value, instruction);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/temp/put', async function (req, res) {


    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const temperature = req.body.temperature;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('temperature  : ' + temperature);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!temperature) {
            res.json(getErrorMessage('\'temperature\''));
            return;
        }

        // uuid validation.
        const validate = validator.default.isUUID(id, 4)
        if (!validate) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.putTemperature(channelName, chaincodeName, req.username, req.orgname, id, temperature);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/alert/set', async function (req, res) {


    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const alert = req.body.alert;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('alert  : ' + alert);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        // if (!alert) {
        //     res.json(getErrorMessage('\'alert\''));
        //     return;
        // }

        // uuid validation.
        const validate = validator.default.isUUID(id, 4)
        if (!validate) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.setAlert(channelName, chaincodeName, req.username, req.orgname, id, alert);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/humidity/put', async function (req, res) {


    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const humidity = req.body.humidity;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('humidity  : ' + humidity);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!humidity) {
            res.json(getErrorMessage('\'humidity\''));
            return;
        }

        // uuid validation.
        const validate = validator.default.isUUID(id, 4)
        if (!validate) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.putHumidity(channelName, chaincodeName, req.username, req.orgname, id, humidity);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/batch/attr/put', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.batchId;
        const key = req.body.key;
        const value = req.body.value;
        const instruction = req.body.instruction;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('key  : ' + key);
        logger.debug('value  : ' + value);
        logger.debug('instruction  : ' + instruction);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!key) {
            res.json(getErrorMessage('\'key\''));
            return;
        }
        if (!value) {
            res.json(getErrorMessage('\'value\''));
            return;
        }
        if (!instruction) {
            res.json(getErrorMessage('\'instruction\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.putAttrForAssetsInBatch(channelName, chaincodeName, req.username, req.orgname, id, key, value, instruction);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/owner/change', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const newOwner = req.body.newOwner;

        let owner = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('newOwner  : ' + newOwner);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!newOwner) {
            res.json(getErrorMessage('\'newOwner\''));
            return;
        }

        // uuid validation.
        const validate = validator.default.isUUID(id, 4)
        if (!validate) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.changeAssetOwner(channelName, chaincodeName, req.username, req.orgname, id, owner, newOwner);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/delivery/take', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;

        let buyer = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('buyer  : ' + buyer);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!buyer) {
            res.json(getErrorMessage('\'buyer\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.takeDelivery(channelName, chaincodeName, req.username, req.orgname, id, buyer);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/localDC/add', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;

        let localDC = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.addLocalDC(channelName, chaincodeName, req.username, req.orgname, id, localDC);
        console.log(`message result is : ${message}`)

        if(message.status === 200) {
            
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                const dbo = db.db("mydb");
                const date = Date()
                const myobj = {
                    user: localDC,
                    assetId: id,
                    assetType: "Asset",
                    tx: "AddLocalDeliveryCompany",
                    date: date,
                    details: message.body
                };
                dbo.collection("Logs").insertOne(myobj, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("Log successful");
                    const response_payload = {
                        result: message,
                        error: null,
                        errorData: null
                    }
                    res.send(response_payload);
                    // db.close();
                });
            });

        } else {
            res.send({success: false, message: message});
        }

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/globalDC/add', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;

        let globalDC = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }
        
        let message = await invoke.addGlobalDC(channelName, chaincodeName, req.username, req.orgname, id, globalDC);
        console.log(`message result is : ${message}`)

        if(message.status === 200) {

            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                const dbo = db.db("mydb");
                const date = Date()
                const myobj = {
                    user: globalDC,
                    assetId: id,
                    assetType: "Asset",
                    tx: "AddGlobalDeliveryCompany",
                    date: date,
                    details: message.body
                };
                dbo.collection("Logs").insertOne(myobj, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("Log successful");
                    const response_payload = {
                        result: message,
                        error: null,
                        errorData: null
                    }
                    res.send(response_payload);
                    // db.close();
                });                
                
            }); 
  

        } else {
            res.send({success: false, message: message});
        }

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/status/change', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const status = req.body.status;

        let owner = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('status  : ' + status);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!status) {
            res.json(getErrorMessage('\'status\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.changeAssetStatus(channelName, chaincodeName, req.username, req.orgname, id, owner, status);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            success: false,
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/assetsInBatch/status/change', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.batchId;
        const status = req.body.status;
        let owner = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('status  : ' + status);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!status) {
            res.json(getErrorMessage('\'status\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.changeStatusForAssetsInBatch(channelName, chaincodeName, req.username, req.orgname, id, owner, status);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            success: false,
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/price', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const price = req.body.price;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('price  : ' + price);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (price == null) {
            res.json(getErrorMessage('\'price\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.setAssetPrice(channelName, chaincodeName, req.username, req.orgname, id, price);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/collection/:collectionName/asset/public', async function (req, res) {
    
    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }
    
    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const collectionName = req.params.collectionName;
        const assetId = req.body.assetId;
        let price = 0.0;
        price = req.body.price;

        let user = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('chaincodeName : ' + collectionName);
        logger.debug('assetId  : ' + assetId);
        logger.debug('user  : ' + user);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!assetId) {
            res.json(getErrorMessage('\'assetId\''));
            return;
        }
        if (!collectionName) {
            res.json(getErrorMessage('\'collectionName\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(assetId, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.setAssetPublicToSell(channelName, chaincodeName, req.username, req.orgname, assetId, user, price, req.userType);
        console.log(`message result is : ${message}`)

        const asset = message.body;
        if (asset.forSale) {

            MongoClient.connect(url, function(err, db) {
                if (err) {
                    console.log(err);
                    res.json({ success: false, message: err});
                }
                const dbo = db.db("mydb");
                const myobj = {_id: assetId, asset: asset, price: price, bids: {}};
                dbo.collection(collectionName).insertOne(myobj, function(err, result) {
                    if (err) {
                        console.log(err);
                        res.json({ success: false, message: err});
                    }
                    console.log("1 document inserted");
                    const response_payload = {
                        result: message,
                        error: null,
                        errorData: null
                    }
                    res.send(response_payload); 
                    db.close();
                });
            }); 
               
        } else {
            res.send({success: false, error: "Something wrong!"});
        }

    } catch (error) {
        const response_payload = {
            success: false,
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/bid', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const assetId = req.body.assetId;
        const assetOwner = req.body.assetOwner;
        const price = req.body.price;

        let customer = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('assetId  : ' + assetId);
        logger.debug('assetOwner  : ' + assetOwner);
        logger.debug('customer  : ' + customer);
        logger.debug('price  : ' + price);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!assetId) {
            res.json(getErrorMessage('\'assetId\''));
            return;
        }
        if (!assetOwner) {
            res.json(getErrorMessage('\'assetOwner\''));
            return;
        }
        if (price == null) {
            res.json(getErrorMessage('\'price\''));
            return;
        }

        if (customer === assetOwner) {
            res.json({ success: false, message: "Permission denied."});
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(assetId, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.blockingToken(channelName, chaincodeName, req.username, req.orgname, customer);
        console.log(`message result is : ${message}`)

        if(message.staus === 200) {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("mydb");
                var query = { _id: assetId };
                dbo.collection("Market").find(query).toArray(function(err, result) {
                    if (err) {
                        console.log(err);
                        res.json({ success: false, message: err});
                    }
                    var _result = result[0];
                    _result.bids[customer] = price;
                    var newvalues = { $set: _result };
                    dbo.collection("Market").updateOne(query, newvalues, function(err, result) {
                        if (err) {
                            console.log(err);
                            res.json({ success: false, message: err});
                        }
                        console.log("1 document updated");
                        const response_payload = {
                            result: message,
                            error: null,
                            errorData: null
                        }
                        db.close();
                        
                        res.send(response_payload);
                        
                    });
                    
                });
            }); 
        } else {
            res.send({success: false, message: "Insufficient balance."});
        }

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/batch/add', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const batchId = req.body.batchId;
        const assetsIds = req.body.assetsIds;
        const owner = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('batchId  : ' + batchId);
        logger.debug('assetsIds  : ' + assetsIds);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!batchId) {
            res.json(getErrorMessage('\'batchId\''));
            return;
        }
        if (!assetsIds) {
            res.json(getErrorMessage('\'assetsIds\''));
            return;
        }

        let firstIterate = true;
        let assetsIdsStr = "";
        for (var key in assetsIds) {
            if (assetsIds.hasOwnProperty(key)) {
                if(!firstIterate) {
                    assetsIdsStr = assetsIdsStr + "#";
                }
                firstIterate = false;
                assetsIdsStr = assetsIdsStr + assetsIds[key];                
            }
        }
        assetsIdsStr = assetsIdsStr + "";
        console.log("assetsIds array : " + assetsIdsStr);

        // uuid validation.
        if (!validator.default.isUUID(batchId, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.putAssetsInBatch(channelName, chaincodeName, req.username, req.orgname, assetsIdsStr, owner, batchId);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/batch/remove', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const batchId = req.body.batchId;
        const assetsIds = req.body.assetsIds;
        let owner = req.username;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('batchId  : ' + batchId);
        logger.debug('assetsIds  : ' + assetsIds);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!batchId) {
            res.json(getErrorMessage('\'batchId\''));
            return;
        }
        if (!assetsIds) {
            res.json(getErrorMessage('\'assetsIds\''));
            return;
        }

        let firstIterate = true;
        let assetsIdsStr = "";
        for (let key in assetsIds) {
            if (assetsIds.hasOwnProperty(key)) {
                if(!firstIterate) {
                    assetsIdsStr = assetsIdsStr + "#";
                }
                firstIterate = false;
                assetsIdsStr = assetsIdsStr + assetsIds[key];                
            }
        }
        assetsIdsStr = assetsIdsStr + "";
        console.log("assetsIds array : " + assetsIdsStr);

        // uuid validation.
        if (!validator.default.isUUID(batchId, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await invoke.removeAssetsFromBatch(channelName, chaincodeName, req.username, req.orgname, assetsIdsStr, owner, batchId);
        console.log(`message result is : ${message}`)

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }
        res.send(response_payload);

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.post('/channels/:channelName/chaincodes/:chaincodeName/asset/sell', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== INVOKE ON CHAINCODE ==================');
        const chaincodeName = req.params.chaincodeName;
        const channelName = req.params.channelName;
        const id = req.body.id;
        const customer = req.body.customer;

        logger.debug('channelName  : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('id  : ' + id);
        logger.debug('customer  : ' + customer);
        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }
        if (!customer) {
            res.json(getErrorMessage('\'customer\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("mydb");
            const query = {_id: id};
            dbo.collection("Market").find(query).toArray(async function(err, result) {
                if (err) {
                    console.log(err);
                    res.json({ success: false, message: err});
                }
                console.log(result);
                // db.close();
                let price = 0;
                price = result[0].bids[customer];

                const obj = result[0].bids;
                let firstIterate = true;
                let biders = "";
                let bids = "";
                for (let key in obj) {
                    if (obj.hasOwnProperty(key) && key !== customer) {
                        if(!firstIterate) {
                            biders = biders + "#";
                            bids = bids + "#"
                        }
                        firstIterate = false;
                        biders = biders + key;
                        bids = bids + obj[key];
                    }
                }
                biders = biders + "";
                bids = bids + "";
                // console.log("Biders array : " + biders);

                let message = await invoke.sellAsset(channelName, chaincodeName, req.username, req.orgname, id, req.username, customer, price, biders);
                console.log(`message result is : ${message}`)

                if(message.status === 200) {

                    const date = Date()
                    const myobj = {
                        user: req.username,
                        assetId: id,
                        assetType: "Asset",
                        tx: "Sell to " + customer,
                        date: date,
                        details: message.body
                    };
                    dbo.collection("Logs").insertOne(myobj, function(err, result) {
                        if (err) {
                            console.log(err);
                        }
                        console.log("Log successful");
                        // db.close();
                    });
                    const myobj1 = {
                        user: customer,
                        assetId: id,
                        assetType: "Asset",
                        tx: "Buy from " + req.username,
                        date: date,
                        details: message.body
                    };
                    dbo.collection("Logs").insertOne(myobj1, function(err, result) {
                        if (err) {
                            console.log(err);
                        }
                        console.log("Log successful");
                        // db.close();
                    });

                    const myquery = {_id: id};
                    dbo.collection("Market").deleteOne(myquery, function(err, obj) {
                        if (err) {
                            console.log(err);
                            res.json({ success: false, message: err});
                            return;
                        }
                        console.log("1 document deleted");

                        const response_payload = {
                            result: message,
                            error: null,
                            errorData: null
                        }
                        res.send(response_payload);
                        db.close();
                    });                    

                } else {
                    res.send({success: false, message: message});
                }

            });
        }); 

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------Query on smart contract-------------------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------

app.get('/channels/:channelName/chaincodes/:chaincodeName/asset', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);
        const id = req.query.id;

        console.log(`id is :${id}`);
        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await query.queryAsset(channelName, chaincodeName, req.username, req.orgname, id);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/token', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;

        console.log(`chaincode name is :${chaincodeName}`);
        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }

        let message = await query.queryToken(channelName, chaincodeName, req.username, req.orgname, req.username);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/all', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }

        let message = await query.queryAllAssets(channelName, chaincodeName, req.username, req.orgname);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/owner', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        const owner = req.username;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        
        let message = await query.queryAssetsByOwner(channelName, chaincodeName, req.username, req.orgname, owner);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/LD', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        const owner = req.username;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        
        let message = await query.queryAssetsByLD(channelName, chaincodeName, req.username, req.orgname, owner);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/GD', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        let owner = req.username;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        
        let message = await query.queryAssetsByGD(channelName, chaincodeName, req.username, req.orgname, owner);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/status', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        const status = req.query.status;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        
        let message = await query.queryAssetsByStatus(channelName, chaincodeName, req.username, req.orgname, status);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/buyer', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        const buyer = req.username;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        
        let message = await query.queryAssetsByBuyer(channelName, chaincodeName, req.username, req.orgname, buyer);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/public', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;

        console.log(`chaincode name is :${chaincodeName}`);

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }

        let message = await query.queryPublicAssets(channelName, chaincodeName, req.username, req.orgname);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/batch/assets', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        const batchId = req.query.batchId;

        let owner = req.username;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        logger.debug('batchId : ' + batchId);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!batchId) {
            res.json(getErrorMessage('\'batchId\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(batchId, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await query.getAssetsOfBatch(channelName, chaincodeName, req.username, req.orgname, batchId, owner);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/asset/history', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;

        const id = req.query.id;

        console.log(`chaincode name is :${chaincodeName}`);

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!id) {
            res.json(getErrorMessage('\'id\''));
            return;
        }

        // uuid validation.
        if (!validator.default.isUUID(id, 4)) {
            logger.debug("id is invalid");
            res.send(
                {
                    "success": false,
                    "error": {
                        "status": 400,
                        "message": "Invalid uuid."
                    }
                }
            )
        }

        let message = await query.getAssetHistory(channelName, chaincodeName, req.username, req.orgname, id);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/assets/owner/phone', async function (req, res) {
    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`);

        let owner = req.query.owner;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('owner : ' + owner);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        
        let message = await query.queryAssetsByOwner(channelName, chaincodeName, req.username, req.orgname, owner);

        const response_payload = {
            result: message,
            error: null,
            errorData: null
        }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/channels/:channelName/chaincodes/:chaincodeName/asset/bids', async function (req, res) {

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        const assetId = req.query.assetId;
        console.log(`chaincode name is :${chaincodeName}`);

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('assetId : ' + assetId);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!assetId) {
            res.json(getErrorMessage('\'assetId\''));
            return;
        }

        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            const dbo = db.db("mydb");
            const query = {_id: assetId};
            dbo.collection("Market").find(query).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                    res.json({ success: false, message: err});
                }
                console.log(result);
                db.close();
                if(result[0].asset.owner === req.username) {
                    const response_payload = {
                        result: result[0].bids,
                        error: null,
                        errorData: null
                    }
            
                    res.send(response_payload);
                } else {
                    res.send({success: false, message: "Permission denied."});
                }

            });
        }); 

    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/qscc/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {x

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    try {
        logger.debug('==================== QUERY BY CHAINCODE ==================');

        const channelName = req.params.channelName;
        const chaincodeName = req.params.chaincodeName;
        console.log(`chaincode name is :${chaincodeName}`)
        let args = req.query.args;
        let fcn = req.query.fcn;
        // let peer = req.query.peer;

        logger.debug('channelName : ' + channelName);
        logger.debug('chaincodeName : ' + chaincodeName);
        logger.debug('fcn : ' + fcn);
        logger.debug('args : ' + args);

        if (!chaincodeName) {
            res.json(getErrorMessage('\'chaincodeName\''));
            return;
        }
        if (!channelName) {
            res.json(getErrorMessage('\'channelName\''));
            return;
        }
        if (!fcn) {
            res.json(getErrorMessage('\'fcn\''));
            return;
        }
        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        console.log('args==========', args);
        args = args.replace(/'/g, '"');
        args = JSON.parse(args);
        logger.debug(args);

        let response_payload = await qscc.qscc(channelName, chaincodeName, args, fcn, req.username, req.orgname);

        // const response_payload = {
        //     result: message,
        //     error: null,
        //     errorData: null
        // }

        res.send(response_payload);
    } catch (error) {
        const response_payload = {
            result: null,
            error: error.name,
            errorData: error.message
        }
        res.send(response_payload)
    }
});

app.get('/collection/:collectionName/user/history', async function(req, res){

    const collectionName = req.params.collectionName;

    if (req.username === adminUsername) {
        res.json({ success: false, message: "Permission denied."});
        return;
    }

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        const query = {user: req.username};
        dbo.collection(collectionName).find(query).toArray(function(err, result) {
            if (err) {
                console.log(err);
                res.json({ success: false, message: err});
            }
            console.log(result);
            db.close();
            const response_payload = {
                result: result,
                error: null,
                errorData: null
            }
            console.log(response_payload);
    
            res.send(response_payload);
        });
    }); 

});

app.get('/batchSize', async function(req, res){

    const username = req.username;

    databaseCon.connect(
        function(err){
            if (err) {
                console.log(err);
                const response_payload = {
                    result: null,
                    error: err,
                    errorData:null
                }
                res.send(response_payload)
                return;
            }
            console.log("Connected to database.");
            const sql = "SELECT * FROM organizations WHERE `username` = '" + username + "'";
            databaseCon.query(sql, async function (err, result) {

                if (err) {
                    console.log(err);
                    const response_payload = {
                        result: null,
                        error: err,
                        errorData:null
                    }
                    res.send(response_payload)
                    return;
                }

                var batchSize = result[0].batchSize;

               
                const response_payload = {
                    result: {
                        batchSize: batchSize
                    },
                    error: null,
                    errorData: null
                }
        
                res.send(response_payload); 



            });
        }
    );

});

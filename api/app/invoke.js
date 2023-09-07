const { Gateway, Wallets, TxEventHandler, GatewayOptions, DefaultEventHandlerStrategies, TxEventHandlerFactory } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')

const helper = require('./helper')

const createAsset = async (channelName, chaincodeName, username, org_name, id, assetType, tag, status, price, owner) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;
        result = await contract.submitTransaction("createAsset", id, assetType, tag, status, price, owner);
        
        message = `Successfully added the asset with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const createBulkAssets = async (channelName, chaincodeName, username, org_name, assetsIds, assetType, tag, status, price, owner) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;
        result = await contract.submitTransaction("createBulkAssets", assetsIds, assetType, tag, status, price, owner);
        
        message = `Successfully added the chicken asset with keys ${assetsIds}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const createBulkAssetsInBatch = async (channelName, chaincodeName, username, org_name, assetsIds, assetType, tag, status, price, owner, batchId) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;
        result = await contract.submitTransaction("createBulkAssetsInBatch", assetsIds, assetType, tag, status, price, owner, batchId);
        
        message = `Successfully added the batch asset with key ${batchId}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const buyToken = async (channelName, chaincodeName, username, org_name, user, price) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("BuyToken", user, price);
        message = `Transacion successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const transferToken = async (channelName, chaincodeName, username, org_name, sender, receiver, amount) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("transferToken", sender, receiver, amount);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const putAttr = async (channelName, chaincodeName, username, org_name, id, key, value, instruction) => {
    try {
        
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("PutAttribute", id, key, value, instruction, username);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const putAttrForAssetsInBatch = async (channelName, chaincodeName, username, org_name, batchId, key, value, instruction) => {
    try {
        
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("PutAttributeForAssetsInBatch", batchId, key, value, instruction, username);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const changeAssetOwner = async (channelName, chaincodeName, username, org_name, id, owner, newOwner) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("changeAssetOwner", id, owner, newOwner);
        message = `Successfully changed asset owner with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const takeDelivery = async (channelName, chaincodeName, username, org_name, id, buyer) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("takeDelivery", id, buyer);
        message = `Successfully changed asset owner with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const addLocalDC = async (channelName, chaincodeName, username, org_name, id, localDC) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("addLocalDeliveryCompany", id, localDC);
        message = `Successfully changed asset owner with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            status: 200,
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        let response = {
            status: 400,
            message: error.message
        }

        return response;

    }
}

const addGlobalDC = async (channelName, chaincodeName, username, org_name, id, globalDC) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("addGlobalDeliveryCompany", id, globalDC);
        message = `Successfully changed asset owner with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            status: 200,
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        let response = {
            status: 400,
            message: error.message
        }

        return response;

    }
}

// const changeAssetOwnerPhone = async (channelName, chaincodeName, username, org_name, id, owner, newOwner) => {
//     try {
//         logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

//         const ccp = await helper.getCCP(org_name) 

//         // Create a new file system based wallet for managing identities.
//         const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         console.log(`Wallet path: ${walletPath}`);

//         // Check to see if we've already enrolled the user.
//         let identity = await wallet.get(username);
//         if (!identity) {
//             console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
//             await helper.getRegisteredUser(username, org_name, true)
//             identity = await wallet.get(username);
//             console.log('Run the registerUser.js application before retrying');
//             return;
//         }

//         const connectOptions = {
//             wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
//             eventHandlerOptions: {
//                 commitTimeout: 100,
//                 strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
//             }
//         }

//         // Create a new gateway for connecting to our peer node.
//         const gateway = new Gateway();
//         await gateway.connect(ccp, connectOptions);

//         // Get the network (channel) our contract is deployed to.
//         const network = await gateway.getNetwork(channelName);

//         const contract = network.getContract(chaincodeName);

//         let result
//         let message;

//         result = await contract.submitTransaction("changeAssetOwnerPhone", id, owner, newOwner);
//         message = `Successfully changed asset owner with key ${id}`

//         await gateway.disconnect();

//         result = JSON.parse(result.toString());

//         let response = {
//             message: message,
//             body: result
//         }

//         return response;


//     } catch (error) {

//         console.log(`Getting error: ${error}`)
//         return error.message

//     }
// }

const changeAssetStatus = async (channelName, chaincodeName, username, org_name, id, owner, status) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("changeAssetStatus", id, owner, status);
        message = `Successfully changed asset status with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const changeStatusForAssetsInBatch = async (channelName, chaincodeName, username, org_name, id, owner, status) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("changeStatusForAssetsInBatch", id, owner, status);
        message = `Successfully changed asset status with key ${id}`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

// const sendToShop = async (channelName, chaincodeName, username, org_name, id, owner, price) => {
//     try {
//         logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

//         const ccp = await helper.getCCP(org_name) 

//         // Create a new file system based wallet for managing identities.
//         const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         console.log(`Wallet path: ${walletPath}`);

//         // Check to see if we've already enrolled the user.
//         let identity = await wallet.get(username);
//         if (!identity) {
//             console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
//             await helper.getRegisteredUser(username, org_name, true)
//             identity = await wallet.get(username);
//             console.log('Run the registerUser.js application before retrying');
//             return;
//         }

//         const connectOptions = {
//             wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
//             eventHandlerOptions: {
//                 commitTimeout: 100,
//                 strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
//             }
//         }

//         // Create a new gateway for connecting to our peer node.
//         const gateway = new Gateway();
//         await gateway.connect(ccp, connectOptions);

//         // Get the network (channel) our contract is deployed to.
//         const network = await gateway.getNetwork(channelName);

//         const contract = network.getContract(chaincodeName);

//         let result
//         let message;

//         result = await contract.submitTransaction("sendToShop", id, owner, price);
//         message = `Successfully changed asset status with key ${id}`

//         await gateway.disconnect();

//         result = JSON.parse(result.toString());

//         let response = {
//             message: message,
//             body: result
//         }

//         return response;


//     } catch (error) {

//         console.log(`Getting error: ${error}`)
//         return error.message

//     }
// }

const setAssetPrice = async (channelName, chaincodeName, username, org_name, id, price) => {
    try {
        
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("setAssetPrice", id, price, username);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const setAssetPublicToSell = async (channelName, chaincodeName, username, org_name, id, owner, price, userType) => {
    try {
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("setAssetPublicToSell", id, owner, price, userType);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        console.log(`Getting error: ${error}`)
        return error.message

    }
}

const blockingToken = async (channelName, chaincodeName, username, org_name, customer) => {
    try {

        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;

        result = await contract.submitTransaction("blockingToken", customer );
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            staus: 200,
            message: message,
            result
        }

        return response;


    } catch (error) {
        let response = {
            staus: 400,
            message: error.message
        }
        console.log(`Getting error: ${error}`)
        return response;

    }
}

const sellAsset = async (channelName, chaincodeName, username, org_name, id, owner, customer, price, biders) => {
    try {
        
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;       

        result = await contract.submitTransaction("sellAsset", id, owner, customer, price, biders);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            status: 200,
            message: message,
            body: result
        }

        return response;


    } catch (error) {

        let response = {
            status: 400,
            message: error.message
        }

        return response;
        
    }
}

const putAssetsInBatch = async (channelName, chaincodeName, username, org_name, assetsIds, owner, batchId) => {
    try {
        
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;       

        result = await contract.submitTransaction("putAssetsInBatch", assetsIds, owner, batchId);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            staus: 200,
            message: message,
            result
        }

        return response;


    } catch (error) {

        let response = {
            staus: 400,
            message: error.message
        }

        return response;
        
    }
}

const removeAssetsFromBatch = async (channelName, chaincodeName, username, org_name, assetsIds, owner, batchId) => {
    try {
        
        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        
        const ccp = await helper.getCCP(org_name) 

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                strategy: DefaultEventHandlerStrategies.NETWORK_SCOPE_ALLFORTX
            }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        const contract = network.getContract(chaincodeName);

        let result
        let message;       

        result = await contract.submitTransaction("removeAssetsFromBatch", assetsIds, owner, batchId);
        message = `Transaction successful.`

        await gateway.disconnect();

        result = JSON.parse(result.toString());

        let response = {
            staus: 200,
            message: message,
            result
        }

        return response;


    } catch (error) {

        let response = {
            staus: 400,
            message: error.message
        }

        return response;
        
    }
}

exports.addLocalDC = addLocalDC;
exports.addGlobalDC = addGlobalDC;
exports.changeStatusForAssetsInBatch = changeStatusForAssetsInBatch;
exports.changeAssetOwner = changeAssetOwner;
exports.changeAssetStatus = changeAssetStatus;
exports.createAsset = createAsset;
exports.createBulkAssets = createBulkAssets;
exports.buyToken = buyToken;
exports.setAssetPublicToSell = setAssetPublicToSell;
exports.transferToken = transferToken;
exports.blockingToken = blockingToken;
exports.sellAsset = sellAsset;
exports.setAssetPrice = setAssetPrice;
exports.putAttr = putAttr;
exports.putAttrForAssetsInBatch = putAttrForAssetsInBatch;
exports.putAssetsInBatch = putAssetsInBatch;
exports.removeAssetsFromBatch = removeAssetsFromBatch;
// exports.changeAssetOwnerPhone = changeAssetOwnerPhone;
exports.createBulkAssetsInBatch = createBulkAssetsInBatch;
// exports.sendToShop = sendToShop;
exports.takeDelivery = takeDelivery

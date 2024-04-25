package main

import (
	"encoding/json"
    "fmt"
	"math/rand"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)


type MyChaincode struct {
	contractapi.Contract
}

// func (t *MyChaincode) Init(ctx contractapi.TransactionContextInterface) error {
// 	fmt.Println("Init")
// 	return nil
// }

// func (t *MyChaincode) Invoke(ctx contractapi.TransactionContextInterface) ([]byte, error) {
// 	function, _ := ctx.GetFunctionAndParameters()

// 	switch function {
// 	case "generateAssetID":
// 		return t.generateAssetID(ctx)
// 	default:
// 		return nil, fmt.Errorf("Invalid function name.")
// 	}
// }

func (s *MyChaincode) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

func (t *MyChaincode) selectRandomPeer(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	primary, err := ctx.GetStub().GetState("primary")

	if err != nil || primary == nil || len(primary) == 0 {
		peers, err := ctx.GetStub().GetPeers()
		if err != nil {
			return nil, fmt.Errorf("Error: %s", err.Error())
		}

		var peerNames []string
		for _, peer := range peers {
			peerNames = append(peerNames, peer.GetID())
		}

		rand.Seed(time.Now().UnixNano())
		selectedIndex := rand.Intn(len(peerNames))
		selectedPeer := peerNames[selectedIndex]

		if err := ctx.GetStub().PutState("primaryPeer", []byte(selectedPeer)); err != nil {
			return nil, fmt.Errorf("Error: %s", err.Error())
		}

		response, err := t.selectPrimaryPeer(ctx)
		if err != nil {
			return nil, fmt.Errorf("Error: %s", err.Error())
		}

		return []byte(fmt.Sprintf("Primary Peer: %s", selectedPeer)), response
	}

	return []byte(fmt.Sprintf("Primary already exists: %s", primary)), nil
}

func (t *MyChaincode) selectPrimaryPeer(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	primarypeers, err := ctx.GetStub().GetState("primaryPeer")
	if err != nil {
		return nil, fmt.Errorf("Error: %s", err.Error())
	}

	var primarypeerArray []string
	if err := json.Unmarshal(primarypeers, &primarypeerArray); err != nil {
		return nil, fmt.Errorf("Error: %s", err.Error())
	}

	countMap := make(map[string]int)

	for _, peer := range primarypeerArray {
		countMap[peer]++
	}

	var selectPrimary string
	maxCount := 0
	for peer, count := range countMap {
		if count > maxCount {
			selectPrimary = peer
			maxCount = count
		}
	}

	if err := ctx.GetStub().PutState("Primary", []byte(selectPrimary)); err != nil {
		return nil, fmt.Errorf("Error: %s", err.Error())
	}

	return []byte(fmt.Sprintf("Primary Peer: %s", selectPrimary)), nil
}

func (t *MyChaincode) generateAssetID(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	peerID, err := ctx.GetStub().GetCreator()
	if err != nil {
		return nil, fmt.Errorf("Error: %s", err.Error())
	}

	primaryPeerBytes, err := t.selectRandomPeer(ctx)
    if err != nil {
        return nil, fmt.Errorf("Error: %s", err.Error())
    }

    primaryPeerString := string(primaryPeerBytes)

    isPrimaryPeer := string(peerID) == primaryPeerString
	// isPrimaryPeer, err := (string(peerID) == selectRandomPeer(ctx))
	// if err != nil {
	// 	return nil, fmt.Errorf("Error: %s", err.Error())
	// }

	if isPrimaryPeer {
		assetID := t.generateRandomID()
		if err := ctx.GetStub().PutState("assetID", []byte(assetID)); err != nil {
			return nil, fmt.Errorf("Error: %s", err.Error())
		}

		return []byte(fmt.Sprintf("Generated Asset ID: %s", assetID)), nil
	} else {
		assetID, err := t.getAssetID(ctx)
		if err != nil {
			return nil, fmt.Errorf("Error: %s", err.Error())
		}

		return []byte(fmt.Sprintf("Current Asset ID: %s", assetID)), nil
	}
}

func (t *MyChaincode) getAssetID(ctx contractapi.TransactionContextInterface) (string, error) {
	assetIDBytes, err := ctx.GetStub().GetState("assetID")
	if err != nil {
		return "", fmt.Errorf("Error: %s", err.Error())
	}

	return string(assetIDBytes), nil
}

func (t *MyChaincode) generateRandomID() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%d", rand.Intn(1001)+1000)
}

// func (t *MyChaincode) isPrimaryPeer(ctx contractapi.TransactionContextInterface, peerID []byte) (bool, error) {
// 	randomPeer, err := t.selectRandomPeer(ctx)
// 	if err != nil {
// 		return false, fmt.Errorf("Error: %s", err.Error())
// 	}

// 	return string(peerID) == string(randomPeer), nil
// }

func main() {
	chaincode, err := contractapi.NewChaincode(new(MyChaincode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}

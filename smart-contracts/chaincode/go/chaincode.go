package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"math/rand"
	"strconv"
	"strings"
	"time"
)

type SmartContract struct {
	contractapi.Contract
}

type Attribute struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	Instruction string `json:"instruction"`
}

type Asset struct {
	Id           string      `json:"id"`
	SerialNumber string      `json:"SerialNumber"`
	Type         string      `json:"type"`
	Tag          string      `json:"tag"`
	Status       string      `json:"status"`
	Price        float64     `json:"price"`
	Parent       string      `json:"parent"`
	Owner        string      `json:"owner"`
	Attrs        []Attribute `json:"attrs"`
	Temperature  int         `json:"temperature"`
	Humidity     float64     `json:"humidity"`
	Alert        bool        `json:"alert"`
	ForSale      bool        `json:"forSale"`
	TxType       string      `json:"txType"`
	ChildesCount int         `json:"childesCount"`
	Buyer        string      `json:"buyer"`
	LocalDC      string      `json:"localDC"`
	GlobalDC     string      `json:"globalDC"`
}

type HistoryModel struct {
	TxId      string `json:"txId"`
	Asset     *Asset `json:"asset"`
	Timestamp string `json:"timestamp"`
	IsDelete  bool   `json:"isDelete"`
}

type Token struct {
	Type        string  `json:"type"`
	User        string  `json:"user"`
	Amount      float64 `json:"amount"`
	BlockAmount float64 `json:"blockAmount"`
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

func (s *SmartContract) CreateAsset(ctx contractapi.TransactionContextInterface,
	id string, assetType string, tag string,
	status string, price float64, owner string) (*Asset, error) {

	attrs := []Attribute{}

	asset := Asset{Id: id, SerialNumber: "BC" + strconv.Itoa(rand.Intn(99999999-10000000)+10000000), Type: assetType, Tag: tag, Status: status, Price: price, Parent: owner, Owner: owner, Attrs: attrs, Temperature: -1, Humidity: 1.1, Alert: false, ForSale: false, TxType: "CreateAsset", ChildesCount: 0, Buyer: "", LocalDC: "", GlobalDC: ""}

	assetAsBytes, _ := json.Marshal(asset)
	err := ctx.GetStub().PutState(id, assetAsBytes)

	if err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return &asset, nil
}

func (s *SmartContract) CreateBulkAssets(ctx contractapi.TransactionContextInterface,
	assetsIds string, assetType string, tag string,
	status string, price float64, owner string) ([]Asset, error) {

	ids := strings.Split(assetsIds, "#")

	attrs := []Attribute{}

	result := []Asset{}

	for i := range ids {
		asset := Asset{Id: ids[i], SerialNumber: "AS" + strconv.Itoa(rand.Intn(99999999-10000000)+10000000), Type: assetType, Tag: tag, Status: status, Price: price, Parent: owner, Owner: owner, Attrs: attrs, Temperature: -1, Humidity: 1.1, Alert: false, ForSale: false, TxType: "CreateAsset", ChildesCount: 0, Buyer: "", LocalDC: "", GlobalDC: ""}
		assetAsBytes, _ := json.Marshal(asset)
		err := ctx.GetStub().PutState(ids[i], assetAsBytes)

		if err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		result = append(result, asset)

	}

	return result, nil
}

func (s *SmartContract) CreateBulkAssetsInBatch(ctx contractapi.TransactionContextInterface,
	assetsIds string, assetType string, tag string,
	status string, price float64, owner string, batchId string) (*Asset, error) {

	ids := strings.Split(assetsIds, "#")

	attrs := []Attribute{}
	batch := Asset{Id: batchId, SerialNumber: "BC" + strconv.Itoa(rand.Intn(99999999-10000000)+10000000), Type: "Batch", Tag: tag, Status: "", Price: 0.0, Parent: owner, Owner: owner, Attrs: attrs, Temperature: -1, Humidity: 1.1, Alert: false, ForSale: false, TxType: "CreateBatch", ChildesCount: len(ids), Buyer: "", LocalDC: "", GlobalDC: ""}

	batchAsBytes, _ := json.Marshal(batch)
	err := ctx.GetStub().PutState(batchId, batchAsBytes)

	if err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	for i := range ids {
		asset := Asset{Id: ids[i], SerialNumber: "CH" + strconv.Itoa(rand.Intn(99999999-10000000)+10000000), Type: assetType, Tag: tag, Status: status, Price: price, Parent: batchId, Owner: owner, Attrs: attrs, Temperature: -1, Humidity: 1.1, Alert: false, ForSale: false, TxType: "CreateAsset", ChildesCount: 0, Buyer: "", LocalDC: "", GlobalDC: ""}
		assetAsBytes, _ := json.Marshal(asset)
		err := ctx.GetStub().PutState(ids[i], assetAsBytes)

		if err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

	}

	return &batch, nil
}

func (s *SmartContract) QueryAsset(ctx contractapi.TransactionContextInterface, id string) (*Asset, error) {
	assetAsBytes, err := ctx.GetStub().GetState(id)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if assetAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", id)
	}

	asset := new(Asset)
	_ = json.Unmarshal(assetAsBytes, asset)

	return asset, nil
}

func (s *SmartContract) QueryAssetByOwner(ctx contractapi.TransactionContextInterface, id string, owner string) (*Asset, error) {
	assetAsBytes, err := ctx.GetStub().GetState(id)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if assetAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", id)
	}

	asset := new(Asset)
	_ = json.Unmarshal(assetAsBytes, asset)

	if asset.Owner == owner && asset.Parent == owner {
		return asset, nil
	}

	return nil, fmt.Errorf("Permission denied.")

}

func (s *SmartContract) QueryToken(ctx contractapi.TransactionContextInterface, user string) (*Token, error) {
	tokenAsBytes, err := ctx.GetStub().GetState(user)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if tokenAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", user)
	}

	token := new(Token)
	_ = json.Unmarshal(tokenAsBytes, token)

	return token, nil
}

func (s *SmartContract) BuyToken(ctx contractapi.TransactionContextInterface, user string, amount float64) (*Token, error) {
	tokenAsBytes, err := ctx.GetStub().GetState(user)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if tokenAsBytes == nil {

		token := Token{Type: "Token", User: user, Amount: amount, BlockAmount: 0.0}
		tokenAsBytes, _ := json.Marshal(token)
		err := ctx.GetStub().PutState(user, tokenAsBytes)
		if err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		return &token, nil

	} else {
		token := new(Token)
		_ = json.Unmarshal(tokenAsBytes, token)

		token.Amount = token.Amount + amount

		_tokenAsBytes, _ := json.Marshal(token)

		_err := ctx.GetStub().PutState(user, _tokenAsBytes)

		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		return token, nil
	}

}

func (s *SmartContract) TransferToken(ctx contractapi.TransactionContextInterface,
	sender string, receiver string, amount float64) (*Token, error) {
	sender_token, err := s.QueryToken(ctx, sender)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	receiver_token, err := s.QueryToken(ctx, receiver)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if sender_token.Amount >= amount {
		sender_token.Amount = sender_token.Amount - amount
		receiver_token.Amount = receiver_token.Amount + amount
		rtAsBytes, _ := json.Marshal(receiver_token)
		_err := ctx.GetStub().PutState(receiver, rtAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		stAsBytes, _ := json.Marshal(sender_token)
		_err_ := ctx.GetStub().PutState(sender, stAsBytes)
		if _err_ != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}

	return sender_token, nil
}

func (s *SmartContract) QueryAllAssets(ctx contractapi.TransactionContextInterface) ([]Asset, error) {
	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		results = append(results, *asset)

	}

	return results, nil
}

func (s *SmartContract) QueryAssetsByLD(ctx contractapi.TransactionContextInterface, owner string) ([]Asset, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.LocalDC == owner && (asset.Parent == asset.Owner) && asset.Status == "ReadyToGlobalDelivery" {
			results = append(results, *asset)
		}

	}

	return results, nil
}

func (s *SmartContract) QueryAssetsByGD(ctx contractapi.TransactionContextInterface, owner string) ([]Asset, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.GlobalDC == owner && (asset.Parent == asset.Owner) {
			results = append(results, *asset)
		}

	}

	return results, nil
}

func (s *SmartContract) QueryAssetsByOwner(ctx contractapi.TransactionContextInterface, owner string) ([]Asset, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.Owner == owner && asset.Parent == owner {
			results = append(results, *asset)
		}

	}

	return results, nil
}

func (s *SmartContract) QueryAssetsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]Asset, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.Status == status && (asset.Parent == asset.Owner) {
			results = append(results, *asset)
		}

	}

	return results, nil
}

func (s *SmartContract) QueryAssetsByBuyer(ctx contractapi.TransactionContextInterface, buyer string) ([]Asset, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.Buyer == buyer && (asset.Parent == asset.Owner) {
			results = append(results, *asset)
		}

	}

	return results, nil
}

func (s *SmartContract) GetAssetsOfBatch(ctx contractapi.TransactionContextInterface, batchId string, owner string) ([]Asset, error) {

	batchAsBytes, err := ctx.GetStub().GetState(batchId)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if batchAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", batchId)
	}

	batch := new(Asset)
	_ = json.Unmarshal(batchAsBytes, batch)

	if batch.Owner == owner {
		startKey := ""
		endKey := ""

		resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

		if err != nil {
			return nil, err
		}
		defer resultsIterator.Close()

		results := []Asset{}

		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()

			if err != nil {
				return nil, err
			}

			asset := new(Asset)
			_ = json.Unmarshal(queryResponse.Value, asset)

			if asset.Parent == batchId {
				results = append(results, *asset)
			}

		}
		return results, nil
	} else {
		return nil, fmt.Errorf("Permission denied.")
	}

}

func (s *SmartContract) QueryPublicAssets(ctx contractapi.TransactionContextInterface) ([]Asset, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []Asset{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.ForSale == true {
			results = append(results, *asset)
		}

	}

	return results, nil
}

func (t *SmartContract) GetAssetHistory(ctx contractapi.TransactionContextInterface, id string) ([]HistoryModel, error) {

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return nil, err
	}

	defer resultsIterator.Close()

	results := []HistoryModel{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		historyItem := HistoryModel{
			TxId:      queryResponse.TxId,
			Asset:     asset,
			Timestamp: time.Unix(queryResponse.Timestamp.Seconds, int64(queryResponse.Timestamp.Nanos)).String(),
			IsDelete:  queryResponse.IsDelete}
		results = append(results, historyItem)
	}

	return results, nil

}

func (s *SmartContract) PutAttribute(ctx contractapi.TransactionContextInterface,
	id string, key string, value string, instruction string, owner string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	if asset.Owner == owner {
		attrs := asset.Attrs
		attrs = append(attrs, Attribute{Key: key, Value: value, Instruction: instruction})
		asset.Attrs = attrs
		asset.TxType = "PutAttr"
	}

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) PutTemperature(ctx contractapi.TransactionContextInterface,
	id string, temperature int) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	asset.Temperature = temperature
	if temperature < 0 || temperature > 25 {
		asset.Alert = true
	}
	asset.TxType = "PutTemperature"

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) PutHumidity(ctx contractapi.TransactionContextInterface,
	id string, humidity float64) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	asset.Humidity = humidity
	if humidity < 0.2 || humidity > 0.6 {
		asset.Alert = true
	}
	asset.TxType = "PutHumidity"

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) PutAttributeForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, key string, value string, instruction string, owner string) ([]Asset, error) {

	assets, err := s.GetAssetsOfBatch(ctx, batchId, owner)

	if err != nil {
		return nil, err
	}

	attr := Attribute{Key: key, Value: value, Instruction: instruction}
	result := []Asset{}

	for i := range assets {
		asset := assets[i]
		attrs := asset.Attrs
		attrs = append(attrs, attr)
		asset.Attrs = attrs
		asset.TxType = "PutAttr"
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) ChangeStatusForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, owner string, status string) ([]Asset, error) {

	assets, err := s.GetAssetsOfBatch(ctx, batchId, owner)

	if err != nil {
		return nil, err
	}

	result := []Asset{}

	for i := range assets {
		asset := assets[i]
		asset.Status = status
		asset.TxType = "ChangeStatus"
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) ChangeOwnerForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, owner string, newOwner string, txType string) ([]Asset, error) {

	assets, err := s.GetAssetsOfBatch(ctx, batchId, owner)

	if err != nil {
		return nil, err
	}

	result := []Asset{}

	for i := range assets {
		asset := assets[i]
		asset.Owner = newOwner
		asset.TxType = txType
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) TakeDeliveryForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, owner string, buyer string) ([]Asset, error) {

	assets, err := s.GetAssetsOfBatch(ctx, batchId, owner)

	if err != nil {
		return nil, err
	}

	result := []Asset{}

	for i := range assets {
		asset := assets[i]
		asset.Owner = buyer
		asset.TxType = "TakeDelivery"
		asset.Status = "Delivered"
		asset.Price = 0.0
		asset.Buyer = ""
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) AddBuyerForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, owner string, buyer string, price float64) ([]Asset, error) {

	assets, err := s.GetAssetsOfBatch(ctx, batchId, owner)

	if err != nil {
		return nil, err
	}

	result := []Asset{}

	for i := range assets {
		asset := assets[i]
		asset.Buyer = buyer
		asset.TxType = "SellAsset"
		asset.ForSale = false
		asset.Price = price
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) AddLocalDCForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, localDC string) ([]Asset, error) {

	startKey := ""
	endKey := ""
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()
	assets := []Asset{}
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.Parent == batchId {
			assets = append(assets, *asset)
		}
	}
	result := []Asset{}
	for i := range assets {
		asset := assets[i]
		asset.LocalDC = localDC
		asset.Status = "LocalDelivery"
		asset.TxType = "AddLocalDC"
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) AddGlobalDCForAssetsInBatch(ctx contractapi.TransactionContextInterface,
	batchId string, globalDC string) ([]Asset, error) {

	startKey := ""
	endKey := ""
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()
	assets := []Asset{}
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		asset := new(Asset)
		_ = json.Unmarshal(queryResponse.Value, asset)

		if asset.Parent == batchId {
			assets = append(assets, *asset)
		}
	}

	result := []Asset{}

	for i := range assets {
		asset := assets[i]
		asset.GlobalDC = globalDC
		asset.Status = "GlobalDelivery"
		asset.TxType = "AddGlobalDC"
		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(asset.Id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
		result = append(result, asset)
	}

	return result, nil

}

func (s *SmartContract) ChangeAssetOwner(ctx contractapi.TransactionContextInterface,
	id string, owner string, newOwner string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	if asset.Owner == owner {

		if asset.Type == "Batch" {
			_, __err := s.ChangeOwnerForAssetsInBatch(ctx, id, owner, newOwner, "ChangeOwner")
			if __err != nil {
				return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
			}
		}

		asset.Owner = newOwner
		asset.Parent = newOwner
		asset.TxType = "ChangeOwner"
	}

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) TakeDelivery(ctx contractapi.TransactionContextInterface,
	id string, buyer string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	if asset.Buyer == buyer {

		customer_token, err := s.QueryToken(ctx, buyer)

		if err != nil {
			return nil, err
		}

		customer_token.BlockAmount = customer_token.BlockAmount - 10
		customer_token.Amount = customer_token.Amount + 10
		cTokenAsBytes, _ := json.Marshal(customer_token)
		_err_ := ctx.GetStub().PutState(buyer, cTokenAsBytes)
		if _err_ != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		if asset.Type == "Batch" {
			_, __err := s.TakeDeliveryForAssetsInBatch(ctx, id, asset.Owner, buyer)
			if __err != nil {
				return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
			}
		}

		asset.Owner = buyer
		asset.Parent = buyer
		asset.TxType = "TakeDelivery"
		//		asset.Status = "Delivered"
		asset.Price = 0.0
		asset.Buyer = ""
	}

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) AddLocalDeliveryCompany(ctx contractapi.TransactionContextInterface,
	id string, localDC string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	asset.LocalDC = localDC
	asset.Status = "LocalDelivery"
	asset.TxType = "AddLocalDC"

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	if asset.Type == "Batch" {
		_, __err := s.AddLocalDCForAssetsInBatch(ctx, id, localDC)
		if __err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}

	return asset, nil

}

func (s *SmartContract) AddGlobalDeliveryCompany(ctx contractapi.TransactionContextInterface,
	id string, globalDC string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	asset.GlobalDC = globalDC
	asset.Status = "GlobalDelivery"
	asset.TxType = "AddGlobalDC"

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	if asset.Type == "Batch" {
		_, __err := s.AddGlobalDCForAssetsInBatch(ctx, id, globalDC)
		if __err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}
	}

	return asset, nil

}

func (s *SmartContract) ChangeAssetStatus(ctx contractapi.TransactionContextInterface,
	id string, owner string, status string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	asset.Status = status
	asset.TxType = "ChangeStatus"

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) SetAssetPrice(ctx contractapi.TransactionContextInterface,
	id string, price float64, owner string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	if asset.Owner == owner {
		asset.Price = price
		asset.TxType = "SetPrice"
		assetAsBytes, _ := json.Marshal(asset)

		_err := ctx.GetStub().PutState(id, assetAsBytes)

		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		return asset, nil
	} else {
		return nil, fmt.Errorf("You are not owner of this asset")
	}

}

func (s *SmartContract) SetAssetPublicToSell(ctx contractapi.TransactionContextInterface,
	id string, owner string, price float64, userType string) (*Asset, error) {
	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	if userType != "Warehouse" {
		return nil, fmt.Errorf("Permission denied. %s", err.Error())
	}

	if asset.Owner == owner && asset.Parent == owner {
		asset.ForSale = true
		asset.Price = price
		asset.TxType = "SetAssetPublic"
	}

	assetAsBytes, _ := json.Marshal(asset)

	_err := ctx.GetStub().PutState(id, assetAsBytes)

	if _err != nil {
		return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
	}

	return asset, nil

}

func (s *SmartContract) BlockingToken(ctx contractapi.TransactionContextInterface,
	customer string) (*Token, error) {
	token, err := s.QueryToken(ctx, customer)

	if err != nil {
		return nil, err
	}

	if token.Amount >= 10 {
		token.Amount = token.Amount - 10
		token.BlockAmount = token.BlockAmount + 10
		tokenAsBytes, _ := json.Marshal(token)
		_err := ctx.GetStub().PutState(customer, tokenAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		return token, nil
	} else {
		return nil, fmt.Errorf("Insufficient balance. %s", err.Error())
	}

}

func (s *SmartContract) SellAsset(ctx contractapi.TransactionContextInterface,
	id string, owner string, customer string, price float64, biders string) (*Asset, error) {

	asset, err := s.QueryAsset(ctx, id)

	if err != nil {
		return nil, err
	}

	if asset.Owner == owner && asset.Parent == owner {

		asset.Buyer = customer
		asset.TxType = "SellAsset"
		asset.ForSale = false
		asset.Price = price

		assetAsBytes, _ := json.Marshal(asset)
		_err := ctx.GetStub().PutState(id, assetAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		if asset.Type == "Batch" {
			_, __err := s.AddBuyerForAssetsInBatch(ctx, id, owner, customer, price)
			if __err != nil {
				return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
			}
		}

		if biders != "" {
			bidersArr := strings.Split(biders, "#")

			for i := 0; i < len(bidersArr); i++ {

				token, err := s.QueryToken(ctx, bidersArr[i])
				token.BlockAmount = token.BlockAmount - 10
				token.Amount = token.Amount + 10
				tokenAsBytes, _ := json.Marshal(token)
				_err := ctx.GetStub().PutState(bidersArr[i], tokenAsBytes)
				if _err != nil {
					return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
				}

			}
		}

		return asset, nil

	} else {
		return nil, fmt.Errorf("You are not owner of this asset. %s", err.Error())
	}

}

func (s *SmartContract) PutAssetsInBatch(ctx contractapi.TransactionContextInterface,
	assetsIds string, owner string, batchId string) (*Asset, error) {

	batch, err := s.QueryAsset(ctx, batchId)

	if err != nil {
		return nil, err
	}

	if batch.Owner == owner {

		assetsArr := strings.Split(assetsIds, "#")
		for i := 0; i < len(assetsArr); i++ {
			asset, err := s.QueryAsset(ctx, assetsArr[i])
			if err != nil {
				return nil, err
			}
			if asset.Owner == owner && asset.Parent == owner {
				asset.Parent = batchId
				asset.TxType = "PutInBatch"
				assetAsBytes, _ := json.Marshal(asset)
				_err := ctx.GetStub().PutState(assetsArr[i], assetAsBytes)
				if _err != nil {
					return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
				}
				batch.ChildesCount = batch.ChildesCount + 1
			}
		}

		batch.TxType = "AddAssets"

		batchAsBytes, _ := json.Marshal(batch)
		_err := ctx.GetStub().PutState(batchId, batchAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		// _batch := new(Batch)
		// _ = json.Unmarshal(batchAsBytes, _batch)
		return batch, nil

	} else {
		return nil, fmt.Errorf("You are not owner of this asset. %s", err.Error())
	}

}

func (s *SmartContract) RemoveAssetsFromBatch(ctx contractapi.TransactionContextInterface,
	assetsIds string, owner string, batchId string) (*Asset, error) {

	batch, err := s.QueryAsset(ctx, batchId)

	if err != nil {
		return nil, err
	}

	if batch.Owner == owner {

		assetsArr := strings.Split(assetsIds, "#")
		for i := 0; i < len(assetsArr); i++ {
			asset, err := s.QueryAsset(ctx, assetsArr[i])
			if err != nil {
				return nil, err
			}
			if asset.Owner == owner && asset.Parent == batchId {
				asset.Parent = owner
				asset.TxType = "RemoveFromBatch"
				assetAsBytes, _ := json.Marshal(asset)
				_err := ctx.GetStub().PutState(assetsArr[i], assetAsBytes)
				if _err != nil {
					return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
				}
				batch.ChildesCount = batch.ChildesCount - 1
			}
		}

		batch.TxType = "RemoveAssets"

		batchAsBytes, _ := json.Marshal(batch)
		_err := ctx.GetStub().PutState(batchId, batchAsBytes)
		if _err != nil {
			return nil, fmt.Errorf("Failed to put to world state. %s", err.Error())
		}

		// _batch := new(Batch)
		// _ = json.Unmarshal(batchAsBytes, _batch)
		return batch, nil

	} else {
		return nil, fmt.Errorf("You are not owner of this asset. %s", err.Error())
	}

}

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting broilerChickenCC Smart Contract: %s", err.Error())
	}

}

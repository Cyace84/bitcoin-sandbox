#!/bin/sh
# bitcoin-request.sh

perform_rpc_call() {
  curl -s --user bitcoinrpc:bitcoinrpcTest --data-binary "{\"jsonrpc\": \"1.0\", \"id\":\"curltest\", \"method\": \"$1\", \"params\": $2 }" -H 'content-type: text/plain;' http://bitcoin-node:18443/
}

echo "Awaiting Bitcoin node to start..."
sleep 10


echo "Creating wallet 'faucet'..."
perform_rpc_call "createwallet" "[\"faucet\", false, false, \"faucet\", false, true]"


echo "Getting new address from wallet 'faucet'..."
new_address=$(perform_rpc_call "getnewaddress" "[]" | jq -r '.result')
echo "New address for mining: $new_address"


echo "Generating 101 blocks..."
perform_rpc_call "generatetoaddress" "[101, \"$new_address\"]"

while true; do
  perform_rpc_call "getblockchaininfo" "[]"
  sleep 1
done

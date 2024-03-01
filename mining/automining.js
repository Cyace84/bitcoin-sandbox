const express = require("express");
const { RPCClient } = require("rpc-bitcoin");
const fs = require("fs");

const url = "http://bitcoin-node";
const user = "testbitcoinrpc";
const pass = "testBitcoinRpc";
const port = 18443;
const timeout = 10000;
const client = new RPCClient({ url, port, timeout, user, pass });

async function main() {
  let address;

  try {
    try {
      address = fs.readFileSync(
        "/data/faucet.txt",
        "utf8",
        async function (err, data) {
          if (err) throw err;

          console.log("Loaded address", address);
        }
      );
    } catch (e) {
      console.log(e);
      address = undefined;
    }

    console.log("Loaded address", address);

    if (!address || address.length === 0) {
      console.log(21312312, "Creating new wallet and address...");
      await client.createwallet({
        wallet_name: "miner",
        passphrase: "miner",
        avoid_reuse: false,
        disable_private_keys: false,
        blank: false,
      });
      await client.createwallet({
        wallet_name: "faucet",
        passphrase: "faucet",
        avoid_reuse: false,
        disable_private_keys: false,
        blank: false,
      });

      const address = await client.getnewaddress(
        { address_type: "bech32" },
        "faucet"
      );

      fs.writeFile("/data/faucet.txt", address, function (err) {
        if (err) throw err;
        console.log("Адрес сохранен");
      });
    }
  } catch (e) {
    console.log(e);
  }

  const blocks = await client.getblockcount();

  console.log(address);
  if (blocks < 101) {
    console.log("Generating 101 blocks");
    try {
      await client.generatetoaddress({ address, nblocks: 101 }, address);
    } catch (e) {
      console.log(e);
    }
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (true) {
    try {
      const block = await client.generatetoaddress(
        { address, nblocks: 1 },
        address
      );
      console.log(`Generated block: ${block} at ${new Date()}`);
      await sleep(5000);
    } catch (e) {
      await sleep(5000);
      console.log(e);
    }
  }
}

main();

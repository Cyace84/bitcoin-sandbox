const { RPCClient } = require("rpc-bitcoin");
const fs = require("fs");
const express = require("express");

const app = express();
const port = 31443;

const url = "http://bitcoin-node";

const user = "testbitcoinrpc";
const pass = "testBitcoinRpc";
const rpcPort = 18443;
const timeout = 10000;
const client = new RPCClient({ url, port: rpcPort, timeout, user, pass });

async function getOrCreateAddress() {
  try {
    let address = fs.readFileSync("faucet.txt", "utf8");

    if (!address || address.length === 0) {
      throw new Error("Empty address");
    }
    console.log("Loaded address:", address);
    return address;
  } catch (err) {
    console.log("Creating new wallet and address...");

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
    fs.writeFileSync("faucet.txt", address);
    console.log("Address saved:", address);
    return address;
  }
}

async function generateBlocks(address, count) {
  console.log(`Generating ${count} blocks`);
  const block = await client.generatetoaddress({
    nblocks: count,
    address: address,
  });
  console.log(`Generated block: ${block} at ${new Date()}`);
}

app.get("/mine/:blocks", async (req, res) => {
  const blocks = parseInt(req.params.blocks, 10);
  if (isNaN(blocks) || blocks <= 0) {
    return res.status(400).send("Invalid number of blocks requested.");
  }

  try {
    const address = await getOrCreateAddress();
    await generateBlocks(address, blocks);
    res.send(`Successfully generated ${blocks} blocks`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error generating blocks.");
  }
});

app.listen(port, async () => {
  const address = await getOrCreateAddress().catch((e) => console.error(e));

  const blocks = await client.getblockcount();

  if (blocks < 101) {
    console.log("Generating 101 blocks");
    await client
      .generatetoaddress({ address, nblocks: 101 }, address)
      .catch((e) => console.error(e));
  }

  console.log(`Mining server listening at http://localhost:${port}`);
});

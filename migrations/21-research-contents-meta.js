require("babel-core/register")({
  "presets": [
    ["env", {
      "targets": {
        "node": true
      }
    }]
  ]
});
const config = require('./../config');

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const ResearchContent = require('./../schemas/researchContent');
const TenantProfile = require ('./../schemas/tenant');

const deipRpc = require('@deip/rpc-client');
const crypto = require('crypto');

deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);

const run = async () => {

  const researchContentsPromises = [];
  const chainResearchContents = await deipRpc.api.lookupResearchContentsAsync(0, 10000);
  
  for (let i = 0; i < chainResearchContents.length; i++) {
    const chainResearchContent = chainResearchContents[i];

    const researchContentRef = await ResearchContent.findOne({ _id: chainResearchContent.external_id });

    const title = researchContentRef.title;

    const meta = { title: title };
    const hash = crypto.createHash('sha256').update(JSON.stringify(meta)).digest("hex");

    console.log({ id: chainResearchContent.external_id, hash, title });

    // researchContentsPromises.push(researchContentRef.save());
  }

  await Promise.all(researchContentsPromises);

};


run()
  .then(() => {
    console.log('Successfully finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });


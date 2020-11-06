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
const TenantProfile = require('./../schemas/tenant');
const Research = require('./../schemas/research');

const deipRpc = require('@deip/rpc-client');
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {
  const DISCIPLINES_LIST = "disciplines-list";

  const tenant = await TenantProfile.findOne({ _id: "0000000000000000000000000000000000000000" });

  if (tenant) {

    let categoriesAttr = tenant.settings.researchAttributes.find(attr => attr.type == DISCIPLINES_LIST && attr.title == "TTO Categories");
    let disciplinesAttr = tenant.settings.researchAttributes.find(attr => attr.type == DISCIPLINES_LIST && attr.title == "ORIP Disciplines");

    const researchPromises = [];
    const researches = await Research.find({});

    for (let i = 0; i < researches.length; i++) {
      let research = researches[i];

      let categoriesA = research.attributes.find(a => a.researchAttributeId.toString() == categoriesAttr._id.toString());
      let disciplinesA = research.attributes.find(a => a.researchAttributeId.toString() == disciplinesAttr._id.toString());

      if (disciplinesA && !categoriesA) {
        research.attributes = research.attributes.filter(a => a.researchAttributeId.toString() != disciplinesAttr._id.toString());
        research.attributes.push({
          value: disciplinesA.value.external_id,
          researchAttributeId: categoriesAttr._id
        })
      }

      let researchGroupAttr = tenant.settings.researchAttributes.find(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP);
      let researchGroupA = research.attributes.find(a => a.researchAttributeId.toString() == researchGroupAttr._id.toString());

      if (researchGroupA) {
        research.attributes = research.attributes.filter(a => a.researchAttributeId.toString() != researchGroupAttr._id.toString());
        research.attributes.push({
          value: researchGroupA.value.external_id,
          researchAttributeId: researchGroupAttr._id
        })
      }
      
      researchPromises.push(research.save());
    }

    tenant.settings.researchAttributes = tenant.settings.researchAttributes.filter(attr => attr.title != "ORIP Disciplines");

    await tenant.save();
    await Promise.all(researchPromises);
  }
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



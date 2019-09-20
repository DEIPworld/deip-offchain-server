require("babel-core/register")({
  "presets": [
      ["env", {
          "targets": {
              "node": true
          }
      }]
  ]
});

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = require('./../config');

mongoose.connect(config.mongo['deip-server'].connection);

const UserProfile = require('./../schemas/user');
const stripeService = require('./../services/stripe').default;
const subscriptionsService = require('./../services/subscriptions').default;

const run = async () => {
  const users = await UserProfile.find({
    stripeSubscriptionId: { $exists: true, $ne: null }
  }, { stripeSubscriptionId: 1 }, { lean: true });

  await bluebird.map(users, async ({ stripeSubscriptionId }) => {
    const stripeSubscription = await stripeService.findSubscription(stripeSubscriptionId);
    if (
      stripeSubscription
      && ['active', 'past_due', 'trialing'].includes(stripeSubscription.status)
      && !stripeSubscription.metadata.availableContractsBySubscription
    ) {
      await subscriptionsService.setSubscriptionCounters(stripeSubscriptionId, {
        contracts: 10,
        filesShares: 50,
      })
    }
  }, { concurrency: 50 })
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
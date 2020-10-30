const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { Lilu } = require('../dist/lilu.cjs.js');

const user = {
  id: 1,
  name: 'Andrew L.',
  email: 'andrew.io.dev@gmail.com',
  role: ['ROLE_USER']
};

const order = {
  title: 'Netflix Subscription',
  owner: 1,
  placedAt: new Date(),
  items: [1, 2, 3, 4]
};

const lilu = new Lilu({
  strict: true,
  enviroment: {
    env: {
      // The enviroment properties support getter function
      now: () => Date.now(),
    },

    // Define user globally
    user: user
  },
  permissions: fetchYAML('./_permissions.yml').permissions
});

lilu.grantedMany('order.*', { user, order }, function(err, result) {
  if (err) {
    console.warn('Failed to process lilu access', err);
    return;
  }

  const allow = result.allow
    .map(v => v.permission.actions)
    .flat();

  const disallow = result.disallow
    .map(v => v.permission.actions)
    .flat();

  console.log({ allow, disallow });
});

function fetchYAML(filePath) {
  const doc = yaml.safeLoad(fs.readFileSync(path.join(__dirname, filePath), 'utf8'));

  return doc;
}

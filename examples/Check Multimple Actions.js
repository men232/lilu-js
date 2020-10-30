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
  placedAt: new Date('2020-07-09'),
  items: [1, 2, 3, 4]
};

const permissions = [{
  title: 'Review Order',
  actions: ['order.view'],
  rules: [{
    title: 'Owned',
    operation: 'AND',
    conditions: [
      'order.owner == user.id'
    ]
  }]
}, {
  title: 'Delete Order',
  actions: ['order.delete'],
  rules: [{
    title: 'Owned',
    operation: 'AND',
    conditions: [
     'order.owner == user.id'
    ]
  }, {
    title: 'Recently Placed',
    operation: 'AND',
    conditions: [
      // We use expression subtract 5 days from now
      'order.placedAt > {{ env.now - (1000 * 60 * 60 * 24 * 5) }}'
    ]
  }]
}];

const lilu = new Lilu({
  strict: false,
  enviroment: {
   // The enviroment properties support async getter function
   // also we can define user globally.
    env: {
      now: () => Date.now()
    },
    user: user
  },
  permissions: permissions
});


lilu.grantedMany(['order.view', 'order.delete'], { order }, function(err, result) {
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

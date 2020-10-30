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

const permissions = [{
  title: 'Delete Order',
  actions: ['order.delete'],
  rules: [{
    title: 'Owned & Recently Placed',
    operation: 'AND',
    conditions: [
      // Just checking owning
     'order.owner == user.id',
     // We use expression subtract 5 days from now
     'order.placedAt > {{ env.now - (1000 * 60 * 60 * 24 * 5) }}'
    ]
  }]
}];

const lilu = new Lilu({
  strict: false,
  enviroment: {
    env: {
      // The enviroment properties support async getter function
      // Sync version
      now: () => Date.now(),

      // It will also works
      nowAsync: () => new Promise((resolve) => {
        setTimeout(() => resolve(Date.now()), 5000);
      })
    },

    // Define user globally
    user: user
  },
  permissions: permissions
});


lilu.granted('order.delete', { order })
  .then(result => {
    if (result.passed) {
      console.log('Yahu!!! I able to delete order.');
    } else {
      console.log('Oops!! I don\'t have access to delete order.');
    }
  })
  .catch(err => {
    console.warn('Failed to process lilu access', err);
  });

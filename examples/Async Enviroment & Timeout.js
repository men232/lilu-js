const { Lilu } = require('../dist/lilu.cjs.js');

// Simplate DB Interface
const Order = {
  count() {
    return new Promise((resolve) => {
      const delayMs = Math.random() * 5000;
      const result = 3;

      setTimeout(() => resolve(result), delayMs);
    });
  }
}

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
  title: 'Create Order',
  actions: ['order.create'],
  rules: [{
    title: 'Owned',
    operation: 'AND',
    conditions: [
      'userOrdersAmount < 5'
    ]
  }]
}];

const lilu = new Lilu({
  strict: false,
  enviroment: {
    // Define user globally
    user: user,

    // Some async staff
    userOrdersAmount: async function() {
      // take from env
      const userId = this.user.id;
      const amount = await Order.count({ _id: userId });

      return amount;
    }
  },
  permissions: permissions
});

// We need to pass order in context property now
lilu.granted('order.create', {
  context: { order },
  timeout: 3000
}).then(result => {
  if (result.passed) {
    console.log('Yahu!!! I able to create order.');
  } else {
    console.log('Oops!! I don\'t have access to create order.');
  }
}).catch(err => {
  console.warn('Failed to process lilu access', err.toString());
});

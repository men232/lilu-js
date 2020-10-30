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
  strict: false,
  permissions: [{
    title: 'Review Order',
    actions: ['order.view'],
    rules: [{
      title: 'Owned',
      operation: 'AND',
      conditions: [
        'order.owner == user.id',
      ]
    }]
  }]
});

lilu.granted('order.view', { user, order }, function(err, result) {
  if (err) {
    console.warn('Failed to process lilu access', err);
    return;
  }

  if (result.passed) {
    console.log('Yahu!!! I have access to review order.');
  } else {
    console.log('Oops!! I don\'t have access to review order.');
  }
});

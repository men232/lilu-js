![Image of Yaktocat](https://pbs.twimg.com/profile_images/901714986006970369/sQc7Guot_400x400.jpg)

`npm i @andrew_l/lilu`

# LiLu
Attribute-based access control with some sugar.

# Permissions example

```yaml
permissions:
- title: Any User
  actions: ['order.view', 'order.edit']
  rules:
  - title: 'Owned'
    operation: AND
    conditions:
    - order.owner == user.id

- title: Delete Order
  actions: ['order.delete']
  rules:
  - title: 'Owned'
    operation: AND
    conditions:
    - order.owner == user.id
  - title: 'Recently Placed'
    operation: AND
    conditions:
    - order.placedAt = {{ env.now - (1000 * 60 * 60 * 24 * 5) }}
```

# Usage
```js
import { Lilu } from 'lilu';

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

```

To investigate more use cases, please check [examples folder](examples).

## What is strict mode?
In this mode the module makes expression validation before granted function be called.
Also strict mode requires to pass all variables in context that used in rules conditions.

## Condition operators
|    | Description                                   |
|----|-----------------------------------------------|
| >  | Greater than                                  |
| => | Greater  or equal to                          |
| <  | Less than                                     |
| <= | Less  or equal to                             |
| == | Equal to                                      |
| != | Not equal to                                  |
| in | Value equals any value in the specified array |

## Context variables
Each time when you call granted function, you can pass the context of execution.
For example we need to make sure that user has admin role before delete the order.

### 1 • Our case have next permission rules.

```js
const permissions = {
  strict: false,
  permissions: [{
    title: 'Remove Order',
    actions: ['order.remove'],
    rules: [{
      title: 'Admin Access',
      operation: 'AND',
      conditions: [
        'user.roles in "ROLE_ADMIN"',
      ]
    }]
  }]
}
```

### 2 • We have next context.

```js
const context = {
  user: {
    name: 'Andrew',
    roles: ["ROLE_USER"]
  }
};
```

### 3 • Now we can use context to check access.

```js
const lilu = new Lilu({
  strict: false,
  permissions: permissions /* from step 1 */,
});

lilu.granted('order.remove', context /* from step 2 */, function(err, result) {
  if (err) {
    console.warn('Failed to process lilu access', err);
    return;
  }

  if (result.passed) {
    console.log('Yahu!!! I have access to delete order.');
  } else {
    console.log('Oops!! I don\'t have access to delete order.');
  }
});
```

### Rules operation
Our rules can be checked by follow operations:

|     | Description                         |
|-----|-------------------------------------|
| AND | Each rule conditions must be true   |
| OR  | Any of rule conditions must be true |

## Rules conditions
It's pretty simple js-like expression parser inside, just to give you ability to use plain string.

| Type           | Description                                                             | Example                                                   |
|----------------|-------------------------------------------------------------------------|-----------------------------------------------------------|
| Literal values | Support literal values like number and boolean.                         | `user.disabled == true`                                   |
| String         | Should be in double quotes.                                             | `user.name == "some text"`                                |
| Array          | Array expression should be in quotes. Also it support variables inside. | `user.roles in ["ROLE_USER", "ROLE_MANAGER"]`             |
| Expression     | You also can use native javascript expression in two curly quotes.      | `user.createdAt > {{ Date.now() - 1000 * 60 * 60 * 24 }}` |

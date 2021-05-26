# @br-fe/mocker

Mock server to get a unified solution to mocking data on fractal and vue.


### Installation

Install the module as a dependency in your project

```bash
npm install git+ssh://git@gitlab-cc.valtech.com:fedbr/mocker#master

# or

yarn add git+ssh://git@gitlab-cc.valtech.com:fedbr/mocker#master
```

### Basic structure

There are 3 basic objects exported by the module:
- [MockerServer](MockerServer.md) - Use to create the server and the mocked data
- [MockerClient](MockerClient.md) - Use with the vuex store to handle modules creation
- [MockerTest](MockerTest.md) - Use for testing

See each documentation the checkout detailed usage.

### What is happening under the hood

When created a new Mocker Application will register each service passed instantiating the MockerService class and storing it internally.

All the basic logic of seeding and requesting is done inside the MockerService and each service can be accessed as shown bellow.

```js
// ./mocker.js
const { MockerServer } = require('@br-fe/mocker/server')

const mocker = new MockerServer({
  services: {
    users: {
      schema: {
        name: { fakerType: 'internet.userName' },
        email: { fakerType: 'internet.email' }
      },
      total: 40
    }
  },
  debug: true
})

const userService = mocker.service('users')
```

The MockerService class expose 3 main functions:

| Name | Arguments | Returns |
|------|-----------|---------|
| find | `object` `{ limit, skip }` | `Promise(Object<{ total:Number, data:Array }>)`
| get  | `id <number>`  | `Promise(Object)`
| createStore  | `undefined`  | `VuexModule`


### Usage with fractal

```js
// ./fractal/users/users.config.js
const mocker = require('../../mocker')

module.exports = {
  context: {
    users: mocker.service('users').find({ limit: 5 }).then(res => res.data)
  }
}
```

```jsx
// ./fractal/users/users.hbs
<div class="users">
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>E-mail</th>
      </tr>
    </thead>
    <tbody>
      {{#each users }}
        <tr>
          <td>{{ id }}</td>
          <td>{{ name }}</td>
          <td>{{ email }}</td>
        </tr>
      {{/each}}
    </tbody>
  </table>
</div>

```

### Development

```bash
npm start

# or

yarn start
```

## Todo's
- [ ] Create tests
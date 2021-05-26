# MockerServer

Creates a server using [hapi](https://hapi.dev/){:target="_blank"} and generate sample data using [faker](https://github.com/marak/Faker.js/){:target="_blank"}.

### Usage

Create a `mocker.js` file in the root of the boilerplate.

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

module.exports = mocker
```

Import and run the server within a gulp task

```js
// ./gulp.js
const gulp = require('gulp')
const mocker = require('./mocker')
const fractal = require('./fractal')

...

gulp.task('start:server', () => {
  const server = fractal.web.server({
    port: 3000,
    sync: true
  })

  return Promise.all([mocker.start(), server.start()]).then(() => {
    console.log('UI server running on: http://localhost:3000')
    console.log('API server running on: http://localhost:3001')
  })
})

...
```

## API

#### Arguments (constructor)


| name | type | description | default |
|------|------|-------------|---------|
| host | `string` | host where the server will be created | `localhost`
| port | `string` `number` | port where the server will be listening | `3001`
| services | `object` | object where the `key` is the name of the service and the `value` is the [service options](#service-options) | `{}`
| servicePath | `string` | location of a folder with the services options as json files beeing the name o the file the name de service | `undefined`
| debug | `boolean` | manage debug mode | `false`


#### Service Options

| name | type | description | default |
|------|------|-------------|---------|
| schema | `object` | [schema](#schema) for the service model, will be used to generate mock data | `{}`
| total | `number` | number of items to be generated | `10`


#### Schema

| name | type | description | default |
|------|------|-------------|---------|
| type | `string` | type of the property, can be `string`, `number`, `array` or `object` | `string`
| fakerType | `string` | tells faker wich kind of faked method to use. check [faker docs](https://github.com/marak/Faker.js/#api-methods) to see all the possible values. values should be passed as dot notations Ex. `internet.email` | `lorem.text`
| total | `number` | pass this option only for types `array`, tells how many items to mock | `4`
| properties | `object` | pass this option only for types `array` (for an object array) or `object`, properties in a shcema like form to generate mock data. for an array of `objects` pass a string `object` into `fakerType` property | `{}`

**Example**

```json
// ./mocks/users.json
{
  "schema": {
    "name": {
      "fakerType": "internet.userName"
    },
    "email": {
      "fakerType": "internet.email"
    },
    "age": {
      "type": "number",
      "fakerType": "datatype.number"
    },
    "phones": {
      "type": "array",
      "total": 5,
      "fakerType": "phone.phoneNumber"
    },
    "address": {
      "type": "object",
      "properties": {
        "city": { "fakerType": "address.city" },
        "state": { "fakerType": "address.stateAbbr" },
      }
    },
    "friends": {
      "type": "array",
      "total": 4,
      "fakerType": "object",
      "properties": {
        "name": { "fakerType": "internet.userName" },
        "email": { "fakerType": "internet.email" },
      }
    },
  },
  "total": 40
}
```

## Possibilities

#### 1) Relational data

This module is built in a way that is possible to add relational data funcionality, to generate array of items based in another service's schema. This functionality was not implemented but if needed is easely done.
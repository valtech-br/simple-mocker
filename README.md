# @br-fe/mocker

Mock server to get a unified solution to mocking data on fractal and vue.


### Installation

Install the module as a dependency in your project

```bash
npm install git+ssh://git@gitlab-cc.valtech.com:gustavo.junqueira/mocker#master

# or

yarn add git+ssh://git@gitlab-cc.valtech.com:gustavo.junqueira/mocker#master
```

### Basic structure

There are 3 basic objects exported by the module:
- [MockerServer](MockerServer.md) - Use to create the server and the mocked data
- [MockerClient](MockerClient.md) - Use with the vuex store to handle modules creation
- [MockerTest](MockerTest.md) - Use for testing

### Development

```bash
npm start

# or

yarn start
```
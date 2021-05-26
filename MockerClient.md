# MockerClient

Configures the Vue store and create vuex modules for each service.

### Usage

Configure the store

```js
// store/index.js
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import axios from 'axios'
import { MockerClient } from '@br-fe/mocker/client'
import { MockerClient } from '@br-fe/mocker' // for webpack 4.0

// Configure the client
const mocker = new MockerClient({
  services: {
    users: {}
  },
  transport: axios // Pass axios as transport (required)
})

// Generate modules
const mockerModules = mocker.createVuexModules()

// Add the Vuex plugin.
Vue.use(Vuex)

export default new Store({
  modules: {
    // Import modules
    ...mockerModules
  }
})

```

Now at the component:

```vue
<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'users',
  created() {
    this.findItems({ limit: 6, skip: 0 })
  },
  computed: {
    ...mapState('users', ['items'])
  },
  methods: {
    ...mapActions('users', ['findItems'])
  }
}
</script>

<template>
  <div :class="['users']">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>E-mail</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in items" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

```

### Basic service store

```js
// self is the MockerService class object
{
  state: {
    items: [],
    total: 0,
    isFindPending: false,
    isGetPending: false
  },
  mutations: {
    ADD_ITEM_TO_STORE (state, item) {
      const exists = !!state.items.filter(i => i.id === item.id)[0]
      if (!exists) {
        state.items.push(item)
      }
    },
    UPDATE_TOTAL (state, total) {
      state.total = total
    },
    IS_FIND_PENDING (state) {
      state.isFindPending = true
    },
    FIND_FINISHED (state) {
      state.isFindPending = false
    },
    IS_GET_PENDING (state) {
      state.isGetPending = true
    },
    GET_FINISHED (state) {
      state.isGetPending = false
    }
  },
  actions: {
    findItems ({ commit }, { limit, skip }) {
      commit('IS_FIND_PENDING')
      return self.find({ limit, skip }).then(res => {
        commit('UPDATE_TOTAL', res.total)
        res.data.forEach(item => {
          commit('ADD_ITEM_TO_STORE', item)
        })
      }).finally(() => {
        commit('FIND_FINISHED')
      })
    },
    getItem (id) {
      commit('IS_GET_PENDING')
      return self.get(id).then(item => {
        commit('ADD_ITEM_TO_STORE', item)
      }).finally(() => {
        commit('GET_FINISHED')
      })
    }
  },
  getters: {
    getById: (state) => (id) => {
      return state.items.filter(item => item.id === id)[0]
    },
    findInStore: (state) => ({ limit = 4, skip = 0 }) => {
      return state.items.filter(item => item.id <= limit + skip && item.id > skip)
    }
  }
}
```

## API


#### Arguments (constructor)


| name | type | description | default |
|------|------|-------------|---------|
| host | `string` | host where the server will be created | `localhost`
| port | `string` `number` | port where the server will be listening | `3001`
| services | `object` | object where the `key` is the name of the service and the `value` is a empty object | `{}`
| transport | `axios` | transport to be used to make the server call, only `axios` is suported at the moment | `undefined`

## Issues

#### 1) Transport with other libraries (or the fetch api)
At the moment there is only support for axios, but this idea of injecting the transport on creation is to be expanded to other possible libraries, including the window fetch api

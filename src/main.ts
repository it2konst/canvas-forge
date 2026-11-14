import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18n } from './i18n'
import { vuetify } from './plugins/vuetify'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(vuetify)

app.mount('#app')

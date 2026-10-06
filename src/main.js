import { createSSRApp } from 'vue'
import App from './App.vue'
import './common/style.css'

export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}

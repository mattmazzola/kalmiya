import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'
import './index.css'

console.log(process.env)
ReactDOM.render(
  <App />,
  document.getElementById('root') as HTMLElement
)

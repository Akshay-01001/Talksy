import { useEffect } from 'react'
import './App.css'
import { io } from 'socket.io-client'

function App() {

  const socket = io('http://localhost:8000')

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  },[]);

  return (
    <div className='container'>
     Hello
    </div>
  )
}

export default App

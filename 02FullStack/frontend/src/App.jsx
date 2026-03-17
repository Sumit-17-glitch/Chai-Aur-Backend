import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { useEffect } from 'react'
import axios from 'axios'

function App() {
  const [jokes, setJokes] = useState([])

  useEffect(()=>{
    axios.get('/api/jokes')
    .then((res) => {
      setJokes(res.data);
    })
    .catch((e)=>{
      console.log(e);
    })
  })

  return (
    <>
      <div>
        hello world...!
      </div>
      <div>
        JOKES:{jokes.length}
        <div>
          {
          jokes.map((joke)=>{
            return(<div key={joke.id}>
              <h1>Title : {joke.title}</h1>
              <h3>Joke : {joke.joke}</h3>
            </div>)
            
          })
        }
        </div>
      </div>
    </>
  )
}

export default App

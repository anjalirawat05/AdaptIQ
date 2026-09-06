import React from 'react'
import { useState } from 'react'
import '../auth.form.scss'
import { useNavigate } from 'react-router-dom'
import {Link} from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const navigate = useNavigate();
  const {handleLogin, loading} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await handleLogin({email, password})
    if (result?.error) {
      setError(result.error)
      return
    }
    navigate('/')
  }
  if (loading) {
    
    return (<main>
      <h1>Loading...</h1>
    </main>)
  }

  return (
    <main >
     <div className = "form-container">
        <h1 className="form-title">Login</h1>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
            onChange={(e) => setEmail(e.target.value)}
            type="email" id="email"  placeholder="Enter your email" required/>
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
            onChange={(e) => setPassword(e.target.value)}
            type="password" id="password" placeholder="Enter your password" required/>
          </div>
          <button className ="button primary-button">Login</button>
        </form>

        <p className="account-text">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </main>
  )
}

export default Login
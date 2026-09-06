import React from 'react'
import {useNavigate, Link} from 'react-router-dom'
import '../auth.form.scss'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {handleRegister, loading} = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await handleRegister({username, email, password});
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
        <h1 className="form-title">Register</h1>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
            onChange={(e) => setUsername(e.target.value)}
            type="text" id="username"  placeholder="Enter your username" required/>
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
            onChange={(e) => setEmail(e.target.value)}
            type="email" id="email" placeholder="Enter your email" required/>
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
            onChange={(e) => setPassword(e.target.value)}
            type="password" id="password" placeholder="Enter your password" required/>
          </div>
          <button className ="button primary-button">Register</button>
        </form>

         <p className="account-text">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </main>
  )
}

export default Register

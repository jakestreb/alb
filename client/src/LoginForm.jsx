import { useCallback, useContext, useState } from 'react';
import { UserContext } from './UserContext';
import * as http from './client/http';

export function LoginForm() {
  // Get login function from user context.
  const { user, login } = useContext(UserContext);

  // Form control.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Make call to backend server to login. Save user object to user context.
  // NOTE password should only be sent using https
  const handleLogin = useCallback((event) => {
    event.preventDefault();
    http.postLogin(username, password)
    .then((data) => {
      login(data.user, data.token);
      console.info('Logged in successfully');
    })
    .catch((error) => {
      console.error('Unable to login', error);
    });
  }, [username, password]);

  if (user) return null;

  return (
    <div className='login-form'>
      <form onSubmit={ handleLogin }>
        <h2>Log in</h2>
        <div className="inputs">
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={ username }
            onChange={ (event) => setUsername(event.target.value) }
          />
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={ password }
            onChange={ (event) => setPassword(event.target.value) }
          />
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
}

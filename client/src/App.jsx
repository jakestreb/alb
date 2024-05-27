import './App.css';
import { LoginForm } from './LoginForm';
import { UserContext } from './UserContext';
import { Watchlist } from './Watchlist.jsx';
import { useState, useCallback, useMemo } from 'react';
import { User } from "./User.jsx";


function App() {
  const [user, setUser] = useState(loadUser());
  const login = useCallback((u, tk) => {
    saveSession(u, tk);
    setUser(u);
  }, []);
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return (
    <UserContext.Provider value={value}>
      <div className="app">
        <LoginForm />
        <header>
          <h1>Albert stock watch</h1>
          <User />
        </header>
        {user && (
          <section>
            <Watchlist />
          </section>
        )}
      </div>
    </UserContext.Provider>
  );
}

function loadUser() {
  const user = localStorage.getItem('user');
  if (user) {
    return JSON.parse(user);
  }
  return null;
}

function saveSession(user, token) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

function clearSession() {
  localStorage.clear();
}

export default App;

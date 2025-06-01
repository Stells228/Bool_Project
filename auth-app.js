import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthDetails, SignIn, SignUp } from './components/auth';
import './auth-styles.css';

const AuthApp = () => (
  <div className="auth-overlay">
    <SignIn />
    <SignUp />
    <AuthDetails />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('auth-root'));
root.render(<AuthApp />);
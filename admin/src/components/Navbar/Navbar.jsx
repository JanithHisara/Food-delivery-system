import React from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear session data — update based on your actual auth logic
    localStorage.clear();
    
    // Redirect to home page
    window.location.href = "http://localhost:5174/";
    // Alternatively using React Router:
    // navigate('/');
  };

  return (
    <div className="navbar">
      <img className="logo" src={assets.logo} alt="Logo" />
      <div className="navbar-right">
        <img className="profile" src={assets.profile_image} alt="Profile" />
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;

import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Login");

  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();

    // ✅ Local bypass logic for specific email/password
    if (
      currState === "Login" &&
      data.email === "ddddd@gmail.com" &&
      data.password === "1234567890"
    ) {
      toast.success("Logged in successfully");

      // Simulate setting a token for this case
      const fakeToken = "hardcoded-token";
      setToken(fakeToken);
      localStorage.setItem("token", fakeToken);

      setTimeout(() => {
        window.location.href = "http://localhost:5173/add";
      }, 1500);
      return;
    }

    // Proceed with backend API for others
    const newUrl =
      currState === "Login"
        ? `${url}/api/user/login`
        : `${url}/api/user/register`;

    try {
      const response = await axios.post(newUrl, data);

      if (response.data.success) {
        toast.success(currState === "Login" ? "Logged in successfully" : "Registered successfully");
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);

        setTimeout(() => {
          setShowLogin(false);
        }, 1500);
      } else {
        toast.error(response.data.message || "Authentication failed");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className='login-popup'>
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
        </div>
        <div className="login-popup-inputs">
          {currState !== "Login" && (
            <input
              name='name'
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder='Your name'
              required
            />
          )}
          <input
            name='email'
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder='Your email'
            required
          />
          <input
            name='password'
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder='Password'
            required
          />
        </div>
        <button type='submit'>
          {currState === "Sign Up" ? "Create account" : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use and & privacy policy.</p>
        </div>
        {currState === "Login" ? (
          <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click Here</span></p>
        ) : (
          <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login Here</span></p>
        )}
      </form>
      <ToastContainer position="top-center" autoClose={1500} />
    </div>
  );
};

export default LoginPopup;

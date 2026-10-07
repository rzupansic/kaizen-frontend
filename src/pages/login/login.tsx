import { Link, useNavigate } from "react-router";
import { Input, Button } from '@heroui/react';
import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../slices/authSlice.ts";
import type { AppDispatch } from "../../slices/store.ts";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError("");
      await dispatch(login({ email, password })).unwrap();
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kinu text-sumi">
      <h1 className="text-3xl font-bold my-4 text-gold-deep">Kaizen Logo Goes Here</h1> 
      <div className="flex flex-col bg-sheet p-10 rounded-lg w-full max-w-md ">
        
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={handleEmailChange}
        className="my-2 w-full focus:border-gold focus:ring-gold data-[focused=true]:border-gold data-[focused=true]:ring-gold"
        />
        <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={handlePasswordChange}
        className="my-2 w-full focus:border-gold focus:ring-gold data-[focused=true]:border-gold data-[focused=true]:ring-gold"
        />
        <Link to="/forgot-password" className="text-gold-deep hover:text-gold-deep/80 hover:underline text-right">Forgot Password?</Link>
        {error ? <p className="my-2 text-vermilion">{error}</p> : null}
        <Button className="w-full my-2 bg-gold text-sumi hover:bg-gold-deep" onClick={handleLogin}>Login</Button>
        <Link to="/register" className="text-gold-deep hover:text-gold-deep/80 hover:underline">Don't have an account? Register Here</Link>
      </div>
    </div>
  );
}

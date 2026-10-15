import { Link, useNavigate } from "react-router";
import { Button } from "@heroui/react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../slices/authSlice.ts";
import type { AppDispatch } from "../../slices/store.ts";
import TextField from "@mui/material/TextField";

const fieldSlotProps = {
  input: { sx: { borderRadius: "17.5px", backgroundColor: "white" } },
};

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (name.trim() === "") {
      setError("Enter your name.");
      return;
    }
    if (email.trim() === "" || !email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setError("");
      setSaving(true);
      await dispatch(register({ name: name.trim(), email: email.trim(), password })).unwrap();
      navigate("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center parchment text-sumi">
      <h1 className="text-3xl font-bold my-4 text-gold-deep">Kaizen Logo Goes Here</h1>
      <div className="flex flex-col bg-sheet p-10 rounded-lg w-full max-w-md gap-4">
        <TextField
          label="Name"
          type="text"
          placeholder="Name"
          variant="outlined"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="my-2 w-full"
          slotProps={fieldSlotProps}
        />
        <TextField
          label="Email"
          type="email"
          placeholder="Email"
          variant="outlined"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="my-2 w-full"
          slotProps={fieldSlotProps}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="Password"
          variant="outlined"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="my-2 w-full"
          slotProps={fieldSlotProps}
        />
        {error ? <p className="my-2 text-vermilion">{error}</p> : null}
        <Button className="w-full my-2 bg-gold text-sumi hover:bg-gold-deep" isDisabled={saving} onClick={handleRegister}>
          {saving ? "Registering..." : "Register"}
        </Button>
        <Link to="/login" className="text-gold-deep hover:text-gold-deep/80 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}

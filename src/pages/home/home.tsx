import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { logout } from "../../api/authApi.ts";
import { setUser } from "../../slices/authSlice.ts";
import type { AppDispatch } from "../../slices/store.ts";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      dispatch(setUser(null));
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kinu text-sumi">
      <h1 className="text-3xl font-bold">Home</h1>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 bg-gold px-6 py-2 font-medium text-sumi"
      >
        Logout
      </button>
    </div>
  );
}

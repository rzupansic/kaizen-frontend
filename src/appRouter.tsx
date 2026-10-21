import { BrowserRouter, Route, Routes } from "react-router";
import AppLayout from "./components/AppLayout/AppLayout.tsx";
import Login from "./pages/login/login.tsx";
import Register from "./pages/register/register.tsx";
import Home from "./pages/home/home.tsx";
import Training from "./pages/training/training.tsx";
import AuthenticatedRoute from "./utils/AuthenticatedRoute.tsx";
import NotFound from "./pages/notFound/notFound.tsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AuthenticatedRoute><AppLayout /></AuthenticatedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/training" element={<Training />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

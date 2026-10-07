import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./pages/login/login.tsx";
import Home from "./pages/home/home.tsx";
import AuthenticatedRoute from "./utils/AuthenticatedRoute.tsx";
import NotFound from "./pages/notFound/notFound.tsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<AuthenticatedRoute><Home /></AuthenticatedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

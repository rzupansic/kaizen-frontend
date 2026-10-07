import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router";
import { restoreSession } from "../slices/authSlice.ts";
import type { AppDispatch, RootState } from "../slices/store.ts";

interface AuthenticatedRouteProps {
  children: React.ReactNode;
}

export default function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  const status = useSelector((state: RootState) => state.auth.status);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (status !== "unknown") return;
    dispatch(restoreSession());
  }, [status, dispatch]);

  if (status === "unknown") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kinu text-sumi">
        Loading...
      </div>
    );
  }

  if (status === "guest") return <Navigate to="/login" replace />;
  return children;
}

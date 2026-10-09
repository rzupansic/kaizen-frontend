import Dashboard from "../../components/Dashboard/Dashboard.tsx";
import { useSelector } from "react-redux";
import type { RootState } from "../../slices/store.ts";

export default function Home() {
  const user = useSelector((state: RootState) => state.auth.user);
  console.log(user);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h1 className="shrink-0 text-2xl font-bold text-gold-deep">Welcome, {user?.email}</h1>
      <Dashboard />
    </div>
  );
}

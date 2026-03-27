import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background font-nunito">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
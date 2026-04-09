import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiPackage,
  FiTrendingUp,
  FiFileText,
  FiUsers,
  FiLogOut,
  FiMenu,
  FiX,
  FiBriefcase,
  FiUser,
} from "react-icons/fi";

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: FiHome },
    { name: "Items", href: "/items", icon: FiPackage },
    { name: "Issues & Returns", href: "/issues", icon: FiTrendingUp },
    { name: "Reports", href: "/reports", icon: FiFileText },
    ...(isAdmin()
      ? [
          { name: "Departments", href: "/departments", icon: FiBriefcase },
          { name: "Users", href: "/users", icon: FiUsers },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-indigo-900 text-white transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-800">
          {sidebarOpen && <h1 className="text-xl font-bold">Inventory</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-indigo-800"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-800 text-white border-l-4 border-indigo-400"
                    : "text-indigo-100 hover:bg-indigo-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 w-full border-t border-indigo-800">
          <Link
            to="/profile"
            className="flex items-center px-4 py-3 hover:bg-indigo-800"
          >
            <FiUser className="w-5 h-5" />
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-indigo-300">{user?.role}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 hover:bg-indigo-800 text-left"
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {navigation.find((item) => item.href === location.pathname)
                ?.name || "Inventory Management"}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.department?.name || "All Departments"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

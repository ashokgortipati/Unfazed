import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Heart, Calendar, Users, FileText, BarChart3, Settings, LogOut, Sparkles, UserCheck } from "lucide-react";

const Navbar = () => {
  const { therapist, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = location.pathname.startsWith("/dr-") || location.pathname.startsWith("/client") || location.pathname === "/login" || location.pathname === "/register";

  if (isPublicPage && !isAuthenticated) {
    return (
      <header className="public-navbar">
        <div className="navbar-container">
          <Link to="/" className="brand-link">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Unfazed<span className="text-indigo-600">.in</span>
            </span>
          </Link>
          <div className="navbar-actions">
            <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-indigo-600">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              Start Practice
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="therapist-navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="brand-link">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none text-slate-900">Unfazed</span>
              <span className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wider">Practice Hub</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="main-navigation">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === "/dashboard"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Overview</span>
              </Link>
              <Link
                to="/dashboard/schedule"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === "/dashboard/schedule"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </Link>
              <Link
                to="/dashboard/clients"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === "/dashboard/clients"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Clients</span>
              </Link>
              <Link
                to="/dashboard/notes"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === "/dashboard/notes"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Notes</span>
              </Link>
              <Link
                to="/dashboard/analytics"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === "/dashboard/analytics"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right Menu */}
        <div className="navbar-actions">
          {isAuthenticated && therapist && (
            <>
              {/* Branded Link Badge */}
              <Link
                to={`/${therapist.slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>unfazed.in/{therapist.slug}</span>
              </Link>

              {/* Tier Badge */}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                therapist.subscription_tier === 'pro'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : therapist.subscription_tier === 'enterprise'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {therapist.subscription_tier || 'free'}
              </span>

              {/* User Dropdown / Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <img
                  src={therapist.avatar || "https://images.unsplash.com/photo-1594824813566-88855ce78906?w=100"}
                  alt={therapist.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                />
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-indigo-600">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                Start Practice
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

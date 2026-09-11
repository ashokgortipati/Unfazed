import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import UpgradeModal from "../../components/common/UpgradeModal";
import ChatWindow from "../../components/chat/ChatWindow";
import { Calendar, Users, FileText, IndianRupee, Video, Plus, ExternalLink, MessageCircle, Sparkles } from "lucide-react";

const Dashboard = () => {
  const { therapist } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    activeClients: 2,
    revenueThisMonth: 18000,
  });

  const [activeChatRoom, setActiveChatRoom] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const sessionsRes = await axiosInstance.get("/scheduling/sessions");
        if (sessionsRes.data.success) {
          setSessions(sessionsRes.data.sessions || []);
          setStats((prev) => ({
            ...prev,
            upcomingCount: (sessionsRes.data.sessions || []).filter((s) => s.status === "scheduled").length,
          }));
        }
      } catch (err) {
        console.error("Dashboard data fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loader label="Loading therapist practice hub..." />;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Practice Tier: {therapist?.subscription_tier?.toUpperCase() || "FREE"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Good day, {therapist?.name}</h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
            Here is your daily practice overview. Clients can book sessions directly via your branded link.
          </p>
        </div>

        {/* Branded Link Callout */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-start space-y-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Your Branded Practice URL</span>
          <div className="flex items-center space-x-2">
            <code className="text-xs font-mono font-bold bg-black/30 px-3 py-1.5 rounded-lg text-emerald-300">
              unfazed.in/{therapist?.slug}
            </code>
            <Link
              to={`/${therapist?.slug}`}
              target="_blank"
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
              title="Open Public Link"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="dashboard-summary">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Upcoming Sessions</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{stats.upcomingCount}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Active CRM Clients</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{stats.activeClients}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Revenue (Estimated)</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">₹{stats.revenueThisMonth}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Upcoming Sessions List */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming Tele-Therapy Sessions</h2>
            <p className="text-xs text-slate-500">Instant access to room video links and client consultation chat</p>
          </div>
          <Link
            to="/dashboard/schedule"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>Manage Weekly Schedule</span>
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-slate-600">No upcoming sessions scheduled yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Share your branded link to receive client bookings.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <div key={session._id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0">
                    {session.client_name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{session.client_name}</h4>
                    <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span>{new Date(session.start_time).toLocaleString("en-IN")}</span>
                      <span>•</span>
                      <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-full font-medium text-[10px] text-slate-600">
                        {session.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={session.video_link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Video Room</span>
                  </a>
                  <button
                    onClick={() => setActiveChatRoom({ roomId: `room_${session.client_id || session._id}`, name: session.client_name })}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                    title="Open Live Chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeChatRoom && (
        <ChatWindow
          roomId={activeChatRoom.roomId}
          senderType="therapist"
          senderId={therapist?._id}
          senderName={therapist?.name || "Therapist"}
          onClose={() => setActiveChatRoom(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

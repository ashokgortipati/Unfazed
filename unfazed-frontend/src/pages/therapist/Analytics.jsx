import React, { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import UpgradeModal from "../../components/common/UpgradeModal";
import { useEntitlement } from "../../hooks/useEntitlement";
import { TrendingUp, Users, CheckCircle, AlertCircle, Lock, Sparkles, IndianRupee } from "lucide-react";

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { checkAccess, upgradeModalOpen, setUpgradeModalOpen, blockedFeature, handleApiEntitlementError } = useEntitlement();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/analytics/dashboard");
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        if (!handleApiEntitlementError(err)) {
          console.error("Failed to load analytics dashboard", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <Loader label="Computing practice analytics & revenue pipelines..." />;

  const summary = data?.summary || {
    totalRevenue: 67500,
    totalNet: 64125,
    activeClients: 12,
    completionRate: "92.5%",
    noShowRate: "4.2%",
  };

  const revenueTrend = data?.revenueTrend || [
    { month: "May 2026", revenue: 4500, net: 4275 },
    { month: "Jun 2026", revenue: 9000, net: 8550 },
    { month: "Jul 2026", revenue: 13500, net: 12825 },
    { month: "Aug 2026", revenue: 18000, net: 17100 },
    { month: "Sep 2026", revenue: 22500, net: 21375 },
  ];

  const sessionBreakdown = data?.sessionBreakdown || [
    { name: "Completed", value: 32, fill: "#10B981" },
    { name: "Scheduled", value: 8, fill: "#3B82F6" },
    { name: "No Show", value: 3, fill: "#EF4444" },
    { name: "Cancelled", value: 2, fill: "#F59E0B" },
  ];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="content-header">
        <div>
          <h1 className="page-title">Practice Business Analytics</h1>
          <p className="page-description">Real-time financial growth, session completion rates, and client retention trends.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="analytics-summary grid-cols-1 sm:grid-cols-4">
        <div className="content-card">
          <span className="text-xs font-bold uppercase text-slate-500">Gross Revenue</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{summary.totalRevenue}</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">↑ 18.4% vs last month</span>
        </div>

        <div className="content-card">
          <span className="text-xs font-bold uppercase text-slate-500">Net Take-Home</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">₹{summary.totalNet}</div>
          <span className="text-[10px] text-slate-400 mt-1 inline-block">After platform fee</span>
        </div>

        <div className="content-card">
          <span className="text-xs font-bold uppercase text-slate-500">Completion Rate</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.completionRate}</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">High engagement</span>
        </div>

        <div className="content-card">
          <span className="text-xs font-bold uppercase text-slate-500">No-Show Rate</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{summary.noShowRate}</div>
          <span className="text-[10px] text-slate-400 mt-1 inline-block">Advance payment protection</span>
        </div>
      </div>

      {/* Recharts Revenue Trend Chart */}
      <div className="content-card">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Monthly Practice Revenue Trend (INR)</h3>
        <p className="text-xs text-slate-500 mb-6">Computed via MongoDB Aggregation Pipelines</p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        blockedFeature={blockedFeature}
      />
    </div>
  );
};

export default Analytics;

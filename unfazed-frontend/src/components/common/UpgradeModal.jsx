import React from "react";
import { Sparkles, Check, X, ShieldAlert } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const UpgradeModal = ({ isOpen, onClose, blockedFeature }) => {
  const { therapist, updateTherapistState } = useAuth();
  const [upgrading, setUpgrading] = React.useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async (tierName) => {
    try {
      setUpgrading(true);
      const res = await axiosInstance.post("/analytics/subscribe", { tier: tierName });
      if (res.data.success) {
        updateTherapistState({ subscription_tier: tierName });
        alert(`Congratulations! You have upgraded to the ${tierName.toUpperCase()} plan.`);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upgrade subscription tier.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Subscription Tier Gating</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {blockedFeature?.title || "Unlock Pro Practice Features"}
        </h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {blockedFeature?.reason || "This feature is available on the Pro and Enterprise plans."}
        </p>

        {/* Plan Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-indigo-600">Pro Plan</span>
              <div className="mt-1 text-xl font-extrabold text-slate-900">₹1,499 <span className="text-xs font-normal text-slate-500">/mo</span></div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Up to 50 active clients</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SOAP & DAP note templates</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Revenue & session analytics</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={upgrading}
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Upgrade to Pro
            </button>
          </div>

          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-purple-600">Enterprise</span>
              <div className="mt-1 text-xl font-extrabold text-slate-900">₹3,999 <span className="text-xs font-normal text-slate-500">/mo</span></div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>Unlimited active clients</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>All clinical features</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>Priority support & API</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade("enterprise")}
              disabled={upgrading}
              className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg font-semibold text-xs hover:bg-purple-700 transition-colors shadow-sm"
            >
              Upgrade to Enterprise
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg"
          >
            Keep Current Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;

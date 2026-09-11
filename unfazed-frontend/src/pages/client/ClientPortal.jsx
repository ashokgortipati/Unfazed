import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import ChatWindow from "../../components/chat/ChatWindow";
import { FileText, Calendar, CheckSquare, MessageSquare, Lock, ShieldCheck } from "lucide-react";

const ClientPortal = () => {
  const [clientId, setClientId] = useState(localStorage.getItem("unfazed_client_id") || "demo_client_id");
  const [client, setClient] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Digital Consent / Intake State
  const [intakeData, setIntakeData] = useState({
    presenting_concern: "",
    medical_history: "",
    therapy_goals: "",
    signed: false,
  });

  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        // Fetch client shared notes (strictly filtered at API level)
        const notesRes = await axiosInstance.get(`/notes/client-shared/${clientId}`);
        if (notesRes.data.success) {
          setSharedNotes(notesRes.data.notes || []);
        }
      } catch (err) {
        console.error("Client portal fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [clientId]);

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/clients/intake-consent", {
        client_id: clientId,
        ...intakeData,
      });

      if (res.data.success) {
        alert("Intake details and digital consent record submitted successfully.");
      }
    } catch (err) {
      alert("Failed to submit intake. Please try again.");
    }
  };

  if (loading) return <Loader label="Loading your client portal & shared records..." />;

  return (
    <div className="client-portal-page">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Client Portal Access</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Shared Therapy Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Access shared session homework, digital intake, and live consultation chat.</p>
        </div>

        <button
          onClick={() => setChatOpen(true)}
          className="primary-button"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat with Therapist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shared Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Shared Clinical Notes & Resources</h2>
            </div>

            {sharedNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-slate-600">No shared notes published yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Private clinical notes remain strictly confidential to your therapist.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedNotes.map((note) => (
                  <div key={note._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">{note.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(note.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <div
                      className="text-xs text-slate-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Digital Intake & Consent */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Digital Intake & Consent</h3>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Presenting Concerns</label>
                <textarea
                  rows="2"
                  value={intakeData.presenting_concern}
                  onChange={(e) => setIntakeData({ ...intakeData, presenting_concern: e.target.value })}
                  placeholder="Describe main symptoms or stress factors..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Therapy Goals</label>
                <textarea
                  rows="2"
                  value={intakeData.therapy_goals}
                  onChange={(e) => setIntakeData({ ...intakeData, therapy_goals: e.target.value })}
                  placeholder="What would you like to achieve in therapy?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intakeData.signed}
                    onChange={(e) => setIntakeData({ ...intakeData, signed: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    I consent to receive online tele-therapy services and accept confidential practice terms.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors mt-2"
              >
                Submit Consent Record
              </button>
            </form>
          </div>
        </div>
      </div>

      {chatOpen && (
        <ChatWindow
          roomId={`room_${clientId}`}
          senderType="client"
          senderId={clientId}
          senderName="Client Portal User"
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default ClientPortal;

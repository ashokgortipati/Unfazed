import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import UpgradeModal from "../../components/common/UpgradeModal";
import { useEntitlement } from "../../hooks/useEntitlement";
import { FileText, Lock, Globe, Save, Sparkles, Plus, Check } from "lucide-react";

const Notes = () => {
  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Note Form State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [noteType, setNoteType] = useState("private"); // 'private' or 'shared'
  const [format, setFormat] = useState("freeform"); // 'freeform', 'soap', 'dap'
  const [title, setTitle] = useState("Session Note");

  // Freeform content
  const [content, setContent] = useState("");

  // SOAP Structured Fields
  const [soapData, setSoapData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  const { checkAccess, upgradeModalOpen, setUpgradeModalOpen, blockedFeature, handleApiEntitlementError } = useEntitlement();

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [clientsRes, sessionsRes, notesRes] = await Promise.all([
          axiosInstance.get("/clients"),
          axiosInstance.get("/scheduling/sessions"),
          axiosInstance.get("/notes"),
        ]);

        if (clientsRes.data.success) setClients(clientsRes.data.clients || []);
        if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions || []);
        if (notesRes.data.success) setNotes(notesRes.data.notes || []);
      } catch (err) {
        console.error("Failed to load clinical notes workspace", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const handleFormatChange = (newFormat) => {
    // Entitlement Check for structured SOAP / DAP templates
    if (newFormat !== "freeform") {
      const allowed = checkAccess("NOTE_TEMPLATES", { format: newFormat });
      if (!allowed) return;
    }
    setFormat(newFormat);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Please select a client record.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        session_id: selectedSessionId || sessions[0]?._id,
        client_id: selectedClientId,
        note_type: noteType,
        format,
        title,
        content: format === "freeform" ? content : `<p>${soapData.subjective}</p>`,
        structured_data: soapData,
      };

      const res = await axiosInstance.post("/notes", payload);
      if (res.data.success) {
        setNotes([res.data.note, ...notes]);
        setContent("");
        setSoapData({ subjective: "", objective: "", assessment: "", plan: "" });
        alert("Clinical documentation saved successfully.");
      }
    } catch (err) {
      if (!handleApiEntitlementError(err)) {
        alert(err.response?.data?.message || "Failed to save note.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading clinical documentation studio..." />;

  return (
    <div className="notes-page">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Clinical Documentation Studio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Write private clinical notes or publish shared session summaries directly to the Client Portal.
          </p>
        </div>
      </div>

      <div className="notes-layout">
        {/* Editor Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveNote} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
            {/* Note Type Selector (Private vs Shared) */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Documentation Visibility:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNoteType("private")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    noteType === "private"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private Clinical Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType("shared")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    noteType === "shared"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Shared Client Portal Summary</span>
                </button>
              </div>
            </div>

            {/* Template Selector (Freeform, SOAP, DAP) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-600">Select Note Format / Template</label>
              <div className="flex items-center space-x-3">
                {["freeform", "soap", "dap"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleFormatChange(fmt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      format === fmt
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {fmt === "freeform" ? "Freeform Editor" : `${fmt.toUpperCase()} Template`}
                  </button>
                ))}
              </div>
            </div>

            {/* Client & Session Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Client</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose Client...</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Freeform Editor */}
            {format === "freeform" && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Session Notes & Observations</label>
                <textarea
                  rows="8"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter detailed clinical impressions, cognitive restructuring strategies, or homework assigned..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                />
              </div>
            )}

            {/* Structured SOAP Template */}
            {format === "soap" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-indigo-700 mb-1">S - Subjective (Client's self-reported feelings)</label>
                  <textarea
                    rows="2"
                    value={soapData.subjective}
                    onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-indigo-700 mb-1">O - Objective (Therapist's observations & affect)</label>
                  <textarea
                    rows="2"
                    value={soapData.objective}
                    onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-indigo-700 mb-1">A - Assessment (Clinical diagnosis & progress evaluation)</label>
                  <textarea
                    rows="2"
                    value={soapData.assessment}
                    onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-indigo-700 mb-1">P - Plan (Action steps & next session date)</label>
                  <textarea
                    rows="2"
                    value={soapData.plan}
                    onChange={(e) => setSoapData({ ...soapData, plan: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Record..." : "Save Clinical Documentation"}</span>
            </button>
          </form>
        </div>

        {/* Existing Notes Feed */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Recent Notes Log</h3>
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      n.note_type === 'private' ? 'bg-slate-200 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {n.note_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
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

export default Notes;

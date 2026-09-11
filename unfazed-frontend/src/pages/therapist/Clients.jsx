import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import UpgradeModal from "../../components/common/UpgradeModal";
import { useEntitlement } from "../../hooks/useEntitlement";
import { Users, Plus, Search, Filter, Mail, Phone, Calendar, FileText, IndianRupee, ShieldCheck } from "lucide-react";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // Selected Client Drawer State
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailData, setClientDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add Client Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", gender: "Male", tags: "Individual Therapy" });

  const { checkAccess, upgradeModalOpen, setUpgradeModalOpen, blockedFeature, handleApiEntitlementError } = useEntitlement();

  const fetchClients = async () => {
    try {
      setLoading(true);
      let url = "/clients";
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedTag) params.append("tag", selectedTag);

      const res = await axiosInstance.get(`${url}?${params.toString()}`);
      if (res.data.success) {
        setClients(res.data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery, selectedTag]);

  const handleOpenAddModal = () => {
    // Check entitlement for ADD_CLIENT (Free tier cap: 5 clients)
    const allowed = checkAccess("ADD_CLIENT", { currentCount: clients.length });
    if (allowed) {
      setAddModalOpen(true);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/clients", {
        ...newClient,
        tags: newClient.tags.split(",").map((t) => t.trim()),
      });

      if (res.data.success) {
        setAddModalOpen(false);
        setNewClient({ name: "", email: "", phone: "", gender: "Male", tags: "Individual Therapy" });
        fetchClients();
      }
    } catch (err) {
      if (!handleApiEntitlementError(err)) {
        alert(err.response?.data?.message || "Failed to add client.");
      }
    }
  };

  const handleViewClientDetail = async (client) => {
    setSelectedClient(client);
    try {
      setLoadingDetail(true);
      const res = await axiosInstance.get(`/clients/${client._id}`);
      if (res.data.success) {
        setClientDetailData(res.data);
      }
    } catch (err) {
      console.error("Failed to load client detail", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="content-header">
        <div>
          <h1 className="page-title">Client CRM & Intake Directory</h1>
          <p className="page-description">Manage private practice client roster, session logs, payments, and digital consents.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="primary-button"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name, email, or phone..."
            className="form-input pl-10 pr-4"
          />
        </div>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="form-select font-semibold text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Filter Tags</option>
          <option value="Individual Therapy">Individual Therapy</option>
          <option value="Anxiety">Anxiety</option>
          <option value="CBT">CBT</option>
          <option value="Relationship Counseling">Relationship Counseling</option>
        </select>
      </div>

      {/* Client Table */}
      <div className="data-table-container">
        {loading ? (
          <Loader label="Loading client database..." />
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-slate-600">No client records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Client Name</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Tags & Modality</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">{client.name}</span>
                          <span className="text-[10px] text-slate-400">Added {new Date(client.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {client.tags?.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewClientDetail(client)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-700 font-bold transition-all text-xs"
                      >
                        View Full Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Client to Practice CRM</h3>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newClient.tags}
                  onChange={(e) => setNewClient({ ...newClient, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail Aggregated Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedClient.name}</h2>
                  <span className="text-xs text-slate-500">{selectedClient.email} • {selectedClient.phone}</span>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                Close
              </button>
            </div>

            {loadingDetail ? (
              <Loader label="Aggregating client session logs & notes..." />
            ) : clientDetailData ? (
              <div className="space-y-6 text-xs">
                {/* Intake & Consent Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Intake & Consent Status</span>
                  </h3>
                  <div><strong>Presenting Concern:</strong> {clientDetailData.client.intake_form?.presenting_concern || "None submitted"}</div>
                  <div><strong>Therapy Goals:</strong> {clientDetailData.client.intake_form?.therapy_goals || "None submitted"}</div>
                  <div><strong>Consent Signed:</strong> {clientDetailData.client.consent_record?.signed ? "Yes (Audited)" : "Pending"}</div>
                </div>

                {/* Session History */}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-2">Session History</h3>
                  <div className="space-y-2">
                    {clientDetailData.sessions?.map((s) => (
                      <div key={s._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{new Date(s.start_time).toLocaleString()}</div>
                          <div className="text-slate-500 capitalize">{s.status} • {s.duration_minutes} mins</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Upgrade Modal for Entitlement Enforcement */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        blockedFeature={blockedFeature}
      />
    </div>
  );
};

export default Clients;

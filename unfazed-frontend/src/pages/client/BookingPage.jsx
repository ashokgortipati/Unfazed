import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import ChatWindow from "../../components/chat/ChatWindow";
import { Calendar, Clock, Globe, ShieldCheck, Award, CreditCard, MessageCircle, Check, Star } from "lucide-react";

const BookingPage = () => {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Slot Picker State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/therapists/profile/${slug || "dr-sharma"}`);
        if (res.data.success) {
          setProfile(res.data.therapist);
          setPackages(res.data.packages || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Therapist profile not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!profile) return;
      try {
        setLoadingSlots(true);
        const res = await axiosInstance.get(`/scheduling/slots/${profile.slug}?date=${selectedDate}`);
        if (res.data.success) {
          setSlots(res.data.slots || []);
        }
      } catch (err) {
        console.error("Failed to load slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [profile, selectedDate]);

  const handleBookSlotClick = (slot) => {
    setSelectedSlot(slot);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !profile) return;

    try {
      // 1. Submit Booking Request
      const bookingRes = await axiosInstance.post("/scheduling/book", {
        therapist_id: profile._id,
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        start_time: selectedSlot.startTime,
        duration_minutes: selectedSlot.durationMinutes,
        client_notes: clientData.notes,
      });

      if (bookingRes.data.success) {
        const session = bookingRes.data.session;

        // 2. Initiate Razorpay Checkout in Test Mode
        const orderRes = await axiosInstance.post("/payments/create-order", {
          therapist_id: profile._id,
          client_id: session.client_id,
          session_id: session._id,
          amount: profile.fee_per_session || 1500,
        });

        if (orderRes.data.success) {
          const order = orderRes.data.order;

          const options = {
            key: order.key,
            amount: order.amount,
            currency: order.currency,
            name: `Therapy Session with ${profile.name}`,
            description: `Scheduled for ${selectedSlot.formattedTime}`,
            order_id: order.id,
            handler: async function (response) {
              // Verify Payment Signature
              const verifyRes = await axiosInstance.post("/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                setBookingSuccess({
                  session,
                  invoiceUrl: verifyRes.data.invoice_url,
                });
                setBookingModalOpen(false);
              }
            },
            prefill: {
              name: clientData.name,
              email: clientData.email,
              contact: clientData.phone,
            },
            theme: { color: "#4f46e5" },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed. Slot might be unavailable.");
    }
  };

  if (loading) return <Loader label="Loading therapist practice profile..." />;
  if (error) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border border-slate-200">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold">!</div>
        <h2 className="text-xl font-bold text-slate-900">{error}</h2>
        <p className="text-sm text-slate-500 mt-2">Please double check the URL slug or request a valid link from your therapist.</p>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
          <img
            src={profile.avatar || "https://images.unsplash.com/photo-1594824813566-88855ce78906?w=400"}
            alt={profile.name}
            className="w-36 h-36 rounded-3xl object-cover border-4 border-white/20 shadow-2xl shrink-0"
          />
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Mental Health Professional</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{profile.name}</h1>
            <p className="text-indigo-200 font-medium mt-1 text-sm sm:text-base">{profile.title}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{profile.experience_years}+ Years Clinical Practice</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>{profile.languages?.join(", ")}</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <span>₹{profile.fee_per_session} / 50-min Session</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Bio & Scheduling Grid */}
      <div className="booking-content">
        {/* Left Column: Bio & Specializations */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">About Therapist</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Clinical Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {profile.specializations?.map((spec, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Consultation Chat CTA */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-3xl shadow-lg">
            <h4 className="font-bold text-base mb-1">Have a Pre-Booking Question?</h4>
            <p className="text-xs text-indigo-100 mb-4">Chat directly with {profile.name} before booking your initial intake session.</p>
            <button
              onClick={() => setChatOpen(true)}
              className="w-full py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-xs shadow-md hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open Live Chat</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Slot Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Select Session Slot</h3>
                <p className="text-xs text-slate-500">Converted automatically to your local timezone</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {loadingSlots ? (
              <Loader label="Fetching open appointment slots..." />
            ) : slots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No open slots available for {selectedDate}.</p>
                <p className="text-[11px] text-slate-400 mt-1">Try picking another date using the date selector above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBookSlotClick(slot)}
                    className="p-3 bg-slate-50 hover:bg-indigo-600 hover:text-white border border-slate-200 rounded-2xl text-center transition-all group shadow-xs"
                  >
                    <div className="text-xs font-extrabold group-hover:text-white">{slot.formattedTime}</div>
                    <div className="text-[10px] text-slate-500 group-hover:text-indigo-100 mt-0.5">{slot.durationMinutes} mins</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Session Packages Section */}
          {packages.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Discounted Therapy Packages</h3>
              <p className="text-xs text-slate-500 mb-4">Book multi-session packs for comprehensive therapeutic progress.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg._id} className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/40 relative">
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                      Save {pkg.discount_percentage}%
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{pkg.title}</h4>
                    <div className="text-xs text-slate-500 mt-1">{pkg.total_sessions} Sessions • Valid {pkg.validity_days} Days</div>
                    <div className="mt-3 font-extrabold text-base text-indigo-700">₹{pkg.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Confirmation & Payment Modal */}
      {bookingModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Confirm Therapy Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedDate} at <strong>{selectedSlot.formattedTime}</strong> ({selectedSlot.durationMinutes} mins)
            </p>

            <form onSubmit={handleConfirmBooking} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  placeholder="Rohan Verma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Email Address (for calendar invite)</label>
                <input
                  type="email"
                  required
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  placeholder="rohan@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Phone Number (WhatsApp reminders)</label>
                <input
                  type="tel"
                  required
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  placeholder="+91 98123 45678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Reason for Visit / Main Focus (Optional)</label>
                <textarea
                  rows="2"
                  value={clientData.notes}
                  onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                  placeholder="Share any specific topics or goals..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-900 mt-2">
                <span>Advance Fee Payable:</span>
                <span className="text-base text-indigo-700">₹{profile.fee_per_session}</span>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Pay & Book</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Success Dialog */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 font-bold">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Session Confirmed!</h3>
            <p className="text-xs text-slate-500 mt-1">Your video session link and tax invoice have been generated.</p>

            <div className="my-4 p-3 bg-slate-50 rounded-2xl text-left text-xs space-y-1 border border-slate-200">
              <div><strong>Video Link:</strong> <a href={bookingSuccess.session.video_link} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">{bookingSuccess.session.video_link}</a></div>
              <div><strong>Time:</strong> {new Date(bookingSuccess.session.start_time).toLocaleString("en-IN")}</div>
            </div>

            {bookingSuccess.invoiceUrl && (
              <a
                href={`http://localhost:5000${bookingSuccess.invoiceUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full py-2.5 mb-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Download Tax Invoice (PDF)
              </a>
            )}

            <button
              onClick={() => setBookingSuccess(null)}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Live Chat Modal */}
      {chatOpen && profile && (
        <ChatWindow
          roomId={`room_${profile._id}_guest`}
          senderType="client"
          senderId={`guest_${Date.now()}`}
          senderName={clientData.name || "Inquiring Client"}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default BookingPage;

import React, { useState, useEffect } from "react";
import API from "../services/api";
import { logout, getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function StudentDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("resources");
  const [bookingForm, setBookingForm] = useState({
    resourceId: "",
    bookingDate: "",
    startTime: "",
    endTime: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showSlots, setShowSlots] = useState(false);

  useEffect(() => {
    fetchResources();
    fetchMyBookings();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await API.get("/student/resources");
      setResources(res.data);
    } catch (err) {
      setError("Failed to load resources");
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await API.get("/bookings/my");
      setMyBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const checkAvailability = async () => {
    if (!bookingForm.resourceId || !bookingForm.bookingDate) {
      setError("Please select both resource and date");
      return;
    }

    try {
      setLoading(true);
      const res = await API.get("/bookings/available-slots", {
        params: {
          resourceId: bookingForm.resourceId,
          date: bookingForm.bookingDate
        }
      });
      setAvailableSlots(res.data);
      setShowSlots(true);
      setError("");
    } catch (err) {
      setError("Failed to check availability");
    } finally {
      setLoading(false);
    }
  };

  const selectTimeSlot = (start, end) => {
    setBookingForm({
      ...bookingForm,
      startTime: start,
      endTime: end
    });
    setShowSlots(false);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingForm.resourceId || !bookingForm.bookingDate || 
        !bookingForm.startTime || !bookingForm.endTime) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      await API.post("/bookings", bookingForm);
      
      setSuccess("Booking request sent successfully!");
      
      setBookingForm({
        resourceId: "",
        bookingDate: "",
        startTime: "",
        endTime: ""
      });
      setShowSlots(false);
      
      fetchMyBookings();
      
      setTimeout(() => {
        setActiveTab("bookings");
        setSuccess("");
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const today = new Date().toISOString().split('T')[0];
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Student Dashboard</h1>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </span>
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1">
            {[
              { id: "resources", label: "Available Resources", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
              { id: "bookings", label: "My Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl"
              >
                {success}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            {activeTab === "resources" ? (
              <div className="space-y-6">
                {/* Booking Form Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Book a Resource</h2>
                  
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Resource
                        </label>
                        <select
                          value={bookingForm.resourceId}
                          onChange={(e) => {
                            setBookingForm({...bookingForm, resourceId: e.target.value});
                            setShowSlots(false);
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                          required
                        >
                          <option value="">Choose a resource</option>
                          {resources.map(resource => (
                            <option key={resource.id} value={resource.id}>
                              {resource.name} ({resource.type}) - Capacity: {resource.capacity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Date
                        </label>
                        <input
                          type="date"
                          min={today}
                          value={bookingForm.bookingDate}
                          onChange={(e) => {
                            setBookingForm({...bookingForm, bookingDate: e.target.value});
                            setShowSlots(false);
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                          required
                        />
                      </div>
                    </div>

                    {(!bookingForm.startTime || !bookingForm.endTime) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={checkAvailability}
                        disabled={!bookingForm.resourceId || !bookingForm.bookingDate || loading}
                        className={`w-full py-3 rounded-xl font-medium transition-all ${
                          !bookingForm.resourceId || !bookingForm.bookingDate || loading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                        }`}
                      >
                        {loading ? 'Checking...' : 'Check Available Time Slots'}
                      </motion.button>
                    )}

                    {bookingForm.startTime && bookingForm.endTime && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 p-4 rounded-xl"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-gray-600">Selected Time:</span>
                            <span className="ml-2 font-medium text-blue-700">
                              {bookingForm.startTime} - {bookingForm.endTime}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingForm({...bookingForm, startTime: "", endTime: ""});
                              setShowSlots(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Change
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {showSlots && availableSlots.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Available Time Slots:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {availableSlots.map((slot, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ scale: slot.available ? 1.05 : 1 }}
                              whileTap={{ scale: slot.available ? 0.95 : 1 }}
                              type="button"
                              onClick={() => selectTimeSlot(slot.startTime, slot.endTime)}
                              disabled={!slot.available}
                              className={`
                                p-3 text-sm rounded-xl transition-all
                                ${slot.available
                                  ? 'bg-gray-50 hover:bg-blue-600 hover:text-white border border-gray-200 hover:border-blue-600'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                }
                              `}
                            >
                              {slot.startTime} - {slot.endTime}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {bookingForm.startTime && bookingForm.endTime && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
                          loading
                            ? 'bg-green-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
                        }`}
                      >
                        {loading ? 'Processing...' : 'Request Booking'}
                      </motion.button>
                    )}
                  </form>
                </motion.div>

                {/* Resources List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Available Resources</h2>
                  </div>
                  
                  {resources.length === 0 ? (
                    <div className="p-12 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500">No resources available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {resources.map((resource, index) => (
                            <motion.tr
                              key={resource.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{resource.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{resource.type}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{resource.capacity}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  resource.status === 'AVAILABLE' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {resource.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {resource.status === 'AVAILABLE' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setBookingForm({
                                        ...bookingForm,
                                        resourceId: resource.id
                                      });
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                  >
                                    Book Now
                                  </motion.button>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">My Bookings</h2>
                </div>
                
                {myBookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {myBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 hover:bg-gray-50"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Resource</p>
                            <p className="text-sm font-medium text-gray-900">#{booking.resourceId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="text-sm font-medium text-gray-900">{booking.bookingDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Time</p>
                            <p className="text-sm font-medium text-gray-900">{booking.startTime} - {booking.endTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.emergencyOverride && (
                            <div>
                              <p className="text-xs text-amber-500 mb-1">Note</p>
                              <p className="text-xs font-medium text-amber-600">⚠️ Emergency Override</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StudentDashboard;
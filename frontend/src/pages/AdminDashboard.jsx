import React, { useState, useEffect } from "react";
import { logout, getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import ResourceTable from "../components/ResourceTable";
import RequestList from "../components/RequestList";
import BookingForm from "../components/BookingForm";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [activeTab, setActiveTab] = useState("resources");
  const [refreshResources, setRefreshResources] = useState(0);
  const [refreshRequests, setRefreshRequests] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  
  // Resource management states
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "",
    capacity: "",
    status: "AVAILABLE"
  });
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch resources on mount and refresh
  useEffect(() => {
    if (activeTab === "resources") {
      fetchResources();
    }
  }, [refreshResources, activeTab]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/resources");
      setResources(res.data);
    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleResourceUpdate = () => {
    setRefreshResources(prev => prev + 1);
  };

  const handleRequestUpdate = (action, id) => {
    setRefreshRequests(prev => prev + 1);
    setRefreshResources(prev => prev + 1);
  };

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
    setShowBookingForm(true);
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedResource(null);
    setRefreshResources(prev => prev + 1);
    setRefreshRequests(prev => prev + 1);
  };

  const handleForceApprove = (booking) => {
    setSelectedBooking(booking);
    setShowOverrideModal(true);
  };

  const confirmForceApprove = async () => {
    try {
      // API call would go here
      setShowOverrideModal(false);
      setSelectedBooking(null);
      setOverrideReason("");
      setRefreshRequests(prev => prev + 1);
    } catch (error) {
      console.error("Force approve error:", error);
    }
  };

  // Resource CRUD operations
  const handleAddResource = () => {
    setEditingResource(null);
    setResourceForm({
      name: "",
      type: "",
      capacity: "",
      status: "AVAILABLE"
    });
    setShowResourceModal(true);
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      status: resource.status
    });
    setShowResourceModal(true);
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    
    try {
      await API.delete(`/admin/resources/${id}`);
      setRefreshResources(prev => prev + 1);
    } catch (err) {
      console.error("Error deleting resource:", err);
      alert("Failed to delete resource");
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingResource) {
        await API.put(`/admin/resources/${editingResource.id}`, resourceForm);
      } else {
        await API.post("/admin/resources", resourceForm);
      }
      
      setShowResourceModal(false);
      setRefreshResources(prev => prev + 1);
    } catch (err) {
      console.error("Error saving resource:", err);
      alert("Failed to save resource");
    }
  };

  const resourceTypes = ["LAB", "CLASSROOM", "HALL", "SEMINAR", "MEETING", "LECTURE_HALL"];

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
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">{currentUser?.email} · Administrator</p>
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
              { id: "resources", label: "Resources", icon: "M4 6h16M4 12h16M4 18h16" },
              { id: "requests", label: "Booking Requests", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "resources" ? (
              <>
                {/* Admin Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm p-6 mb-6"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddResource}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Resource
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedResource(null);
                        setShowBookingForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      New Booking
                    </motion.button>
                    
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center text-sm">
                      <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Admin bookings are auto-approved and can override existing bookings
                    </div>
                  </div>
                </motion.div>

                {/* Resources Management Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Resource Management</h2>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        {resources.length} resource{resources.length !== 1 ? 's' : ''}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRefreshResources(prev => prev + 1)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                        title="Refresh"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="p-12 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 mb-4">No resources found</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddResource}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl inline-flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Your First Resource
                      </motion.button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                <div className="flex items-center space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleEditResource(resource)}
                                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Edit"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteResource(resource.id)}
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>

                {/* Booking Form Modal */}
                <AnimatePresence>
                  {showBookingForm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                      onClick={() => setShowBookingForm(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="max-w-2xl w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BookingForm
                          resourceId={selectedResource?.id}
                          onBookingComplete={handleBookingComplete}
                          onCancel={() => {
                            setShowBookingForm(false);
                            setSelectedResource(null);
                          }}
                          isAdmin={true}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add/Edit Resource Modal */}
                <AnimatePresence>
                  {showResourceModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                      onClick={() => setShowResourceModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                          {editingResource ? "Edit Resource" : "Add New Resource"}
                        </h3>
                        
                        <form onSubmit={handleResourceSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Resource Name
                            </label>
                            <input
                              type="text"
                              value={resourceForm.name}
                              onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                              placeholder="e.g., Computer Lab 101"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Resource Type
                            </label>
                            <select
                              value={resourceForm.type}
                              onChange={(e) => setResourceForm({...resourceForm, type: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                              required
                            >
                              <option value="">Select type</option>
                              {resourceTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Capacity
                            </label>
                            <input
                              type="number"
                              value={resourceForm.capacity}
                              onChange={(e) => setResourceForm({...resourceForm, capacity: e.target.value})}
                              placeholder="e.g., 50"
                              min="1"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              value={resourceForm.status}
                              onChange={(e) => setResourceForm({...resourceForm, status: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="MAINTENANCE">Under Maintenance</option>
                              <option value="BOOKED">Booked</option>
                            </select>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
                            >
                              {editingResource ? "Update Resource" : "Add Resource"}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => setShowResourceModal(false)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <RequestList 
                refreshTrigger={refreshRequests}
                onRequestUpdate={handleRequestUpdate}
                onForceApprove={handleForceApprove}
                isAdmin={true}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Force Approve Modal */}
      <AnimatePresence>
        {showOverrideModal && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowOverrideModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">Force Approve Booking</h3>
              <p className="text-gray-600 mb-4">
                This booking may conflict with existing bookings. Are you sure you want to force approve?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for override (optional)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter reason for emergency override..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmForceApprove}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-amber-500/30"
                >
                  Force Approve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowOverrideModal(false);
                    setSelectedBooking(null);
                    setOverrideReason("");
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
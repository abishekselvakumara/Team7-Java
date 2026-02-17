import React, { useState } from "react";
import { logout, getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import ResourceTable from "../components/ResourceTable";
import RequestList from "../components/RequestList";
import BookingForm from "../components/BookingForm";
import { motion, AnimatePresence } from "framer-motion";

function StaffDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [activeTab, setActiveTab] = useState("resources");
  const [refreshResources, setRefreshResources] = useState(0);
  const [refreshRequests, setRefreshRequests] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedResource(null);
    setRefreshResources(prev => prev + 1);
    setRefreshRequests(prev => prev + 1);
  };

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
    setShowBookingForm(true);
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
                <h1 className="text-xl font-bold text-gray-800">Staff Portal</h1>
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
              { id: "mybookings", label: "My Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-t-2 border-blue-600'
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
                <ResourceTable 
                  refreshTrigger={refreshResources}
                  onResourceSelect={handleResourceSelect}
                />
                
                {/* Booking Form Modal */}
                <AnimatePresence>
                  {showBookingForm && selectedResource && (
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
                          resourceId={selectedResource.id}
                          onBookingComplete={handleBookingComplete}
                          onCancel={() => {
                            setShowBookingForm(false);
                            setSelectedResource(null);
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <RequestList refreshTrigger={refreshRequests} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StaffDashboard;
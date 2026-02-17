import React, { useState, useEffect } from "react";
import API from "../services/api";
import { getCurrentUser } from "../services/authService";

const RequestList = ({ refreshTrigger, onRequestUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [resources, setResources] = useState({});
  
  const user = getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    fetchRequests();
    if (isAdmin) {
      fetchResources();
    }
  }, [refreshTrigger, filter]);

  const fetchResources = async () => {
    try {
      const res = await API.get("/admin/resources");
      const resourceMap = {};
      res.data.forEach(r => {
        resourceMap[r.id] = r;
      });
      setResources(resourceMap);
    } catch (err) {
      console.error("Error fetching resources:", err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? "/bookings/all" : "/bookings/my";
      const res = await API.get(endpoint);
      
      let filteredData = res.data;
      
      if (filter !== "all") {
        filteredData = filteredData.filter(
          req => req.status.toLowerCase() === filter.toLowerCase()
        );
      }
      
      // Sort by date (most recent first)
      filteredData.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      
      setRequests(filteredData);
      setError("");
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load booking requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/bookings/${id}/approve`);
      fetchRequests();
      if (onRequestUpdate) onRequestUpdate("approved", id);
    } catch (err) {
      console.error("Error approving booking:", err);
      alert("Failed to approve booking");
    }
  };

  const handleReject = (id) => {
    setCurrentBookingId(id);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      await API.put(`/bookings/${currentBookingId}/reject`, {
        reason: rejectionReason
      });
      setShowRejectModal(false);
      setRejectionReason("");
      setCurrentBookingId(null);
      fetchRequests();
      if (onRequestUpdate) onRequestUpdate("rejected", currentBookingId);
    } catch (err) {
      console.error("Error rejecting booking:", err);
      alert("Failed to reject booking");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await API.delete(`/bookings/${id}`);
      fetchRequests();
      if (onRequestUpdate) onRequestUpdate("cancelled", id);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Failed to cancel booking");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500",
      APPROVED: "bg-green-500/20 text-green-300 border-green-500",
      REJECTED: "bg-red-500/20 text-red-300 border-red-500",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500",
      OVERRIDDEN: "bg-purple-500/20 text-purple-300 border-purple-500"
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || colors.PENDING}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: "bg-purple-600",
      STAFF: "bg-blue-600",
      STUDENT: "bg-green-600"
    };
    
    return (
      <span className={`ml-2 px-2 py-0.5 text-xs rounded ${colors[role] || 'bg-gray-600'}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Convert "09:00:00" to "9:00 AM"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-white">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isAdmin ? "All Booking Requests" : "My Bookings"}
        </h2>
        
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1 rounded-lg text-sm capitalize transition
                ${filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg">No booking requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-semibold text-lg">
                      {resources[request.resourceId]?.name || `Resource #${request.resourceId}`}
                    </h3>
                    {getRoleBadge(request.userRole)}
                  </div>
                  <p className="text-sm text-gray-400">
                    Booked by: {request.userName} ({request.userEmail})
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Date</p>
                  <p className="font-medium">{formatDate(request.bookingDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Time</p>
                  <p className="font-medium">
                    {formatTime(request.startTime)} - {formatTime(request.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="font-medium">{request.duration || '?'} mins</p>
                </div>
                <div>
                  <p className="text-gray-400">Resource</p>
                  <p className="font-medium">#{request.resourceId}</p>
                </div>
              </div>

              {request.rejectionReason && (
                <div className="mt-2 text-sm text-red-400 bg-red-500/10 p-2 rounded">
                  <span className="font-semibold">Reason: </span>
                  {request.rejectionReason}
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && request.status === "PENDING" && (
                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Booking Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Booking ID</p>
                  <p className="font-medium">{selectedRequest.id}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
                <div>
                  <p className="text-gray-400">User</p>
                  <p className="font-medium">{selectedRequest.userName}</p>
                  <p className="text-sm text-gray-400">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <p className="text-gray-400">Role</p>
                  <p className="font-medium">{selectedRequest.userRole}</p>
                </div>
                <div>
                  <p className="text-gray-400">Resource</p>
                  <p className="font-medium">
                    {resources[selectedRequest.resourceId]?.name || `Resource #${selectedRequest.resourceId}`}
                  </p>
                  <p className="text-sm text-gray-400">
                    Type: {resources[selectedRequest.resourceId]?.type || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Date & Time</p>
                  <p className="font-medium">{formatDate(selectedRequest.bookingDate)}</p>
                  <p className="text-sm text-gray-400">
                    {formatTime(selectedRequest.startTime)} - {formatTime(selectedRequest.endTime)}
                  </p>
                </div>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500 p-3 rounded">
                  <p className="font-semibold text-red-400">Rejection Reason:</p>
                  <p className="text-red-300">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4 mt-4">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Booking</h3>
            
            <div className="mb-4">
              <label className="block text-sm mb-2">Reason for rejection</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded transition"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setCurrentBookingId(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestList;
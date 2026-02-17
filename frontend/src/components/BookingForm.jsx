import React, { useState, useEffect } from "react";
import API from "../services/api";
import { getCurrentUser } from "../services/authService";

const BookingForm = ({ resourceId, onBookingComplete, onCancel, isAdmin = false }) => {
  const [formData, setFormData] = useState({
    resourceId: resourceId || "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [conflictingSlots, setConflictingSlots] = useState([]);

  const currentUser = getCurrentUser();
  const role = currentUser?.role;

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (formData.resourceId && formData.bookingDate) {
      checkAvailability();
    }
  }, [formData.resourceId, formData.bookingDate]);

  const fetchResources = async () => {
    try {
      let endpoint = "";
      if (role === "ADMIN") {
        endpoint = "/admin/resources";
      } else if (role === "STUDENT") {
        endpoint = "/student/resources";
      } else if (role === "STAFF") {
        endpoint = "/staff/resources";
      }
      
      const res = await API.get(endpoint);
      setResources(res.data);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Failed to load resources");
    }
  };

  const checkAvailability = async () => {
    try {
      const res = await API.get(`/bookings/available-slots`, {
        params: {
          resourceId: formData.resourceId,
          date: formData.bookingDate
        }
      });
      
      if (res.data && res.data.length > 0) {
        setAvailableSlots(res.data);
        // Find conflicting slots (unavailable ones)
        const conflicts = res.data.filter(slot => !slot.available);
        setConflictingSlots(conflicts);
        setShowTimeSlots(true);
      }
    } catch (err) {
      console.error("Error checking availability:", err);
    }
  };

  const selectTimeSlot = (start, end, isAvailable) => {
    if (!isAvailable && isAdmin) {
      // Admin can book unavailable slots (override)
      setFormData({
        ...formData,
        startTime: start,
        endTime: end
      });
      setShowOverrideWarning(true);
      setShowTimeSlots(false);
    } else if (isAvailable) {
      setFormData({
        ...formData,
        startTime: start,
        endTime: end
      });
      setShowTimeSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.resourceId || !formData.bookingDate || !formData.startTime || !formData.endTime) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        resourceId: parseInt(formData.resourceId),
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        emergencyOverride: isAdmin && showOverrideWarning // Flag for emergency override
      };

      const res = await API.post("/bookings", bookingData);
      
      if (isAdmin) {
        setSuccess("Booking created successfully! (Admin override)");
      } else {
        setSuccess("Booking request submitted successfully!");
      }
      
      setTimeout(() => {
        if (onBookingComplete) {
          onBookingComplete();
        }
      }, 1500);
      
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.data || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">
        {isAdmin ? "Admin Booking (Auto-Approved)" : "Book a Resource"}
      </h2>
      
      {isAdmin && (
        <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-300 px-4 py-3 rounded mb-4">
          ⚠️ Admin Mode: Your bookings are automatically approved and can override existing bookings
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Resource <span className="text-red-400">*</span>
          </label>
          <select
            name="resourceId"
            value={formData.resourceId}
            onChange={(e) => {
              setFormData({...formData, resourceId: e.target.value});
              setShowOverrideWarning(false);
            }}
            className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Choose a resource --</option>
            {resources.map(resource => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.type}) - Capacity: {resource.capacity}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            name="bookingDate"
            value={formData.bookingDate}
            onChange={(e) => {
              setFormData({...formData, bookingDate: e.target.value});
              setShowOverrideWarning(false);
            }}
            min={today}
            max={maxDateStr}
            className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Time Slot <span className="text-red-400">*</span>
          </label>
          
          {formData.startTime && formData.endTime ? (
            <div className="bg-blue-600 p-3 rounded-lg mb-2">
              <div className="flex justify-between items-center">
                <span>Selected: {formData.startTime} - {formData.endTime}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({...formData, startTime: "", endTime: ""});
                    setShowTimeSlots(true);
                    setShowOverrideWarning(false);
                  }}
                  className="text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
                >
                  Change
                </button>
              </div>
              {showOverrideWarning && isAdmin && (
                <p className="text-sm text-yellow-300 mt-2">
                  ⚠️ This slot is currently booked. Your admin booking will override it.
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (formData.resourceId && formData.bookingDate) {
                  checkAvailability();
                } else {
                  setError("Please select resource and date first");
                }
              }}
              className="w-full p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-left"
            >
              Check Available Time Slots
            </button>
          )}

          {showTimeSlots && !formData.startTime && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-2">Available time slots:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-900 rounded">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectTimeSlot(slot.startTime, slot.endTime, slot.available)}
                    className={`
                      p-2 text-sm rounded transition relative
                      ${slot.available 
                        ? 'bg-gray-700 hover:bg-green-600 cursor-pointer' 
                        : isAdmin 
                          ? 'bg-yellow-600/20 hover:bg-yellow-600 cursor-pointer border border-yellow-600' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed line-through'
                      }
                    `}
                  >
                    {slot.startTime} - {slot.endTime}
                    {!slot.available && isAdmin && (
                      <span className="absolute -top-1 -right-1 text-xs bg-yellow-600 text-white px-1 rounded">
                        ⚡
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {isAdmin && conflictingSlots.length > 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  ⚡ Yellow slots are booked but you can override them as admin
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Purpose (Optional)
          </label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            rows="3"
            placeholder="Tell us what this booking is for..."
            className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !formData.startTime}
            className={`
              flex-1 py-3 rounded-lg font-medium transition
              ${loading || !formData.startTime
                ? 'bg-blue-400 cursor-not-allowed' 
                : isAdmin 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {loading ? 'Processing...' : isAdmin ? 'Create Admin Booking' : 'Request Booking'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
package com.fsdjava.campus.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fsdjava.campus.dto.BookingResponseDTO;
import com.fsdjava.campus.dto.TimeSlot;
import com.fsdjava.campus.entity.Booking;
import com.fsdjava.campus.entity.User;
import com.fsdjava.campus.repository.BookingRepository;
import com.fsdjava.campus.repository.UserRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    public Booking createBooking(Booking booking, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        booking.setUserId(user.getId());

        // Validate time range
        if (booking.getStartTime().isAfter(booking.getEndTime()) || 
            booking.getStartTime().equals(booking.getEndTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        // Calculate duration in minutes
        long duration = ChronoUnit.MINUTES.between(booking.getStartTime(), booking.getEndTime());

        // Apply role-based rules
        String role = user.getRole();
        
        // STUDENT: max 1 hour per day, only 1 booking per day
        if ("STUDENT".equals(role)) {
            if (duration > 60) {
                throw new RuntimeException("Students can only book for maximum 1 hour");
            }
            
            // Check if student already has a booking on this day
            List<Booking> existingBookings = bookingRepository.findByUserIdAndBookingDate(user.getId(), booking.getBookingDate());
            
            // Filter out rejected or cancelled bookings
            long activeBookings = existingBookings.stream()
                .filter(b -> !"REJECTED".equals(b.getStatus()) && !"CANCELLED".equals(b.getStatus()))
                .count();
                
            if (activeBookings > 0) {
                throw new RuntimeException("Students can only make one booking per day");
            }
        }
        
        // STAFF: max 8 hours per booking
        if ("STAFF".equals(role)) {
            if (duration > 480) { // 8 hours
                throw new RuntimeException("Staff can only book for maximum 8 hours");
            }
        }

        // Check for conflicts (only with APPROVED bookings)
        boolean conflict = isTimeConflict(
                booking.getResourceId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        // ADMIN can override conflicts
        if ("ADMIN".equals(role) || "ROLE_ADMIN".equals(role)) {
            if (conflict) {
                // Find and cancel the conflicting booking
                List<Booking> conflicting = findConflictingBookings(
                    booking.getResourceId(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getEndTime()
                );
                
                for (Booking b : conflicting) {
                    b.setStatus("OVERRIDDEN");
                    b.setRejectionReason("Overridden by admin booking");
                    bookingRepository.save(b);
                }
            }
            
            booking.setStatus("APPROVED");
            return bookingRepository.save(booking);
        }
        
        if (conflict) {
            throw new RuntimeException("Time slot is already booked");
        }

        // Set status based on role
        booking.setStatus("PENDING");

        return bookingRepository.save(booking);
    }

    private boolean isTimeConflict(Long resourceId, LocalDate date, LocalTime start, LocalTime end) {
        List<Booking> existing = bookingRepository.findByResourceIdAndBookingDate(resourceId, date);
        
        for (Booking b : existing) {
            // Only approved bookings cause conflicts
            if ("APPROVED".equals(b.getStatus())) {
                boolean overlap = start.isBefore(b.getEndTime()) && end.isAfter(b.getStartTime());
                if (overlap) {
                    return true;
                }
            }
        }
        return false;
    }
    
    private List<Booking> findConflictingBookings(Long resourceId, LocalDate date, LocalTime start, LocalTime end) {
        List<Booking> existing = bookingRepository.findByResourceIdAndBookingDate(resourceId, date);
        
        return existing.stream()
            .filter(b -> "APPROVED".equals(b.getStatus()))
            .filter(b -> start.isBefore(b.getEndTime()) && end.isAfter(b.getStartTime()))
            .collect(Collectors.toList());
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<BookingResponseDTO> getAllBookingsWithUserInfo() {
        List<Booking> bookings = bookingRepository.findAll();
        return convertToDTOs(bookings);
    }

    public List<Booking> getBookingsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId());
    }

    public List<BookingResponseDTO> getBookingsByUserWithInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Booking> bookings = bookingRepository.findByUserId(user.getId());
        return convertToDTOs(bookings);
    }

    private List<BookingResponseDTO> convertToDTOs(List<Booking> bookings) {
        return bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private BookingResponseDTO convertToDTO(Booking booking) {
        User user = userRepository.findById(booking.getUserId()).orElse(null);
        
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUserId());
        dto.setUserName(user != null ? user.getName() : "Unknown User");
        dto.setUserEmail(user != null ? user.getEmail() : "unknown@email.com");
        dto.setUserRole(user != null ? user.getRole() : "UNKNOWN");
        dto.setResourceId(booking.getResourceId());
        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setStatus(booking.getStatus());
        dto.setRejectionReason(booking.getRejectionReason());
        
        if (booking.getStartTime() != null && booking.getEndTime() != null) {
            long duration = ChronoUnit.MINUTES.between(booking.getStartTime(), booking.getEndTime());
            dto.setDuration(duration);
        }
        
        return dto;
    }

    public Booking approve(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    public Booking reject(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus("REJECTED");
        booking.setRejectionReason(reason);
        return bookingRepository.save(booking);
    }

    public List<TimeSlot> getAvailableTimeSlots(Long resourceId, LocalDate date) {
        List<TimeSlot> availableSlots = new ArrayList<>();
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndBookingDate(resourceId, date);
        
        List<Booking> approvedBookings = existingBookings.stream()
            .filter(b -> "APPROVED".equals(b.getStatus()))
            .collect(Collectors.toList());
        
        LocalTime start = LocalTime.of(8, 0);
        LocalTime end = LocalTime.of(20, 0);
        
        while (start.isBefore(end)) {
            LocalTime slotEnd = start.plusHours(1);
            boolean isAvailable = true;
            
            for (Booking booking : approvedBookings) {
                if (start.isBefore(booking.getEndTime()) && slotEnd.isAfter(booking.getStartTime())) {
                    isAvailable = false;
                    break;
                }
            }
            
            availableSlots.add(new TimeSlot(start.toString(), slotEnd.toString(), isAvailable));
            start = slotEnd;
        }
        
        return availableSlots;
    }
}
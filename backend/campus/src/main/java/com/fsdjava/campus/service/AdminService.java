package com.fsdjava.campus.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fsdjava.campus.entity.Booking;
import com.fsdjava.campus.entity.Resource;
import com.fsdjava.campus.repository.BookingRepository;
import com.fsdjava.campus.repository.ResourceRepository;

@Service
public class AdminService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    // =====================
    // RESOURCES
    // =====================

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Resource addResource(Resource resource) {
        // Validate resource data
        if (resource.getName() == null || resource.getName().trim().isEmpty()) {
            throw new RuntimeException("Resource name is required");
        }
        if (resource.getType() == null || resource.getType().trim().isEmpty()) {
            throw new RuntimeException("Resource type is required");
        }
        if (resource.getCapacity() == null || resource.getCapacity() <= 0) {
            throw new RuntimeException("Valid capacity is required");
        }

        resource.setStatus("AVAILABLE");
        return resourceRepository.save(resource);
    }

    public Resource updateResource(Long id, Resource updated) {

        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        if (updated.getName() != null && !updated.getName().trim().isEmpty()) {
            resource.setName(updated.getName());
        }
        if (updated.getType() != null && !updated.getType().trim().isEmpty()) {
            resource.setType(updated.getType());
        }
        if (updated.getCapacity() != null && updated.getCapacity() > 0) {
            resource.setCapacity(updated.getCapacity());
        }
        if (updated.getStatus() != null) {
            resource.setStatus(updated.getStatus());
        }

        return resourceRepository.save(resource);
    }

    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    // =====================
    // BOOKINGS
    // =====================

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking approveBooking(Long id) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    public Booking rejectBooking(Long id) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        booking.setStatus("REJECTED");
        return bookingRepository.save(booking);
    }
}
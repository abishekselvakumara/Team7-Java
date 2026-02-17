package com.fsdjava.campus.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fsdjava.campus.dto.BookingResponseDTO;
import com.fsdjava.campus.entity.Booking;
import com.fsdjava.campus.entity.Resource;
import com.fsdjava.campus.repository.ResourceRepository;
import com.fsdjava.campus.service.BookingService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private BookingService bookingService;

    @GetMapping("/resources")
    public List<Resource> getResources(Authentication authentication) {
        return resourceRepository.findAll();
    }

    @PostMapping("/resources")
    public Resource addResource(@RequestBody Resource resource) {
        return resourceRepository.save(resource);
    }

    @DeleteMapping("/resources/{id}")
    public void deleteResource(@PathVariable Long id) {
        resourceRepository.deleteById(id);
    }

    @GetMapping("/bookings")
    public List<BookingResponseDTO> getBookings() {
        return bookingService.getAllBookingsWithUserInfo();
    }

    @PutMapping("/bookings/{id}/approve")
    public Booking approve(@PathVariable Long id) {
        return bookingService.approve(id);
    }

    @PutMapping("/bookings/{id}/reject")
    public Booking reject(@PathVariable Long id, @RequestBody(required = false) String reason) {
        String rejectionReason = (reason != null && !reason.isEmpty()) ? reason : "Rejected by admin";
        return bookingService.reject(id, rejectionReason);
    }
}
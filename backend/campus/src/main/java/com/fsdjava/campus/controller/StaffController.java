package com.fsdjava.campus.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fsdjava.campus.dto.BookingResponseDTO;
import com.fsdjava.campus.entity.Booking;
import com.fsdjava.campus.entity.Resource;
import com.fsdjava.campus.repository.ResourceRepository;
import com.fsdjava.campus.service.BookingService;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:5173")
public class StaffController {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private BookingService bookingService;

    @GetMapping("/resources")
    public List<Resource> getResources() {
        return resourceRepository.findAll();
    }

    @GetMapping("/bookings/my")
    public List<BookingResponseDTO> getMyBookings(Authentication authentication) {
        return bookingService.getBookingsByUserWithInfo(authentication.getName());
    }

    @PostMapping("/bookings")
    public Booking createBooking(@RequestBody Booking booking, Authentication authentication) {
        return bookingService.createBooking(booking, authentication.getName());
    }
}
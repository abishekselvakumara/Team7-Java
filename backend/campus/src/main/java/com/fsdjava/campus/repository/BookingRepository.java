package com.fsdjava.campus.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fsdjava.campus.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByStatus(String status);

    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByUserIdAndBookingDate(Long userId, LocalDate bookingDate);

    List<Booking> findByResourceIdAndBookingDate(Long resourceId, LocalDate bookingDate);
    
    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId AND b.bookingDate = :date AND b.status = 'APPROVED'")
    List<Booking> findApprovedBookingsByResourceAndDate(@Param("resourceId") Long resourceId, @Param("date") LocalDate date);
    
    @Query("SELECT b FROM Booking b ORDER BY b.bookingDate DESC, b.startTime ASC")
    List<Booking> findAllOrderByDateDesc();
}
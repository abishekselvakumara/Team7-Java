package com.fsdjava.campus.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fsdjava.campus.config.JwtUtil;
import com.fsdjava.campus.entity.User;
import com.fsdjava.campus.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
    
    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final long LOCK_TIME_DURATION_MINUTES = 1; // 1 minute lock

    public User register(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        String role = user.getRole().toUpperCase();
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }
        
        if (!role.equals("ADMIN") && !role.equals("STUDENT") && !role.equals("STAFF")) {
            throw new RuntimeException("Invalid role. Must be ADMIN, STUDENT, or STAFF");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(role);
        user.setStatus("ACTIVE");
        user.setFailedAttempts(0);
        user.setLockTime(null);
        
        return userRepository.save(user);
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if account is locked
        if (user.getStatus().equals("LOCKED")) {
            if (user.getLockTime() != null) {
                long minutesSinceLock = ChronoUnit.MINUTES.between(user.getLockTime(), LocalDateTime.now());
                long remainingLockMinutes = LOCK_TIME_DURATION_MINUTES - minutesSinceLock;
                
                if (remainingLockMinutes > 0) {
                    throw new RuntimeException("Account is locked. Please try again in " + remainingLockMinutes + " minute(s).");
                } else {
                    // Unlock the account after lock duration
                    user.setStatus("ACTIVE");
                    user.setFailedAttempts(0);
                    user.setLockTime(null);
                    userRepository.save(user);
                }
            }
        }

        // Check password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            // Increment failed attempts
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            
            // Lock account after max failed attempts
            if (user.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setStatus("LOCKED");
                user.setLockTime(LocalDateTime.now());
                userRepository.save(user);
                
                int remainingAttempts = MAX_FAILED_ATTEMPTS - (user.getFailedAttempts() - 1);
                throw new RuntimeException("Account locked due to too many failed attempts. Please try again in 1 minute.");
            }
            
            userRepository.save(user);
            
            int remainingAttempts = MAX_FAILED_ATTEMPTS - user.getFailedAttempts();
            throw new RuntimeException("Invalid credentials. " + remainingAttempts + " attempt(s) remaining before lockout.");
        }

        // Reset failed attempts on successful login
        user.setFailedAttempts(0);
        user.setLockTime(null);
        user.setStatus("ACTIVE");
        userRepository.save(user);

        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }
    
    // Method to manually unlock an account (admin function)
    public void unlockAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setStatus("ACTIVE");
        user.setFailedAttempts(0);
        user.setLockTime(null);
        userRepository.save(user);
    }
    
    // Method to check account status
    public String checkAccountStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getStatus().equals("LOCKED") && user.getLockTime() != null) {
            long minutesSinceLock = ChronoUnit.MINUTES.between(user.getLockTime(), LocalDateTime.now());
            long remainingLockMinutes = LOCK_TIME_DURATION_MINUTES - minutesSinceLock;
            
            if (remainingLockMinutes > 0) {
                return "LOCKED:" + remainingLockMinutes;
            } else {
                return "UNLOCKED";
            }
        }
        return "ACTIVE";
    }
}
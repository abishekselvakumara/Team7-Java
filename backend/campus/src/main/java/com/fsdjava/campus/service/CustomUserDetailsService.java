package com.fsdjava.campus.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.fsdjava.campus.entity.User;
import com.fsdjava.campus.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));

        // Get the role from database (might be "ADMIN" or "ROLE_ADMIN")
        String dbRole = user.getRole();
        
        // Remove ROLE_ prefix if it exists
        if (dbRole.startsWith("ROLE_")) {
            dbRole = dbRole.substring(5);
        }
        
        // Add ROLE_ prefix for Spring Security
        String roleWithPrefix = "ROLE_" + dbRole;

        System.out.println("=== UserDetails ===");
        System.out.println("DB Role: " + user.getRole());
        System.out.println("Cleaned Role: " + dbRole);
        System.out.println("Final Authority: " + roleWithPrefix);
        System.out.println("===================");

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(roleWithPrefix))
        );
    }
}
package com.fsdjava.campus.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fsdjava.campus.entity.Resource;
import com.fsdjava.campus.repository.ResourceRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initResources(ResourceRepository resourceRepository) {
        return args -> {

            // Only insert if table is empty
            if (resourceRepository.count() == 0) {

                Resource lab = new Resource();
                lab.setName("Computer Lab 1");
                lab.setType("LAB");
                lab.setCapacity(40);
                lab.setStatus("AVAILABLE");

                Resource auditorium = new Resource();
                auditorium.setName("Main Auditorium");
                auditorium.setType("HALL");
                auditorium.setCapacity(300);
                auditorium.setStatus("AVAILABLE");

                Resource seminarHall = new Resource();
                seminarHall.setName("Seminar Hall A");
                seminarHall.setType("SEMINAR");
                seminarHall.setCapacity(120);
                seminarHall.setStatus("AVAILABLE");

                Resource meetingRoom = new Resource();
                meetingRoom.setName("Meeting Room 101");
                meetingRoom.setType("MEETING");
                meetingRoom.setCapacity(20);
                meetingRoom.setStatus("AVAILABLE");

                resourceRepository.saveAll(
                        List.of(lab, auditorium, seminarHall, meetingRoom)
                );

                System.out.println("✅ Default Resources Created");
            }
        };
    }
}

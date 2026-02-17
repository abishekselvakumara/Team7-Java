package com.fsdjava.campus.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.fsdjava.campus.entity.Resource;
import com.fsdjava.campus.repository.ResourceRepository;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentController {

    @Autowired
    private ResourceRepository resourceRepository;

    // Student can view resources
    @GetMapping("/resources")
    public List<Resource> getResources() {
        return resourceRepository.findAll();
    }
}

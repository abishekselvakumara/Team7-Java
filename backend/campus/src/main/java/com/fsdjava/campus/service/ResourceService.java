package com.fsdjava.campus.service;

import com.fsdjava.campus.entity.Resource;
import com.fsdjava.campus.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    public Resource addResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Resource updateStatus(Long id, String status) {
        Resource resource = resourceRepository.findById(id).orElseThrow();
        resource.setStatus(status);
        return resourceRepository.save(resource);
    }
}

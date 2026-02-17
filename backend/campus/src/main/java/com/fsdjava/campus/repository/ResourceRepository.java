package com.fsdjava.campus.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fsdjava.campus.entity.Resource;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
}

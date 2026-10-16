package com.school.student.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

/**
 * Best-effort client used to clean up a deleted student's records in other
 * services that cache student-specific data locally (e.g. marks). A failure
 * here must never block the student deletion itself.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicServiceClient {

    @Qualifier("loadBalancedRestTemplate")
    private final RestTemplate loadBalancedRestTemplate;

    @Qualifier("restTemplate")
    private final RestTemplate directRestTemplate;

    private static final String LB_BASE = "http://ACADEMIC-SERVICE/api/academic";
    private static final String DIRECT_BASE = "http://localhost:8083/api/academic";

    public void deleteMarksForStudent(Long studentId) {
        URI lbUri = URI.create(LB_BASE + "/marks/student/" + studentId);
        try {
            loadBalancedRestTemplate.exchange(lbUri, HttpMethod.DELETE, null, Void.class);
            return;
        } catch (Exception e1) {
            try {
                URI directUri = URI.create(DIRECT_BASE + "/marks/student/" + studentId);
                directRestTemplate.exchange(directUri, HttpMethod.DELETE, null, Void.class);
            } catch (Exception e2) {
                log.warn("Failed to delete marks for deleted student id {}: {}", studentId, e2.getMessage());
            }
        }
    }
}

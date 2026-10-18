package com.school.auth.controller;

import com.school.auth.dto.FeatureToggleDTO;
import com.school.auth.service.FeatureToggleService;
import com.school.common.dto.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Lets the frontend ask "is module X visible for role Y" and lets Admin flip those switches.
 * Endpoint-level role restriction is in SecurityConfig: the GET below is open to any
 * authenticated user (every portal needs its own toggles), the rest are ADMIN only.
 */
@RestController
@RequestMapping("/api/auth/feature-toggles")
@RequiredArgsConstructor
public class FeatureToggleController {

    private final FeatureToggleService featureToggleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureToggleDTO>>> getForRole(@RequestParam("role") String role) {
        return ResponseEntity.ok(ApiResponse.success(featureToggleService.getTogglesForRole(role)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<FeatureToggleDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(featureToggleService.getAllToggles()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<FeatureToggleDTO>> setToggle(@RequestBody SetToggleRequest request) {
        FeatureToggleDTO updated = featureToggleService.setToggle(request.getRole(), request.getModuleKey(), request.isEnabled());
        return ResponseEntity.ok(ApiResponse.success("Module access updated", updated));
    }

    @Data
    public static class SetToggleRequest {
        @NotBlank
        private String role;
        @NotBlank
        private String moduleKey;
        private boolean enabled;
    }
}

package com.school.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParentLoginRequest {

    @NotBlank(message = "Parent login phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    private String password;
}

package com.school.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for user login.
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Email or phone number is required")
    private String email;

    private String phoneNumber;

    @NotBlank(message = "Password is required")
    private String password;
}

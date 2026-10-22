package io.mura.auth;

import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.member.dto.AccountResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // The account as it stands right now, role and all. The client reads
    // it on load rather than trusting what it stored at sign-in: a role
    // can have been taken away since.
    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(authService.me(userId));
    }
}

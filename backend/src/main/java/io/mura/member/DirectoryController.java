package io.mura.member;

import io.mura.member.dto.KnownUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/directory")
@RequiredArgsConstructor
public class DirectoryController {

    private final DirectoryService directoryService;

    @GetMapping
    public ResponseEntity<List<KnownUserResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(directoryService.listKnownTo(userId));
    }
}

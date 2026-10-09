package com.taste.backend.experience;

import com.taste.backend.experience.dto.ExperienceRequest;
import com.taste.backend.experience.dto.ExperienceResponse;
import com.taste.backend.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {

    private final ExperienceService experienceService;

    public ExperienceController(ExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @GetMapping
    public List<ExperienceResponse> list(@AuthenticationPrincipal CurrentUser currentUser) {
        return experienceService.listForUser(currentUser.userId());
    }

    @GetMapping("/{id}")
    public ExperienceResponse get(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id) {
        return experienceService.getOwned(currentUser.userId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExperienceResponse create(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody ExperienceRequest request) {
        return experienceService.create(currentUser.userId(), request);
    }

    @PutMapping("/{id}")
    public ExperienceResponse update(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ExperienceRequest request
    ) {
        return experienceService.update(currentUser.userId(), id, request);
    }

    @PatchMapping("/{id}/favorite")
    public ExperienceResponse toggleFavorite(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id) {
        return experienceService.toggleFavorite(currentUser.userId(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id) {
        experienceService.delete(currentUser.userId(), id);
    }
}

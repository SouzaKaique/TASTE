package com.taste.backend.user;

import com.taste.backend.experience.ExperienceService;
import com.taste.backend.experience.dto.ExperienceResponse;
import com.taste.backend.security.CurrentUser;
import com.taste.backend.user.dto.UpdateProfileRequest;
import com.taste.backend.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final ExperienceService experienceService;

    public UserController(UserService userService, ExperienceService experienceService) {
        this.userService = userService;
        this.experienceService = experienceService;
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal CurrentUser currentUser) {
        return userService.getProfile(currentUser.userId());
    }

    @PatchMapping("/me")
    public UserResponse updateMe(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(currentUser.userId(), request);
    }

    @GetMapping("/{username}")
    public UserResponse byUsername(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String username) {
        return userService.getPublicProfile(currentUser.userId(), username);
    }

    /** Experiencias de um usuario que quem esta vendo tem permissao de ver. */
    @GetMapping("/{username}/experiences")
    public List<ExperienceResponse> experiences(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String username) {
        return experienceService.listVisibleForUser(currentUser.userId(), username);
    }
}

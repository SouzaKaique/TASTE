package com.taste.backend.user;

import com.taste.backend.security.CurrentUser;
import com.taste.backend.user.dto.UpdateProfileRequest;
import com.taste.backend.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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
    public UserResponse byUsername(@PathVariable String username) {
        return userService.getPublicProfile(username);
    }
}

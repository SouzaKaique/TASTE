package com.taste.backend.social;

import com.taste.backend.security.CurrentUser;
import com.taste.backend.social.dto.UserSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendshipController {

    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @GetMapping
    public List<UserSummaryResponse> friends(@AuthenticationPrincipal CurrentUser currentUser) {
        return friendshipService.friends(currentUser.userId());
    }

    @GetMapping("/requests")
    public List<UserSummaryResponse> pendingReceived(@AuthenticationPrincipal CurrentUser currentUser) {
        return friendshipService.pendingReceived(currentUser.userId());
    }

    @GetMapping("/search")
    public List<UserSummaryResponse> search(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(name = "q", required = false) String term
    ) {
        return friendshipService.search(currentUser.userId(), term);
    }

    @PostMapping("/{userId}")
    public UserSummaryResponse sendRequest(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long userId) {
        return friendshipService.sendRequest(currentUser.userId(), userId);
    }

    @PostMapping("/{userId}/accept")
    public UserSummaryResponse accept(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long userId) {
        return friendshipService.accept(currentUser.userId(), userId);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long userId) {
        friendshipService.remove(currentUser.userId(), userId);
    }
}

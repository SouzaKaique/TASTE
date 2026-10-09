package com.taste.backend.social;

import com.taste.backend.security.CurrentUser;
import com.taste.backend.social.dto.CommentRequest;
import com.taste.backend.social.dto.FeedItemResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping("/feed")
    public List<FeedItemResponse> feed(@AuthenticationPrincipal CurrentUser currentUser) {
        return feedService.feed(currentUser.userId());
    }

    @PostMapping("/experiences/{id}/like")
    public FeedItemResponse toggleLike(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id) {
        return feedService.toggleLike(currentUser.userId(), id);
    }

    @PostMapping("/experiences/{id}/comments")
    public FeedItemResponse addComment(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request
    ) {
        return feedService.addComment(currentUser.userId(), id, request.text());
    }

    @DeleteMapping("/experiences/{id}/comments/{commentId}")
    public FeedItemResponse removeComment(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long id,
            @PathVariable Long commentId
    ) {
        return feedService.removeComment(currentUser.userId(), id, commentId);
    }
}

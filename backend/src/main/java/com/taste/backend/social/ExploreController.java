package com.taste.backend.social;

import com.taste.backend.security.CurrentUser;
import com.taste.backend.social.dto.FeedItemResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/** Tela Descobrir: grade de fotos de pratos e ranking de lugares em alta. */
@RestController
@RequestMapping("/api/explore")
public class ExploreController {

    private final FeedService feedService;

    public ExploreController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    public List<FeedItemResponse> explore(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(value = "beforeAt", required = false) Instant beforeAt,
            @RequestParam(value = "beforeId", required = false) Long beforeId,
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        return feedService.explore(currentUser.userId(), beforeAt, beforeId, limit);
    }

    @GetMapping("/places")
    public List<FeedService.PlaceRanking> places(@RequestParam(value = "city", required = false) String city) {
        return feedService.topPlaces(city);
    }
}

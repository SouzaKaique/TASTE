package com.taste.backend.push;

import com.taste.backend.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushController {

    /** Formato do PushSubscription.toJSON() do navegador. */
    public record SubscriptionRequest(
            @NotBlank @Size(max = 1000) String endpoint,
            @NotNull @Valid Keys keys
    ) {
        public record Keys(@NotBlank @Size(max = 200) String p256dh, @NotBlank @Size(max = 100) String auth) { }
    }

    public record EndpointRequest(@NotBlank @Size(max = 1000) String endpoint) { }

    private final PushService pushService;

    public PushController(PushService pushService) {
        this.pushService = pushService;
    }

    @GetMapping("/public-key")
    public Map<String, String> publicKey() {
        return Map.of("publicKey", pushService.publicKey());
    }

    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody SubscriptionRequest request) {
        pushService.subscribe(currentUser.userId(), request.endpoint(), request.keys().p256dh(), request.keys().auth());
    }

    @PostMapping("/subscriptions/remove")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@AuthenticationPrincipal CurrentUser currentUser, @Valid @RequestBody EndpointRequest request) {
        pushService.unsubscribe(currentUser.userId(), request.endpoint());
    }
}

package com.taste.backend.notification;

import com.taste.backend.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal CurrentUser currentUser) {
        return notificationService.list(currentUser.userId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal CurrentUser currentUser) {
        return Map.of("count", notificationService.unreadCount(currentUser.userId()));
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal CurrentUser currentUser) {
        notificationService.markAllRead(currentUser.userId());
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Long id) {
        notificationService.markRead(currentUser.userId(), id);
    }
}

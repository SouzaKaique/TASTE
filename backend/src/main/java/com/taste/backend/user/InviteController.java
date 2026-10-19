package com.taste.backend.user;

import com.taste.backend.security.CurrentUser;
import com.taste.backend.social.dto.UserSummaryResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    /** Meu codigo de convite (criado na primeira chamada). */
    @PostMapping("/api/invites/me")
    public InviteService.InviteCode myCode(@AuthenticationPrincipal CurrentUser currentUser) {
        return inviteService.codeFor(currentUser.userId());
    }

    /** Quem esta convidando (publico: a pagina do convite abre antes do login). */
    @GetMapping("/api/public/invites/{code}")
    public InviteService.Inviter inviter(@PathVariable String code) {
        return inviteService.inviter(code);
    }

    /** Quem ja tem conta aceita o convite e vira amigo de quem convidou. */
    @PostMapping("/api/invites/{code}/accept")
    public UserSummaryResponse accept(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable String code) {
        return inviteService.accept(currentUser.userId(), code);
    }
}

package com.taste.backend.user.social;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/auth/social")
public class SocialAuthController {

    public record ResultRequest(@NotBlank String verifier) {
    }

    public record LinkRequest(@NotBlank String verifier, @NotBlank String password) {
    }

    private final SocialAuthService socialAuth;

    public SocialAuthController(SocialAuthService socialAuth) {
        this.socialAuth = socialAuth;
    }

    /** Quais botoes o site deve mostrar. */
    @GetMapping("/providers")
    public SocialAuthService.Providers providers() {
        return socialAuth.providers();
    }

    @GetMapping("/{provider}/start")
    public ResponseEntity<Void> start(
            @PathVariable String provider,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String origin,
            @RequestParam(defaultValue = "false") boolean janela
    ) {
        String requestBaseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        String url = socialAuth.start(SocialProvider.fromPath(provider), state, origin, janela, requestBaseUrl);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    /** Para onde o Google e a Apple devolvem a pessoa, com um formulario auto-enviado. */
    @PostMapping(path = "/{provider}/callback", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> callback(
            @PathVariable String provider,
            @RequestParam(required = false) String state,
            @RequestParam(name = "id_token", required = false) String idToken,
            @RequestParam(required = false) String user,
            @RequestParam(required = false) String error
    ) {
        String next = socialAuth.callback(SocialProvider.fromPath(provider), state, idToken, user, error);
        if (next == null) {
            return ResponseEntity.badRequest().body("Este login expirou. Volte ao TASTE e comece de novo.");
        }
        return ResponseEntity.status(HttpStatus.SEE_OTHER).location(URI.create(next)).build();
    }

    @PostMapping("/result")
    public SocialAuthService.Result result(@Valid @RequestBody ResultRequest request) {
        return socialAuth.result(request.verifier());
    }

    @PostMapping("/link")
    public SocialAuthService.Result link(@Valid @RequestBody LinkRequest request) {
        return socialAuth.link(request.verifier(), request.password());
    }
}

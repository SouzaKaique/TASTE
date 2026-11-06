package com.taste.backend.user.social;

/** Quem o Google ou a Apple garantem que a pessoa e, depois de conferida a assinatura do token. */
public record VerifiedIdentity(
        SocialProvider provider,
        String subject,
        String email,
        boolean emailVerified,
        String name
) {
}

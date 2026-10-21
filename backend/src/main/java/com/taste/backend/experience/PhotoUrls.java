package com.taste.backend.experience;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.regex.Pattern;

/**
 * Endereco proprio para cada foto, no lugar do texto base64 dentro do JSON.
 * O celular baixa a imagem separada, so quando ela aparece na tela, e guarda em cache.
 *
 * Formato: /api/public/photos/{id}?v={versao}&s={assinatura}
 * - versao muda quando a foto muda (o cache antigo nao e reaproveitado);
 * - assinatura (HMAC) impede adivinhar o endereco de fotos de outras pessoas.
 */
@Component
public class PhotoUrls {

    /** So fotos enviadas pelo app: JPEG, PNG ou WebP em base64. */
    private static final Pattern DATA_URI = Pattern.compile("^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=\\s]+$");

    private final byte[] key;

    public PhotoUrls(@Value("${taste.jwt.secret}") String secret) {
        this.key = ("photos:" + secret).getBytes(StandardCharsets.UTF_8);
    }

    /** Endereco da foto para as respostas da API (ou null se nao houver foto). */
    public String urlFor(Experience e) {
        String photo = e.getPhotoUrl();
        if (photo == null || photo.isBlank()) {
            return null;
        }
        String version = version(photo);
        return "/api/public/photos/" + e.getId() + "?v=" + version + "&s=" + sign(e.getId(), version);
    }

    public boolean isValid(Long id, String version, String signature) {
        return version != null && signature != null
                && MessageDigest.isEqual(sign(id, version).getBytes(StandardCharsets.US_ASCII), signature.getBytes(StandardCharsets.US_ASCII));
    }

    public static String version(String photo) {
        return Integer.toHexString(photo.hashCode());
    }

    /** Foto nova vinda do app. */
    public static boolean isUpload(String value) {
        return value != null && value.length() < 3_000_000 && DATA_URI.matcher(value).matches();
    }

    /** O app devolveu o endereco da foto que ja existe (edicao sem trocar a foto). */
    public static boolean isOwnUrl(String value, Long experienceId) {
        return value != null && experienceId != null && value.contains("/api/public/photos/" + experienceId + "?");
    }

    private String sign(Long id, String version) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] digest = mac.doFinal((id + "." + version).getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest).substring(0, 22);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}

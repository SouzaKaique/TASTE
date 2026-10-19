package com.taste.backend.push;

import org.junit.jupiter.api.Test;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.Signature;
import java.util.Arrays;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Confere a cifra do Web Push fazendo o papel do navegador (decifrar) e a assinatura VAPID.
 * O formato tambem foi conferido manualmente com a implementacao de referencia (http_ece).
 */
class WebPushCryptoTests {

    @Test
    void navegadorConsegueDecifrarAMensagem() throws Exception {
        KeyPair browser = WebPushCrypto.generateKeyPair();
        byte[] auth = new byte[16];
        new java.security.SecureRandom().nextBytes(auth);
        byte[] message = "{\"title\":\"Marina curtiu seu prato\",\"body\":\"Ramen tonkotsu\"}".getBytes(StandardCharsets.UTF_8);

        byte[] body = WebPushCrypto.encrypt(message, WebPushCrypto.rawPublicKey(browser.getPublic()), auth);

        assertThat(decrypt(body, browser, auth)).isEqualTo(message);
    }

    @Test
    void tokenVapidTemFormatoDeJwtEAssinaturaValida() throws Exception {
        KeyPair vapid = WebPushCrypto.generateKeyPair();
        String jwt = WebPushCrypto.vapidJwt("https://fcm.googleapis.com", "https://taste-eight-theta.vercel.app", 1_900_000_000L, vapid.getPrivate());

        String[] parts = jwt.split("\\.");
        assertThat(parts).hasSize(3);
        assertThat(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8))
                .contains("\"aud\":\"https://fcm.googleapis.com\"");
        byte[] signature = Base64.getUrlDecoder().decode(parts[2]);
        assertThat(signature).hasSize(64); // R || S, como o JWT exige

        Signature verifier = Signature.getInstance("SHA256withECDSAinP1363Format");
        verifier.initVerify(vapid.getPublic());
        verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        assertThat(verifier.verify(signature)).isTrue();
    }

    @Test
    void chavePublicaVaiEVoltaDoFormatoDoNavegador() {
        KeyPair pair = WebPushCrypto.generateKeyPair();
        byte[] raw = WebPushCrypto.rawPublicKey(pair.getPublic());
        assertThat(raw).hasSize(65);
        assertThat(WebPushCrypto.rawPublicKey(WebPushCrypto.publicKeyFromRaw(raw))).isEqualTo(raw);
    }

    @Test
    void soAceitaServicosDePushConhecidos() {
        PushService.validateEndpoint("https://fcm.googleapis.com/fcm/send/abc");
        PushService.validateEndpoint("https://web.push.apple.com/QF8x");
        PushService.validateEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x");
        assertThatThrownBy(() -> PushService.validateEndpoint("https://evil.example/fcm.googleapis.com")).isNotNull();
        assertThatThrownBy(() -> PushService.validateEndpoint("http://fcm.googleapis.com/x")).isNotNull();
        assertThatThrownBy(() -> PushService.validateEndpoint("https://fcm.googleapis.com.evil.example/x")).isNotNull();
    }

    /** Lado do navegador (RFC 8291), escrito separado da cifra. */
    private static byte[] decrypt(byte[] body, KeyPair browser, byte[] auth) throws Exception {
        ByteBuffer buf = ByteBuffer.wrap(body);
        byte[] salt = new byte[16];
        buf.get(salt);
        int recordSize = buf.getInt();
        int keyLength = buf.get() & 0xff;
        byte[] serverPublic = new byte[keyLength];
        buf.get(serverPublic);
        byte[] ciphertext = new byte[buf.remaining()];
        buf.get(ciphertext);
        assertThat(recordSize).isEqualTo(4096);

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(browser.getPrivate());
        agreement.doPhase(WebPushCrypto.publicKeyFromRaw(serverPublic), true);
        byte[] ecdh = agreement.generateSecret();

        byte[] browserPublic = WebPushCrypto.rawPublicKey(browser.getPublic());
        byte[] keyInfo = new byte[14 + 65 + 65];
        System.arraycopy("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), 0, keyInfo, 0, 14);
        System.arraycopy(browserPublic, 0, keyInfo, 14, 65);
        System.arraycopy(serverPublic, 0, keyInfo, 79, 65);
        byte[] ikm = WebPushCrypto.hkdf(auth, ecdh, keyInfo, 32);
        byte[] cek = WebPushCrypto.hkdf(salt, ikm, "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), 16);
        byte[] nonce = WebPushCrypto.hkdf(salt, ikm, "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), 12);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] padded = cipher.doFinal(ciphertext);
        assertThat(padded[padded.length - 1]).isEqualTo((byte) 0x02); // ultimo registro
        return Arrays.copyOf(padded, padded.length - 1);
    }
}

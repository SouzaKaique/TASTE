package com.taste.backend.push;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.interfaces.ECPublicKey;
import java.security.spec.*;
import java.util.Arrays;
import java.util.Base64;

/**
 * Criptografia do Web Push feita so com o Java (sem bibliotecas externas):
 * - RFC 8291: cifra a mensagem para o navegador (ECDH + HKDF + AES-128-GCM, "aes128gcm");
 * - RFC 8292: assina o token VAPID (ES256) que identifica o TASTE no servico de push.
 */
public final class WebPushCrypto {

    private static final int RECORD_SIZE = 4096;
    private static final ECParameterSpec P256 = p256();

    private WebPushCrypto() {
    }

    // ---------- Chaves ----------

    public static KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"));
            return generator.generateKeyPair();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Ponto publico "nao comprimido" (0x04 || X || Y, 65 bytes), o formato que o navegador usa. */
    public static byte[] rawPublicKey(PublicKey key) {
        ECPoint w = ((ECPublicKey) key).getW();
        byte[] out = new byte[65];
        out[0] = 0x04;
        copyUnsigned(w.getAffineX(), out, 1);
        copyUnsigned(w.getAffineY(), out, 33);
        return out;
    }

    public static PublicKey publicKeyFromRaw(byte[] raw) {
        if (raw.length != 65 || raw[0] != 0x04) {
            throw new IllegalArgumentException("Chave publica invalida.");
        }
        try {
            ECPoint point = new ECPoint(new BigInteger(1, Arrays.copyOfRange(raw, 1, 33)), new BigInteger(1, Arrays.copyOfRange(raw, 33, 65)));
            return KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, P256));
        } catch (GeneralSecurityException e) {
            throw new IllegalArgumentException("Chave publica invalida.", e);
        }
    }

    public static PrivateKey privateKeyFromPkcs8(byte[] pkcs8) {
        try {
            return KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
        } catch (GeneralSecurityException e) {
            throw new IllegalArgumentException("Chave privada invalida.", e);
        }
    }

    // ---------- RFC 8291: cifrar a mensagem ----------

    /** Corpo pronto para enviar com "Content-Encoding: aes128gcm". */
    public static byte[] encrypt(byte[] plaintext, byte[] uaPublicRaw, byte[] authSecret) {
        return encrypt(plaintext, uaPublicRaw, authSecret, generateKeyPair(), randomBytes(16));
    }

    /** Versao com chave efemera e salt fixos (usada nos testes). */
    static byte[] encrypt(byte[] plaintext, byte[] uaPublicRaw, byte[] authSecret, KeyPair asKeys, byte[] salt) {
        try {
            byte[] asPublicRaw = rawPublicKey(asKeys.getPublic());

            KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
            agreement.init(asKeys.getPrivate());
            agreement.doPhase(publicKeyFromRaw(uaPublicRaw), true);
            byte[] ecdhSecret = agreement.generateSecret();

            // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info" || 0x00 || ua_public || as_public, 32)
            byte[] keyInfo = concat("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), uaPublicRaw, asPublicRaw);
            byte[] ikm = hkdf(authSecret, ecdhSecret, keyInfo, 32);

            byte[] cek = hkdf(salt, ikm, "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), 16);
            byte[] nonce = hkdf(salt, ikm, "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), 12);

            // Um unico registro: mensagem + delimitador 0x02 (ultimo registro), sem preenchimento
            byte[] padded = concat(plaintext, new byte[]{0x02});
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
            byte[] ciphertext = cipher.doFinal(padded);

            ByteBuffer header = ByteBuffer.allocate(16 + 4 + 1 + asPublicRaw.length);
            header.put(salt).putInt(RECORD_SIZE).put((byte) asPublicRaw.length).put(asPublicRaw);
            return concat(header.array(), ciphertext);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao cifrar a notificacao.", e);
        }
    }

    // ---------- RFC 8292: token VAPID ----------

    /** JWT ES256 com o publico (origem do servico de push), validade e contato. */
    public static String vapidJwt(String audience, String subject, long expiresAtEpochSeconds, PrivateKey privateKey) {
        try {
            String header = b64url("{\"typ\":\"JWT\",\"alg\":\"ES256\"}".getBytes(StandardCharsets.UTF_8));
            String claims = b64url(("{\"aud\":\"" + audience + "\",\"exp\":" + expiresAtEpochSeconds
                    + ",\"sub\":\"" + subject + "\"}").getBytes(StandardCharsets.UTF_8));
            String signingInput = header + "." + claims;
            // Formato P1363 = R || S (64 bytes), que e o que o JWT exige
            Signature signature = Signature.getInstance("SHA256withECDSAinP1363Format");
            signature.initSign(privateKey);
            signature.update(signingInput.getBytes(StandardCharsets.US_ASCII));
            return signingInput + "." + b64url(signature.sign());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Falha ao assinar o token VAPID.", e);
        }
    }

    // ---------- Utilitarios ----------

    public static String b64url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static byte[] fromB64url(String text) {
        return Base64.getUrlDecoder().decode(text.trim().replace('+', '-').replace('/', '_').replace("=", ""));
    }

    /** HKDF-SHA256 com um unico bloco de saida (ate 32 bytes), que e tudo o que o Web Push usa. */
    static byte[] hkdf(byte[] salt, byte[] ikm, byte[] info, int length) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(salt, "HmacSHA256"));
        byte[] prk = mac.doFinal(ikm);
        mac.init(new SecretKeySpec(prk, "HmacSHA256"));
        mac.update(info);
        mac.update((byte) 0x01);
        return Arrays.copyOf(mac.doFinal(), length);
    }

    private static byte[] randomBytes(int n) {
        byte[] out = new byte[n];
        new SecureRandom().nextBytes(out);
        return out;
    }

    private static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] p : parts) {
            out.writeBytes(p);
        }
        return out.toByteArray();
    }

    private static void copyUnsigned(BigInteger value, byte[] target, int offset) {
        byte[] bytes = value.toByteArray();
        int start = bytes.length > 32 ? bytes.length - 32 : 0;
        int len = bytes.length - start;
        System.arraycopy(bytes, start, target, offset + 32 - len, len);
    }

    private static ECParameterSpec p256() {
        try {
            AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
            params.init(new ECGenParameterSpec("secp256r1"));
            return params.getParameterSpec(ECParameterSpec.class);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}

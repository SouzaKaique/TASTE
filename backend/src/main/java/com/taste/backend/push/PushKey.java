package com.taste.backend.push;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Par de chaves VAPID do TASTE (identifica o servidor junto ao Google, Apple e Mozilla).
 * Gerado sozinho na primeira vez e guardado no banco: nao exige configuracao no Render.
 */
@Entity
@Table(name = "push_key")
public class PushKey {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    /** Ponto publico nao comprimido, em base64url (vai para o navegador). */
    @Column(nullable = false, length = 120)
    private String publicKey;

    /** Chave privada PKCS8 em base64url (nunca sai do servidor). */
    @Column(nullable = false, length = 300)
    private String privateKey;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PushKey() {
    }

    public PushKey(String publicKey, String privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public String getPrivateKey() {
        return privateKey;
    }
}

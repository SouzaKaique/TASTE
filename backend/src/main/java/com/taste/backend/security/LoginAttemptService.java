package com.taste.backend.security;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limita tentativas de login erradas por e-mail, para impedir que alguem teste
 * milhares de senhas numa mesma conta. Em memoria: suficiente para uma instancia.
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 8;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_TRACKED = 10_000;

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    public boolean isBlocked(String email) {
        Deque<Instant> attempts = failures.get(key(email));
        if (attempts == null) {
            return false;
        }
        synchronized (attempts) {
            prune(attempts);
            return attempts.size() >= MAX_FAILURES;
        }
    }

    public void recordFailure(String email) {
        if (failures.size() > MAX_TRACKED) {
            failures.clear();
        }
        Deque<Instant> attempts = failures.computeIfAbsent(key(email), k -> new ArrayDeque<>());
        synchronized (attempts) {
            prune(attempts);
            attempts.addLast(Instant.now());
        }
    }

    public void recordSuccess(String email) {
        failures.remove(key(email));
    }

    private static void prune(Deque<Instant> attempts) {
        Instant limit = Instant.now().minus(WINDOW);
        while (!attempts.isEmpty() && attempts.peekFirst().isBefore(limit)) {
            attempts.pollFirst();
        }
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}

package com.taste.backend.user;

import com.taste.backend.common.BadRequestException;
import com.taste.backend.common.NotFoundException;
import com.taste.backend.common.TooManyRequestsException;
import com.taste.backend.security.LoginAttemptService;
import com.taste.backend.experience.ExperienceRepository;
import com.taste.backend.security.JwtService;
import com.taste.backend.social.FriendshipService;
import com.taste.backend.user.dto.*;
import com.taste.backend.user.social.SocialProvider;
import com.taste.backend.user.social.VerifiedIdentity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final FriendshipService friendshipService;
    private final LoginAttemptService loginAttempts;

    /** Hash valido usado quando o e-mail nao existe, para o tempo de resposta nao revelar quais contas existem. */
    private final String dummyHash;

    public UserService(UserRepository userRepository, ExperienceRepository experienceRepository, PasswordEncoder passwordEncoder, JwtService jwtService, FriendshipService friendshipService, LoginAttemptService loginAttempts) {
        this.userRepository = userRepository;
        this.experienceRepository = experienceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.friendshipService = friendshipService;
        this.loginAttempts = loginAttempts;
        this.dummyHash = passwordEncoder.encode("taste-dummy-password-for-timing");
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Este e-mail já está cadastrado.");
        }
        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new BadRequestException("Este username já está em uso.");
        }

        User user = new User();
        user.setDisplayName(request.displayName());
        user.setUsername(request.username().toLowerCase());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        user = userRepository.save(user);

        // Chegou por um link de convite: ja vira amigo de quem convidou
        if (request.inviteCode() != null && !request.inviteCode().isBlank()) {
            Long newUserId = user.getId();
            userRepository.findByInviteCode(request.inviteCode().trim())
                    .ifPresent(inviter -> friendshipService.connectByInvite(newUserId, inviter.getId()));
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        if (loginAttempts.isBlocked(request.email())) {
            throw new TooManyRequestsException("Muitas tentativas de login. Aguarde alguns minutos e tente de novo.");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        if (!passwordMatches(user, request.password())) {
            loginAttempts.recordFailure(request.email());
            throw new BadCredentialsException("E-mail ou senha inválidos.");
        }
        loginAttempts.recordSuccess(request.email());

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    /** Resultado do login social: entrou (session) ou precisa confirmar a senha da conta que ja usa o e-mail (linkEmail). */
    public record SocialLogin(AuthResponse session, boolean newAccount, String linkEmail) {
    }

    /**
     * Entra com uma identidade ja conferida do Google ou da Apple, criando a conta na primeira vez.
     * O cadastro por senha nao confirma o e-mail, entao ligar automaticamente a uma conta com senha deixaria
     * entrar quem a criou usando o e-mail de outra pessoa: nesse caso a senha precisa ser confirmada (ver linkSocial).
     */
    public SocialLogin loginWithSocial(VerifiedIdentity identity) {
        Optional<User> linked = identity.provider() == SocialProvider.GOOGLE
                ? userRepository.findByGoogleSub(identity.subject())
                : userRepository.findByAppleSub(identity.subject());
        if (linked.isPresent()) {
            return new SocialLogin(session(linked.get()), false, null);
        }

        if (identity.email() == null || !identity.emailVerified()) {
            throw new BadRequestException("Não recebemos um e-mail confirmado dessa conta. Confirme o e-mail nela e tente de novo.");
        }
        User existing = userRepository.findByEmailIgnoreCase(identity.email()).orElse(null);
        if (existing != null && existing.getPasswordHash() != null) {
            return new SocialLogin(null, false, existing.getEmail());
        }
        if (existing != null) {
            attach(existing, identity);
            return new SocialLogin(session(existing), false, null);
        }

        User user = new User();
        user.setDisplayName(displayNameFor(identity));
        user.setUsername(uniqueUsername(identity));
        user.setEmail(identity.email().toLowerCase(Locale.ROOT));
        attach(user, identity);
        user = userRepository.save(user);
        return new SocialLogin(session(user), true, null);
    }

    /** Liga o Google/Apple a uma conta com senha, depois de a pessoa provar que a senha e dela. */
    public AuthResponse linkSocial(VerifiedIdentity identity, String password) {
        if (loginAttempts.isBlocked(identity.email())) {
            throw new TooManyRequestsException("Muitas tentativas de login. Aguarde alguns minutos e tente de novo.");
        }
        User user = userRepository.findByEmailIgnoreCase(identity.email()).orElse(null);
        if (!passwordMatches(user, password)) {
            loginAttempts.recordFailure(identity.email());
            throw new BadCredentialsException("Senha incorreta.");
        }
        loginAttempts.recordSuccess(identity.email());
        attach(user, identity);
        return session(user);
    }

    /** Sempre roda a comparacao, mesmo sem conta ou sem senha: o tempo de resposta nao revela quais contas existem. */
    private boolean passwordMatches(User user, String password) {
        String hash = user != null ? user.getPasswordHash() : null;
        boolean matches = passwordEncoder.matches(password, hash != null ? hash : dummyHash);
        return hash != null && matches;
    }

    private AuthResponse session(User user) {
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toResponse(user));
    }

    private void attach(User user, VerifiedIdentity identity) {
        if (identity.provider() == SocialProvider.GOOGLE) {
            user.setGoogleSub(identity.subject());
        } else {
            user.setAppleSub(identity.subject());
        }
    }

    private String displayNameFor(VerifiedIdentity identity) {
        String name = identity.name() != null && identity.name().trim().length() >= 2
                ? identity.name().trim()
                : identity.email().substring(0, identity.email().indexOf('@'));
        if (name.length() < 2) {
            return "Pessoa do TASTE";
        }
        return name.length() > 80 ? name.substring(0, 80) : name;
    }

    /** Username a partir do nome (ou do e-mail): so letras minusculas, numeros, ponto e underline, ate 20 caracteres. */
    private String uniqueUsername(VerifiedIdentity identity) {
        String source = identity.name() != null && !identity.name().isBlank()
                ? identity.name()
                : identity.email().substring(0, identity.email().indexOf('@'));
        String base = Normalizer.normalize(source.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", ".")
                .replaceAll("[^a-z0-9._]", "");
        if (base.length() > 16) {
            base = base.substring(0, 16);
        }
        if (base.length() < 3) {
            base = "pessoa";
        }
        String candidate = base;
        for (int suffix = 2; userRepository.existsByUsernameIgnoreCase(candidate); suffix++) {
            candidate = base + suffix;
        }
        return candidate;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getPublicProfile(Long viewerId, String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
        if (user.getId().equals(viewerId)) {
            return toResponse(user);
        }
        return toResponse(user, false, friendshipService.statusBetween(viewerId, user.getId()));
    }

    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));

        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        if (request.profileVisibility() != null) {
            user.setProfileVisibility(request.profileVisibility());
        }

        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return toResponse(user, true, null);
    }

    /** O e-mail so e devolvido para o proprio dono da conta, nunca em perfis publicos. */
    private UserResponse toResponse(User user, boolean includeEmail, String friendshipStatus) {
        long total = experienceRepository.countByUserId(user.getId());
        long favorites = experienceRepository.countByUserIdAndFavoriteTrue(user.getId());
        long cities = experienceRepository.countDistinctCitiesByUserId(user.getId());
        long restaurants = experienceRepository.countDistinctRestaurantsByUserId(user.getId());
        Double avgRating = experienceRepository.averageRatingByUserId(user.getId());

        UserStats stats = new UserStats(total, restaurants, cities, favorites, avgRating == null ? 0 : avgRating);

        return new UserResponse(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                includeEmail ? user.getEmail() : null,
                user.getAvatarUrl(),
                user.getBio(),
                user.getCreatedAt(),
                user.getProfileVisibility(),
                stats,
                friendshipStatus
        );
    }
}

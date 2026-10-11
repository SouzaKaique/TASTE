package com.taste.backend.user;

import com.taste.backend.common.BadRequestException;
import com.taste.backend.common.NotFoundException;
import com.taste.backend.common.TooManyRequestsException;
import com.taste.backend.security.LoginAttemptService;
import com.taste.backend.experience.ExperienceRepository;
import com.taste.backend.security.JwtService;
import com.taste.backend.social.FriendshipService;
import com.taste.backend.user.dto.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        if (loginAttempts.isBlocked(request.email())) {
            throw new TooManyRequestsException("Muitas tentativas de login. Aguarde alguns minutos e tente de novo.");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        // Confere a senha mesmo quando o e-mail nao existe: mesmo custo nos dois casos
        boolean valid = passwordEncoder.matches(request.password(), user != null ? user.getPasswordHash() : dummyHash);
        if (user == null || !valid) {
            loginAttempts.recordFailure(request.email());
            throw new BadCredentialsException("E-mail ou senha inválidos.");
        }
        loginAttempts.recordSuccess(request.email());

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, toResponse(user));
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

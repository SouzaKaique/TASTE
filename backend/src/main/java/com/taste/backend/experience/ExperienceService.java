package com.taste.backend.experience;

import com.taste.backend.common.NotFoundException;
import com.taste.backend.experience.dto.ExperienceRequest;
import com.taste.backend.experience.dto.ExperienceResponse;
import com.taste.backend.experience.dto.OptionalCriteriaResponse;
import com.taste.backend.experience.dto.PhotoResponse;
import com.taste.backend.user.User;
import com.taste.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final UserRepository userRepository;

    public ExperienceService(ExperienceRepository experienceRepository, UserRepository userRepository) {
        this.experienceRepository = experienceRepository;
        this.userRepository = userRepository;
    }

    public List<ExperienceResponse> listForUser(Long userId) {
        return experienceRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ExperienceResponse getOwned(Long userId, Long experienceId) {
        Experience experience = findOwned(userId, experienceId);
        return toResponse(experience);
    }

    public ExperienceResponse create(Long userId, ExperienceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado."));

        Experience experience = new Experience();
        experience.setUser(user);
        applyRequest(experience, request);

        return toResponse(experienceRepository.save(experience));
    }

    public ExperienceResponse update(Long userId, Long experienceId, ExperienceRequest request) {
        Experience experience = findOwned(userId, experienceId);
        applyRequest(experience, request);
        return toResponse(experienceRepository.save(experience));
    }

    public void delete(Long userId, Long experienceId) {
        Experience experience = findOwned(userId, experienceId);
        experienceRepository.delete(experience);
    }

    public ExperienceResponse toggleFavorite(Long userId, Long experienceId) {
        Experience experience = findOwned(userId, experienceId);
        experience.setFavorite(!experience.isFavorite());
        return toResponse(experienceRepository.save(experience));
    }

    private Experience findOwned(Long userId, Long experienceId) {
        return experienceRepository.findByIdAndUserId(experienceId, userId)
                .orElseThrow(() -> new NotFoundException("Experiência não encontrada."));
    }

    private void applyRequest(Experience experience, ExperienceRequest request) {
        experience.setDishName(request.dishName());
        experience.setCategory(request.category());
        experience.setCuisineType(request.cuisineType());
        experience.setRestaurantId(request.restaurantId());
        experience.setRestaurantName(request.restaurantName());
        experience.setCity(request.city());
        experience.setCountry(request.country());
        experience.setDate(request.date());
        experience.setRating(request.rating());
        experience.setPhotoUrl(request.photoUrl());
        experience.setNotes(request.notes());
        experience.setTags(request.tags() == null ? List.of() : request.tags());
        experience.setFavorite(request.favorite());
        experience.setVisibility(request.visibility() == null ? "public" : request.visibility());
        experience.setFlavor(request.flavor());
        experience.setPresentation(request.presentation());
        experience.setTexture(request.texture());
        experience.setCreativity(request.creativity());
        experience.setExperienceCriteria(request.experienceCriteria());
    }

    private ExperienceResponse toResponse(Experience e) {
        List<PhotoResponse> photos = (e.getPhotoUrl() == null || e.getPhotoUrl().isBlank())
                ? List.of()
                : List.of(new PhotoResponse("p-" + e.getId(), e.getPhotoUrl(), true));

        return new ExperienceResponse(
                e.getId(),
                e.getUser().getId(),
                e.getDishName(),
                e.getCategory(),
                e.getCuisineType(),
                e.getRestaurantId(),
                e.getRestaurantName(),
                e.getCity(),
                e.getCountry(),
                e.getDate(),
                e.getRating(),
                photos,
                e.getNotes(),
                List.copyOf(e.getTags()),
                e.isFavorite(),
                e.getVisibility(),
                OptionalCriteriaResponse.from(e.getFlavor(), e.getPresentation(), e.getTexture(), e.getCreativity(), e.getExperienceCriteria()),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}

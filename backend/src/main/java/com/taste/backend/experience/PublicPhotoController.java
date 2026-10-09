package com.taste.backend.experience;

import com.taste.backend.common.NotFoundException;
import com.taste.backend.user.ProfileVisibility;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.*;

/**
 * Entrega fotos como imagem (e nao como texto dentro do JSON), para uso em capas.
 * So fotos de experiencias PUBLICAS de perfis PUBLICOS: o que ja e visivel a qualquer usuario.
 */
@RestController
public class PublicPhotoController {

    private static final int MAX_COVER_IDS = 60;

    private final ExperienceRepository experienceRepository;

    public PublicPhotoController(ExperienceRepository experienceRepository) {
        this.experienceRepository = experienceRepository;
    }

    @GetMapping("/api/public/experiences/{id}/photo")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        Experience e = experienceRepository.findById(id)
                .filter(exp -> "public".equals(exp.getVisibility()))
                .filter(exp -> exp.getUser().getProfileVisibility() == ProfileVisibility.PUBLIC)
                .filter(exp -> exp.getPhotoUrl() != null && exp.getPhotoUrl().startsWith("data:image/"))
                .orElseThrow(() -> new NotFoundException("Foto não encontrada."));

        // Formato: data:image/jpeg;base64,AAAA...
        String dataUri = e.getPhotoUrl();
        int comma = dataUri.indexOf(',');
        String meta = comma > 5 ? dataUri.substring(5, comma) : ""; // ex: image/jpeg;base64
        if (!meta.endsWith(";base64")) {
            throw new NotFoundException("Foto não encontrada.");
        }
        byte[] bytes = Base64.getDecoder().decode(dataUri.substring(comma + 1));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.substring(0, meta.length() - ";base64".length())))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                .body(bytes);
    }

    /** Para cada restaurante, a experiencia publica mais recente com foto (ou nada). */
    @GetMapping("/api/restaurants/covers")
    @Transactional(readOnly = true)
    public Map<String, Long> covers(@RequestParam("ids") List<String> restaurantIds) {
        List<String> ids = restaurantIds.stream().filter(Objects::nonNull).distinct().limit(MAX_COVER_IDS).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<String, Long> covers = new LinkedHashMap<>();
        for (Object[] row : experienceRepository.findCoverCandidates(ids)) {
            covers.putIfAbsent((String) row[0], (Long) row[1]);
        }
        return covers;
    }
}

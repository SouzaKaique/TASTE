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
    private final PhotoUrls photoUrls;

    public PublicPhotoController(ExperienceRepository experienceRepository, PhotoUrls photoUrls) {
        this.experienceRepository = experienceRepository;
        this.photoUrls = photoUrls;
    }

    /**
     * Foto de qualquer experiencia, pelo endereco assinado que a API devolve para quem pode ve-la.
     * Como o endereco muda quando a foto muda, o celular pode guardar a imagem por um ano.
     */
    @GetMapping("/api/public/photos/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> signedPhoto(@PathVariable Long id, @RequestParam("v") String version, @RequestParam("s") String signature) {
        if (!photoUrls.isValid(id, version, signature)) {
            throw new NotFoundException("Foto não encontrada.");
        }
        Experience e = experienceRepository.findById(id)
                .filter(exp -> exp.getPhotoUrl() != null && version.equals(PhotoUrls.version(exp.getPhotoUrl())))
                .orElseThrow(() -> new NotFoundException("Foto não encontrada."));
        return image(e.getPhotoUrl(), CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
    }

    @GetMapping("/api/public/experiences/{id}/photo")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        Experience e = experienceRepository.findById(id)
                .filter(exp -> "public".equals(exp.getVisibility()))
                .filter(exp -> exp.getUser().getProfileVisibility() == ProfileVisibility.PUBLIC)
                .filter(exp -> exp.getPhotoUrl() != null && exp.getPhotoUrl().startsWith("data:image/"))
                .orElseThrow(() -> new NotFoundException("Foto não encontrada."));

        return image(e.getPhotoUrl(), CacheControl.maxAge(Duration.ofHours(6)).cachePublic());
    }

    /** Formato guardado: data:image/jpeg;base64,AAAA... */
    private static ResponseEntity<byte[]> image(String dataUri, CacheControl cache) {
        int comma = dataUri.indexOf(',');
        String meta = comma > 5 ? dataUri.substring(5, comma) : ""; // ex: image/jpeg;base64
        if (!meta.endsWith(";base64")) {
            throw new NotFoundException("Foto não encontrada.");
        }
        byte[] bytes = Base64.getMimeDecoder().decode(dataUri.substring(comma + 1));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.substring(0, meta.length() - ";base64".length())))
                .cacheControl(cache)
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

package com.taste.backend.social;

import com.taste.backend.common.NotFoundException;
import com.taste.backend.common.ForbiddenException;
import com.taste.backend.experience.Experience;
import com.taste.backend.experience.ExperienceAccess;
import com.taste.backend.experience.ExperienceRepository;
import com.taste.backend.notification.NotificationService;
import com.taste.backend.social.dto.FeedCommentResponse;
import com.taste.backend.social.dto.FeedItemResponse;
import com.taste.backend.user.User;
import com.taste.backend.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class FeedService {

    private static final int DEFAULT_PAGE = 10;
    private static final int MAX_PAGE = 30;

    private final ExperienceRepository experienceRepository;
    private final ExperienceAccess experienceAccess;
    private final FriendshipService friendshipService;
    private final ExperienceLikeRepository likeRepository;
    private final ExperienceCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SavedExperienceRepository savedRepository;
    private final com.taste.backend.experience.PhotoUrls photoUrls;

    public FeedService(
            ExperienceRepository experienceRepository,
            ExperienceAccess experienceAccess,
            FriendshipService friendshipService,
            ExperienceLikeRepository likeRepository,
            ExperienceCommentRepository commentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            SavedExperienceRepository savedRepository,
            com.taste.backend.experience.PhotoUrls photoUrls
    ) {
        this.experienceRepository = experienceRepository;
        this.experienceAccess = experienceAccess;
        this.friendshipService = friendshipService;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.savedRepository = savedRepository;
        this.photoUrls = photoUrls;
    }

    /**
     * Experiencias dos amigos e as proprias (nao privadas), das mais recentes para as mais antigas,
     * em paginas. Sem cursor vem a primeira pagina; com (beforeAt, beforeId) vem a seguinte.
     */
    @Transactional(readOnly = true)
    public List<FeedItemResponse> feed(Long me, java.time.Instant beforeAt, Long beforeId, Integer limit) {
        Set<Long> authors = new HashSet<>(friendshipService.friendIds(me));
        authors.add(me);
        int size = limit == null ? DEFAULT_PAGE : Math.max(1, Math.min(limit, MAX_PAGE));
        PageRequest page = PageRequest.of(0, size);

        List<Experience> experiences = (beforeAt != null && beforeId != null)
                ? experienceRepository.findFeedBefore(authors, beforeAt, beforeId, page)
                : experienceRepository.findFeed(authors, page);
        return experiences.stream()
                .filter(e -> experienceAccess.canView(me, e))
                .map(e -> toItem(me, e))
                .toList();
    }

    /** Lugar do ranking "em alta" do Descobrir. */
    public record PlaceRanking(String restaurantId, String name, String city, long count, double averageRating) { }

    /** Grade de fotos do Descobrir (amigos + publicos), em paginas como o feed. */
    @Transactional(readOnly = true)
    public List<FeedItemResponse> explore(Long me, java.time.Instant beforeAt, Long beforeId, Integer limit) {
        Set<Long> friends = new HashSet<>(friendshipService.friendIds(me));
        friends.add(me);
        int size = limit == null ? 18 : Math.max(1, Math.min(limit, 36));
        PageRequest page = PageRequest.of(0, size);
        List<Experience> experiences = (beforeAt != null && beforeId != null)
                ? experienceRepository.findExploreBefore(friends, beforeAt, beforeId, page)
                : experienceRepository.findExplore(friends, page);
        return experiences.stream()
                .filter(e -> experienceAccess.canView(me, e))
                .map(e -> toItem(me, e))
                .toList();
    }

    /** Ranking de lugares em alta (opcionalmente de uma cidade). */
    @Transactional(readOnly = true)
    public List<PlaceRanking> topPlaces(String city) {
        String wanted = city == null || city.isBlank() ? null : city.trim().toLowerCase(java.util.Locale.ROOT);
        // O mesmo lugar pode ter sido salvo com ids diferentes: junta por nome + cidade
        Map<String, double[]> totals = new java.util.LinkedHashMap<>(); // [quantidade, soma das notas]
        Map<String, String[]> info = new HashMap<>();                     // [id, nome, cidade]
        for (Object[] r : experienceRepository.findTopPlaces(PageRequest.of(0, 200))) {
            String id = (String) r[0];
            String name = (String) r[1];
            String placeCity = (String) r[2];
            if (name == null) continue;
            if (wanted != null && (placeCity == null || !placeCity.toLowerCase(java.util.Locale.ROOT).equals(wanted))) continue;
            String key = (name.trim() + "|" + (placeCity == null ? "" : placeCity.trim())).toLowerCase(java.util.Locale.ROOT);
            long count = ((Number) r[3]).longValue();
            double avg = ((Number) r[4]).doubleValue();
            double[] t = totals.computeIfAbsent(key, k -> new double[2]);
            t[0] += count;
            t[1] += avg * count;
            String[] i = info.computeIfAbsent(key, k -> new String[]{id, name, placeCity});
            if (i[0] == null) i[0] = id;
        }
        return totals.entrySet().stream()
                .map(e -> {
                    String[] i = info.get(e.getKey());
                    double[] t = e.getValue();
                    return new PlaceRanking(i[0], i[1], i[2], (long) t[0], Math.round(t[1] / t[0] * 10) / 10.0);
                })
                .sorted(java.util.Comparator.comparingLong(PlaceRanking::count).reversed()
                        .thenComparing(java.util.Comparator.comparingDouble(PlaceRanking::averageRating).reversed()))
                .limit(10)
                .toList();
    }

    /** Salva ou tira da lista "Quero ir". */
    public FeedItemResponse toggleSave(Long me, Long experienceId) {
        Experience experience = findVisible(me, experienceId);
        savedRepository.findByExperienceIdAndUserId(experienceId, me).ifPresentOrElse(
                savedRepository::delete,
                () -> savedRepository.save(new SavedExperience(experience, findUser(me))));
        savedRepository.flush();
        return toItem(me, experience);
    }

    /** Lista "Quero ir", do salvo mais recente ao mais antigo; some o que deixou de ser visivel. */
    @Transactional(readOnly = true)
    public List<FeedItemResponse> saved(Long me) {
        return savedRepository.findByUserIdOrderByCreatedAtDesc(me).stream()
                .map(SavedExperience::getExperience)
                .filter(e -> experienceAccess.canView(me, e))
                .map(e -> toItem(me, e))
                .toList();
    }

    @Transactional(readOnly = true)
    public FeedItemResponse item(Long me, Long experienceId) {
        return toItem(me, findVisible(me, experienceId));
    }

    public FeedItemResponse toggleLike(Long me, Long experienceId) {
        Experience experience = findVisible(me, experienceId);
        User actor = findUser(me);
        likeRepository.findByExperienceIdAndUserId(experienceId, me).ifPresentOrElse(
                like -> {
                    likeRepository.delete(like);
                    notificationService.unliked(actor, experience);
                },
                () -> {
                    likeRepository.save(new ExperienceLike(experience, actor));
                    notificationService.liked(actor, experience);
                }
        );
        likeRepository.flush();
        return toItem(me, experience);
    }

    public FeedItemResponse addComment(Long me, Long experienceId, String text) {
        Experience experience = findVisible(me, experienceId);
        User actor = findUser(me);
        commentRepository.save(new ExperienceComment(experience, actor, text.trim()));
        notificationService.commented(actor, experience, text.trim());
        return toItem(me, experience);
    }

    /** O autor do comentario ou o dono da experiencia podem apagar. */
    public FeedItemResponse removeComment(Long me, Long experienceId, Long commentId) {
        Experience experience = findVisible(me, experienceId);
        ExperienceComment comment = commentRepository.findByIdAndExperienceId(commentId, experienceId)
                .orElseThrow(() -> new NotFoundException("Comentário não encontrado."));
        boolean allowed = comment.getUser().getId().equals(me) || experience.getUser().getId().equals(me);
        if (!allowed) {
            throw new ForbiddenException("Você não pode apagar este comentário.");
        }
        commentRepository.delete(comment);
        commentRepository.flush();
        return toItem(me, experience);
    }

    private Experience findVisible(Long me, Long experienceId) {
        return experienceRepository.findById(experienceId)
                .filter(e -> experienceAccess.canView(me, e))
                .orElseThrow(() -> new NotFoundException("Experiência não encontrada."));
    }

    private FeedItemResponse toItem(Long me, Experience e) {
        List<FeedCommentResponse> comments = commentRepository.findByExperienceIdOrderByCreatedAtAsc(e.getId()).stream()
                .map(c -> new FeedCommentResponse(
                        c.getId(),
                        c.getUser().getId(),
                        c.getUser().getDisplayName(),
                        c.getUser().getAvatarUrl(),
                        c.getText(),
                        c.getCreatedAt()))
                .toList();

        return new FeedItemResponse(
                e.getId(),
                "new-experience",
                friendshipService.summaryOf(me, e.getUser()),
                e.getCreatedAt(),
                e.getId(),
                e.getDishName(),
                e.getRestaurantName(),
                e.getCity(),
                e.getRating(),
                photoUrls.urlFor(e),
                e.getNotes(),
                likeRepository.countByExperienceId(e.getId()),
                likeRepository.existsByExperienceIdAndUserId(e.getId(), me),
                savedRepository.existsByExperienceIdAndUserId(e.getId(), me),
                comments
        );
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    }
}

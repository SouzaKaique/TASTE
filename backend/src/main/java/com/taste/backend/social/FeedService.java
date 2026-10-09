package com.taste.backend.social;

import com.taste.backend.common.NotFoundException;
import com.taste.backend.common.ForbiddenException;
import com.taste.backend.experience.Experience;
import com.taste.backend.experience.ExperienceAccess;
import com.taste.backend.experience.ExperienceRepository;
import com.taste.backend.social.dto.FeedCommentResponse;
import com.taste.backend.social.dto.FeedItemResponse;
import com.taste.backend.user.User;
import com.taste.backend.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class FeedService {

    private static final int FEED_LIMIT = 50;

    private final ExperienceRepository experienceRepository;
    private final ExperienceAccess experienceAccess;
    private final FriendshipService friendshipService;
    private final ExperienceLikeRepository likeRepository;
    private final ExperienceCommentRepository commentRepository;
    private final UserRepository userRepository;

    public FeedService(
            ExperienceRepository experienceRepository,
            ExperienceAccess experienceAccess,
            FriendshipService friendshipService,
            ExperienceLikeRepository likeRepository,
            ExperienceCommentRepository commentRepository,
            UserRepository userRepository
    ) {
        this.experienceRepository = experienceRepository;
        this.experienceAccess = experienceAccess;
        this.friendshipService = friendshipService;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    /** Experiencias dos amigos e as proprias (nao privadas), das mais recentes para as mais antigas. */
    @Transactional(readOnly = true)
    public List<FeedItemResponse> feed(Long me) {
        Set<Long> authors = new HashSet<>(friendshipService.friendIds(me));
        authors.add(me);

        return experienceRepository.findFeed(authors, PageRequest.of(0, FEED_LIMIT)).stream()
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
        likeRepository.findByExperienceIdAndUserId(experienceId, me).ifPresentOrElse(
                likeRepository::delete,
                () -> likeRepository.save(new ExperienceLike(experience, findUser(me)))
        );
        likeRepository.flush();
        return toItem(me, experience);
    }

    public FeedItemResponse addComment(Long me, Long experienceId, String text) {
        Experience experience = findVisible(me, experienceId);
        commentRepository.save(new ExperienceComment(experience, findUser(me), text.trim()));
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
                e.getPhotoUrl(),
                e.getNotes(),
                likeRepository.countByExperienceId(e.getId()),
                likeRepository.existsByExperienceIdAndUserId(e.getId(), me),
                comments
        );
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    }
}

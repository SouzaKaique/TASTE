package com.taste.backend.demo;

import com.taste.backend.experience.Experience;
import com.taste.backend.experience.ExperienceRepository;
import com.taste.backend.notification.NotificationRepository;
import com.taste.backend.social.ExperienceCommentRepository;
import com.taste.backend.social.ExperienceLikeRepository;
import com.taste.backend.social.FeedService;
import com.taste.backend.social.FriendshipRepository;
import com.taste.backend.social.FriendshipService;
import com.taste.backend.user.User;
import com.taste.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Dados de demonstracao, para ver o produto "vivo" sem depender de usuarios reais.
 * Todos os perfis tem username "demo.*", bio identificando a demonstracao e senha
 * aleatoria descartada (ninguem consegue entrar neles). Ligado so por variavel de
 * ambiente (ver DemoDataRunner) e removivel por completo.
 */
@Service
public class DemoDataService {

    static final String PREFIX = "demo.";
    private static final Logger log = LoggerFactory.getLogger(DemoDataService.class);
    private static final String BIO = "Perfil de demonstração do TASTE.";

    private record DemoUser(String username, String name) { }

    private record DemoExperience(String user, String dish, String category, String cuisine, String restaurantId,
                                  String restaurant, String city, int rating, String notes, String visibility,
                                  int hoursAgo, String... tags) { }

    private static final List<DemoUser> USERS = List.of(
            new DemoUser("demo.marina", "Marina Alves"),
            new DemoUser("demo.rafael", "Rafael Souza"),
            new DemoUser("demo.julia", "Júlia Lima"),
            new DemoUser("demo.ana", "Ana Ribeiro"),
            new DemoUser("demo.pedro", "Pedro Nakamura"),
            new DemoUser("demo.lucas", "Lucas Prado"));

    private static final List<DemoExperience> EXPERIENCES = List.of(
            new DemoExperience("demo.marina", "Pad thai de camarão", "main-course", "Outras", "londrina-bangkok-garden",
                    "Bangkok Garden", "Londrina", 5, "Equilibrado e perfumado. Voltei duas vezes no mesmo mês.", "public", 2, "picante", "repetiria"),
            new DemoExperience("demo.marina", "Camarão internacional", "main-course", "Frutos do mar", "londrina-coco-bambu",
                    "Coco Bambu Londrina", "Londrina", 4, "Porção enorme, ótimo para dividir com a família.", "public", 75, "compartilhar"),
            new DemoExperience("demo.rafael", "Menu degustação de inverno", "experience", "Brasileira", "curitiba-manu",
                    "Manu", "Curitiba", 5, "Vale cada etapa. Reserve com antecedência.", "public", 20, "ocasião especial"),
            new DemoExperience("demo.rafael", "Costela no fogo de chão", "main-course", "Brasileira", "curitiba-arco-iris",
                    "Churrascaria Arco Íris", "Curitiba", 4, "Costela macia, desmanchando. Vá com fome.", "friends", 120, "churrasco"),
            new DemoExperience("demo.julia", "Esfiha de carne aberta", "snack", "Árabe", "assis-ponto-da-esfiha",
                    "Ponto da Esfiha", "Assis", 4, "A esfiha mais honesta de Assis. Massa fininha.", "public", 50, "barato"),
            new DemoExperience("demo.julia", "Pizza margherita", "main-course", "Italiana", "assis-pizzeria-verita",
                    "Pizzeria Verita", "Assis", 5, "Borda alta e molho de tomate de verdade.", "public", 8, "pizza"),
            new DemoExperience("demo.ana", "Kibe cru", "starter", "Árabe", "londrina-zaki-sabor-arabe",
                    "Zaki Sabor Árabe", "Londrina", 5, "Fresquíssimo, com hortelã e azeite bom.", "public", 30, "árabe"),
            new DemoExperience("demo.ana", "Joelho de porco", "main-course", "Outras", "londrina-strassberg",
                    "Strassberg", "Londrina", 4, "Pele crocante, chucrute na medida.", "public", 160, "alemã"),
            new DemoExperience("demo.pedro", "Omakase no balcão", "experience", "Japonesa", "curitiba-ichigo-ichie",
                    "Ichigo Ichie", "Curitiba", 5, "Peixe impecável, ritmo perfeito entre as peças.", "public", 12, "japonesa"),
            new DemoExperience("demo.pedro", "Porco San Zé", "main-course", "Brasileira", "sp-casa-do-porco",
                    "A Casa do Porco", "São Paulo", 5, "Fila grande, mas o porco compensa cada minuto.", "public", 200, "porco"),
            new DemoExperience("demo.lucas", "Cheeseburger duplo", "snack", "Americana", "assis-brogui-burger",
                    "Brogui Burger", "Assis", 4, "Ponto da carne certinho e pão macio.", "public", 40, "hambúrguer"));

    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final FriendshipService friendshipService;
    private final FeedService feedService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;
    private final ExperienceLikeRepository likeRepository;
    private final ExperienceCommentRepository commentRepository;
    private final FriendshipRepository friendshipRepository;
    private final com.taste.backend.social.SavedExperienceRepository savedRepository;
    private final com.taste.backend.push.PushSubscriptionRepository pushSubscriptionRepository;
    private final SecureRandom random = new SecureRandom();

    public DemoDataService(UserRepository userRepository, ExperienceRepository experienceRepository,
                           FriendshipService friendshipService, FeedService feedService, PasswordEncoder passwordEncoder,
                           NotificationRepository notificationRepository, ExperienceLikeRepository likeRepository,
                           ExperienceCommentRepository commentRepository, FriendshipRepository friendshipRepository,
                           com.taste.backend.social.SavedExperienceRepository savedRepository,
                           com.taste.backend.push.PushSubscriptionRepository pushSubscriptionRepository) {
        this.userRepository = userRepository;
        this.experienceRepository = experienceRepository;
        this.friendshipService = friendshipService;
        this.feedService = feedService;
        this.passwordEncoder = passwordEncoder;
        this.notificationRepository = notificationRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.friendshipRepository = friendshipRepository;
        this.savedRepository = savedRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
    }

    /** Cria os perfis de demonstracao ligados a conta "targetUsername". Nao faz nada se ja existirem. */
    @Transactional
    public void seedFor(String targetUsername) {
        User target = userRepository.findByUsernameIgnoreCase(targetUsername.trim()).orElse(null);
        if (target == null) {
            log.warn("Demo: usuario '{}' nao encontrado; nada foi criado.", targetUsername);
            return;
        }
        if (!userRepository.findByUsernameStartingWith(PREFIX).isEmpty()) {
            log.info("Demo: perfis de demonstracao ja existem; nada foi criado.");
            return;
        }

        Map<String, User> users = new LinkedHashMap<>();
        for (DemoUser u : USERS) {
            User user = new User();
            user.setUsername(u.username());
            user.setDisplayName(u.name());
            user.setEmail(u.username() + "@demo.taste.invalid");
            user.setBio(BIO);
            // Senha aleatoria descartada: o perfil existe, mas ninguem entra nele
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID() + Long.toHexString(random.nextLong())));
            users.put(u.username(), userRepository.save(user));
        }

        Map<String, Experience> byDish = new HashMap<>();
        Instant now = Instant.now();
        for (DemoExperience d : EXPERIENCES) {
            Experience e = new Experience();
            e.setUser(users.get(d.user()));
            e.setDishName(d.dish());
            e.setCategory(d.category());
            e.setCuisineType(d.cuisine());
            e.setRestaurantId(d.restaurantId());
            e.setRestaurantName(d.restaurant());
            e.setCity(d.city());
            e.setCountry("Brasil");
            e.setRating(d.rating());
            e.setNotes(d.notes());
            e.setVisibility(d.visibility());
            e.setTags(List.of(d.tags()));
            e.setFavorite(d.rating() == 5);
            Instant created = now.minus(Duration.ofHours(d.hoursAgo()));
            e.setCreatedAt(created);
            e.setUpdatedAt(created);
            e.setDate(LocalDate.ofInstant(created, java.time.ZoneId.of("America/Sao_Paulo")));
            byDish.put(d.dish(), experienceRepository.save(e));
        }

        Long me = target.getId();
        // Amizades: algumas pedidas pela demo (voce aceitou), outras pedidas por voce (elas aceitaram)
        befriend(users.get("demo.marina").getId(), me);
        befriend(me, users.get("demo.rafael").getId());
        befriend(users.get("demo.julia").getId(), me);
        befriend(me, users.get("demo.ana").getId());
        befriend(users.get("demo.pedro").getId(), me);
        befriend(users.get("demo.marina").getId(), users.get("demo.ana").getId());
        befriend(users.get("demo.rafael").getId(), users.get("demo.pedro").getId());
        befriend(users.get("demo.julia").getId(), users.get("demo.marina").getId());
        // Pedido pendente para voce aceitar ou recusar
        friendshipService.sendRequest(users.get("demo.lucas").getId(), me);

        // Interacoes entre os perfis de demonstracao
        like("demo.ana", byDish.get("Pad thai de camarão"), users);
        like("demo.julia", byDish.get("Pad thai de camarão"), users);
        comment("demo.ana", byDish.get("Pad thai de camarão"), "Fui ontem por sua causa. Que acerto!", users);
        like("demo.pedro", byDish.get("Menu degustação de inverno"), users);
        comment("demo.pedro", byDish.get("Menu degustação de inverno"), "Esse está na minha lista há meses.", users);
        like("demo.marina", byDish.get("Pizza margherita"), users);
        like("demo.rafael", byDish.get("Omakase no balcão"), users);
        comment("demo.rafael", byDish.get("Omakase no balcão"), "Vamos juntos no próximo?", users);
        like("demo.marina", byDish.get("Kibe cru"), users);

        // Interacoes nas suas experiencias mais recentes (geram notificacoes para voce)
        List<Experience> mine = experienceRepository.findByUserIdOrderByDateDesc(me);
        if (!mine.isEmpty()) {
            Experience latest = mine.get(0);
            like("demo.marina", latest, users);
            like("demo.rafael", latest, users);
            comment("demo.julia", latest, "Anotado! Quero muito provar.", users);
        }
        if (mine.size() > 1) {
            like("demo.ana", mine.get(1), users);
            comment("demo.pedro", mine.get(1), "Que foto boa. Onde fica exatamente?", users);
        }
        log.info("Demo: {} perfis e {} experiencias de demonstracao criados para '{}'.", users.size(), byDish.size(), target.getUsername());
    }

    /** Apaga todos os perfis "demo.*" e tudo o que eles criaram ou receberam. */
    @Transactional
    public void removeAll() {
        List<User> demo = userRepository.findByUsernameStartingWith(PREFIX);
        if (demo.isEmpty()) {
            log.info("Demo: nenhum perfil de demonstracao para remover.");
            return;
        }
        List<Long> ids = demo.stream().map(User::getId).toList();
        notificationRepository.deleteInvolvingUsers(ids);
        likeRepository.deleteInvolvingUsers(ids);
        savedRepository.deleteInvolvingUsers(ids);
        pushSubscriptionRepository.deleteByUserIds(ids);
        commentRepository.deleteInvolvingUsers(ids);
        friendshipRepository.deleteInvolvingUsers(ids);
        for (Long id : ids) {
            experienceRepository.deleteAll(experienceRepository.findByUserIdOrderByDateDesc(id));
        }
        userRepository.deleteAll(demo);
        log.info("Demo: {} perfis de demonstracao removidos.", ids.size());
    }

    private void befriend(Long requester, Long addressee) {
        friendshipService.sendRequest(requester, addressee);
        friendshipService.accept(addressee, requester);
    }

    private void like(String username, Experience experience, Map<String, User> users) {
        if (experience != null) {
            feedService.toggleLike(users.get(username).getId(), experience.getId());
        }
    }

    private void comment(String username, Experience experience, String text, Map<String, User> users) {
        if (experience != null) {
            feedService.addComment(users.get(username).getId(), experience.getId(), text);
        }
    }
}

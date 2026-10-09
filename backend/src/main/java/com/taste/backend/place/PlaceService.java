package com.taste.backend.place;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taste.backend.common.BadRequestException;
import com.taste.backend.common.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Busca de restaurantes no OpenStreetMap (gratuito, sem chave):
 * - Photon (photon.komoot.io): busca enquanto a pessoa digita;
 * - Nominatim (nominatim.openstreetmap.org): detalhes de um lugar pelo id.
 * As respostas ficam em cache e o Nominatim e chamado no maximo 1x por segundo,
 * como pede a politica de uso dos servicos publicos do OSM.
 */
@Service
public class PlaceService {

    private static final Logger log = LoggerFactory.getLogger(PlaceService.class);

    private static final String USER_AGENT = "TASTE/1.0 (+https://github.com/SouzaKaique/TASTE)";
    private static final String BRAZIL_BBOX = "-74.0,-34.0,-34.7,5.3";
    private static final List<String> FOOD_TAGS = List.of(
            "amenity:restaurant", "amenity:fast_food", "amenity:cafe", "amenity:ice_cream", "amenity:bar", "amenity:pub");
    private static final Pattern OSM_ID = Pattern.compile("^osm-([NWR])(\\d{1,15})$");
    private static final Duration SEARCH_TTL = Duration.ofMinutes(15);
    private static final Duration DETAILS_TTL = Duration.ofHours(24);
    private static final int MAX_CACHE_ENTRIES = 1000;

    private static final Map<String, String> CUISINES = Map.ofEntries(
            Map.entry("pizza", "Pizza"), Map.entry("italian", "Italiana"), Map.entry("japanese", "Japonesa"),
            Map.entry("sushi", "Japonesa"), Map.entry("brazilian", "Brasileira"), Map.entry("regional", "Regional"),
            Map.entry("burger", "Hambúrguer"), Map.entry("steak_house", "Churrasco"), Map.entry("barbecue", "Churrasco"),
            Map.entry("chinese", "Chinesa"), Map.entry("arab", "Árabe"), Map.entry("lebanese", "Libanesa"),
            Map.entry("mexican", "Mexicana"), Map.entry("coffee_shop", "Café"), Map.entry("ice_cream", "Sorveteria"),
            Map.entry("seafood", "Frutos do mar"), Map.entry("chicken", "Frango"), Map.entry("french", "Francesa"),
            Map.entry("portuguese", "Portuguesa"), Map.entry("vegetarian", "Vegetariana"), Map.entry("vegan", "Vegana"),
            Map.entry("thai", "Tailandesa"), Map.entry("indian", "Indiana"), Map.entry("korean", "Coreana"),
            Map.entry("german", "Alemã"), Map.entry("spanish", "Espanhola"), Map.entry("peruvian", "Peruana"),
            Map.entry("sandwich", "Lanches"), Map.entry("hot_dog", "Lanches"), Map.entry("bakery", "Padaria"),
            Map.entry("dessert", "Doces"), Map.entry("cake", "Doces"), Map.entry("international", "Internacional"));

    private record CacheEntry<T>(T value, Instant expiresAt) {
        boolean valid() {
            return Instant.now().isBefore(expiresAt);
        }
    }

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
    private final ObjectMapper mapper;
    private final Map<String, CacheEntry<List<PlaceResponse>>> searchCache = new ConcurrentHashMap<>();
    private final Map<String, CacheEntry<PlaceResponse>> detailsCache = new ConcurrentHashMap<>();
    private final Object nominatimLock = new Object();
    private long lastNominatimCall = 0;

    public PlaceService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public List<PlaceResponse> search(String term, Double lat, Double lon) {
        String q = term == null ? "" : term.trim();
        if (q.length() < 3) {
            return List.of();
        }
        if (q.length() > 80) {
            throw new BadRequestException("Busca muito longa.");
        }
        String bias = (lat != null && lon != null) ? String.format(Locale.ROOT, "%.2f,%.2f", lat, lon) : "";
        String cacheKey = q.toLowerCase(Locale.ROOT) + "|" + bias;
        CacheEntry<List<PlaceResponse>> cached = searchCache.get(cacheKey);
        if (cached != null && cached.valid()) {
            return cached.value();
        }

        StringBuilder url = new StringBuilder("https://photon.komoot.io/api/?limit=12&bbox=").append(BRAZIL_BBOX)
                .append("&q=").append(URLEncoder.encode(q, StandardCharsets.UTF_8));
        FOOD_TAGS.forEach(tag -> url.append("&osm_tag=").append(URLEncoder.encode(tag, StandardCharsets.UTF_8)));
        if (lat != null && lon != null) {
            url.append("&lat=").append(lat).append("&lon=").append(lon);
        }

        List<PlaceResponse> results = new ArrayList<>();
        JsonNode json = get(url.toString());
        for (JsonNode feature : json.path("features")) {
            JsonNode p = feature.path("properties");
            String name = text(p, "name");
            String type = text(p, "osm_type");
            if (name == null || type == null || !"BR".equalsIgnoreCase(text(p, "countrycode"))) {
                continue;
            }
            JsonNode coords = feature.path("geometry").path("coordinates");
            results.add(new PlaceResponse(
                    "osm-" + type + p.path("osm_id").asText(),
                    name,
                    joinAddress(text(p, "street"), text(p, "housenumber")),
                    firstNonNull(text(p, "district"), text(p, "locality")),
                    firstNonNull(text(p, "city"), text(p, "county")),
                    text(p, "state"),
                    "Brasil",
                    List.of(),
                    null, null, null,
                    coords.size() == 2 ? coords.get(1).asDouble() : null,
                    coords.size() == 2 ? coords.get(0).asDouble() : null));
        }

        putBounded(searchCache, cacheKey, new CacheEntry<>(List.copyOf(results), Instant.now().plus(SEARCH_TTL)));
        return results;
    }

    public PlaceResponse details(String id) {
        var matcher = OSM_ID.matcher(id == null ? "" : id);
        if (!matcher.matches()) {
            throw new NotFoundException("Restaurante não encontrado.");
        }
        CacheEntry<PlaceResponse> cached = detailsCache.get(id);
        if (cached != null && cached.valid()) {
            return cached.value();
        }

        String url = "https://nominatim.openstreetmap.org/lookup?format=jsonv2&addressdetails=1&extratags=1"
                + "&accept-language=pt-BR&osm_ids=" + matcher.group(1) + matcher.group(2);
        JsonNode list = getNominatim(url);
        if (!list.isArray() || list.isEmpty()) {
            throw new NotFoundException("Restaurante não encontrado.");
        }
        JsonNode p = list.get(0);
        JsonNode address = p.path("address");
        JsonNode extra = p.path("extratags");

        PlaceResponse place = new PlaceResponse(
                id,
                firstNonNull(text(p, "name"), text(address, "amenity")),
                joinAddress(text(address, "road"), text(address, "house_number")),
                firstNonNull(text(address, "suburb"), text(address, "neighbourhood")),
                firstNonNull(text(address, "city"), text(address, "town"), text(address, "village"), text(address, "municipality")),
                text(address, "state"),
                "Brasil",
                translateCuisine(text(extra, "cuisine")),
                firstNonNull(text(extra, "website"), text(extra, "contact:website")),
                firstNonNull(text(extra, "phone"), text(extra, "contact:phone")),
                text(extra, "opening_hours"),
                p.hasNonNull("lat") ? p.get("lat").asDouble() : null,
                p.hasNonNull("lon") ? p.get("lon").asDouble() : null);

        putBounded(detailsCache, id, new CacheEntry<>(place, Instant.now().plus(DETAILS_TTL)));
        return place;
    }

    private JsonNode getNominatim(String url) {
        // Politica do Nominatim publico: no maximo 1 requisicao por segundo.
        synchronized (nominatimLock) {
            long wait = 1100 - (System.currentTimeMillis() - lastNominatimCall);
            if (wait > 0) {
                try {
                    Thread.sleep(wait);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            lastNominatimCall = System.currentTimeMillis();
        }
        return get(url);
    }

    private JsonNode get(String url) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(6))
                .header("User-Agent", USER_AGENT)
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                log.warn("Servico de lugares respondeu {} para {}", response.statusCode(), url);
                throw new PlaceServiceUnavailableException();
            }
            return mapper.readTree(response.body());
        } catch (PlaceServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Falha ao consultar servico de lugares: {}", e.toString());
            throw new PlaceServiceUnavailableException();
        }
    }

    static List<String> translateCuisine(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        LinkedHashSet<String> labels = new LinkedHashSet<>();
        for (String part : raw.split("[;,]")) {
            String key = part.trim().toLowerCase(Locale.ROOT);
            if (!key.isEmpty()) {
                labels.add(CUISINES.getOrDefault(key, capitalize(key.replace('_', ' '))));
            }
        }
        return List.copyOf(labels);
    }

    private static <V> void putBounded(Map<String, V> cache, String key, V value) {
        if (cache.size() >= MAX_CACHE_ENTRIES) {
            cache.clear();
        }
        cache.put(key, value);
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() || value.asText().isBlank() ? null : value.asText();
    }

    private static String joinAddress(String street, String number) {
        if (street == null) {
            return null;
        }
        return number == null ? street : street + ", " + number;
    }

    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        for (T v : values) {
            if (v != null) {
                return v;
            }
        }
        return null;
    }

    private static String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}

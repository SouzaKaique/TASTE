package com.taste.backend.place;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Municipios do Brasil pela API de localidades do IBGE (gratuita, sem chave).
 * A lista (~5.570 cidades) e baixada uma vez e fica em memoria; assim a cidade
 * sempre e gravada com o nome oficial ("São Paulo", nao "sp" ou "Sao paulo").
 */
@Service
public class CityService {

    private static final Logger log = LoggerFactory.getLogger(CityService.class);
    private static final String IBGE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";
    private static final int LIMIT = 8;

    public record City(String name, String state) { }

    private record Entry(City city, String key) { }

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper mapper;
    private volatile List<Entry> cities;

    public CityService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /** Cidades que comecam com o termo primeiro, depois as que contem o termo. */
    public List<City> search(String term) {
        String q = normalize(term == null ? "" : term);
        if (q.length() < 2) {
            return List.of();
        }
        List<Entry> all = load();
        List<City> starts = new ArrayList<>();
        List<City> contains = new ArrayList<>();
        for (Entry e : all) {
            if (e.key().startsWith(q)) {
                starts.add(e.city());
            } else if (contains.size() < LIMIT && e.key().contains(q)) {
                contains.add(e.city());
            }
        }
        // Nome mais curto primeiro: "São Paulo" antes de "São Patrício" ao digitar "sao pa"
        starts.sort(Comparator.comparingInt((City c) -> c.name().length()));
        starts.addAll(contains);
        return starts.size() > LIMIT ? List.copyOf(starts.subList(0, LIMIT)) : starts;
    }

    private List<Entry> load() {
        List<Entry> loaded = cities;
        if (loaded != null) {
            return loaded;
        }
        synchronized (this) {
            if (cities != null) {
                return cities;
            }
            HttpRequest request = HttpRequest.newBuilder(URI.create(IBGE_URL))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            try {
                HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() != 200) {
                    log.warn("IBGE respondeu {}", response.statusCode());
                    throw new PlaceServiceUnavailableException();
                }
                List<Entry> list = new ArrayList<>();
                for (JsonNode m : mapper.readTree(response.body())) {
                    String name = m.path("municipio-nome").asText(null);
                    String uf = m.path("UF-sigla").asText(null);
                    if (name != null && uf != null) {
                        list.add(new Entry(new City(name, uf), normalize(name)));
                    }
                }
                // Cidades maiores costumam ter nomes curtos; ordem alfabetica basta para a busca por prefixo
                list.sort((a, b) -> a.key().compareTo(b.key()));
                cities = List.copyOf(list);
                return cities;
            } catch (PlaceServiceUnavailableException e) {
                throw e;
            } catch (Exception e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                log.warn("Falha ao carregar cidades do IBGE: {}", e.toString());
                throw new PlaceServiceUnavailableException();
            }
        }
    }

    static String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}

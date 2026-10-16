package com.taste.backend.place;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;
    private final CityService cityService;

    public PlaceController(PlaceService placeService, CityService cityService) {
        this.placeService = placeService;
        this.cityService = cityService;
    }

    /** Cidades oficiais do IBGE para autocompletar (minimo 2 letras). */
    @GetMapping("/cities")
    public List<CityService.City> cities(@RequestParam("q") String term) {
        return cityService.search(term);
    }

    /** Busca restaurantes no Brasil pelo nome (minimo 3 letras). lat/lon opcionais priorizam uma regiao. */
    @GetMapping("/search")
    public List<PlaceResponse> search(
            @RequestParam("q") String term,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lon", required = false) Double lon
    ) {
        return placeService.search(term, lat, lon);
    }

    /** Restaurantes perto de um ponto (registro rapido com a localizacao do celular). */
    @GetMapping("/nearby")
    public List<PlaceResponse> nearby(@RequestParam("lat") double lat, @RequestParam("lon") double lon) {
        return placeService.nearby(lat, lon);
    }

    @GetMapping("/{id}")
    public PlaceResponse details(@PathVariable String id) {
        return placeService.details(id);
    }
}

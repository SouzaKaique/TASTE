package com.taste.backend.place;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
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

    @GetMapping("/{id}")
    public PlaceResponse details(@PathVariable String id) {
        return placeService.details(id);
    }
}

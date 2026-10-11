package com.taste.backend.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Liga os dados de demonstracao por variavel de ambiente, ao iniciar:
 * - TASTE_DEMO_SEED_FOR=<seu username> cria os perfis demo.* como seus amigos;
 * - TASTE_DEMO_REMOVE=true apaga todos eles.
 * Sem nenhuma das duas, nao faz nada.
 */
@Component
public class DemoDataRunner implements ApplicationRunner {

    private final DemoDataService demoDataService;
    private final String seedFor;
    private final boolean remove;

    public DemoDataRunner(
            DemoDataService demoDataService,
            @Value("${TASTE_DEMO_SEED_FOR:}") String seedFor,
            @Value("${TASTE_DEMO_REMOVE:false}") boolean remove
    ) {
        this.demoDataService = demoDataService;
        this.seedFor = seedFor;
        this.remove = remove;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (remove) {
            demoDataService.removeAll();
        } else if (!seedFor.isBlank()) {
            demoDataService.seedFor(seedFor);
        }
    }
}

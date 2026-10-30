package com.taste.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Na imagem Docker da raiz (Coolify), o site Angular vai junto do backend, em static/.
 * Rotas do site como /app/social nao sao arquivos: devolvem o index.html para o Angular resolver.
 * Sem o site embutido (deploy so do backend, como no Render), nao ha index.html e nada muda.
 * Ordem mais alta para registrar o "/**" antes do padrao do Spring Boot (que entao nao o duplica).
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource file = super.getResource(resourcePath, location);
                        if (file != null) {
                            return file;
                        }
                        // API, actuator e arquivos que nao existem (ex.: .js de versao antiga) continuam com 404
                        String lastSegment = resourcePath.substring(resourcePath.lastIndexOf('/') + 1);
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("actuator") || lastSegment.contains(".")) {
                            return null;
                        }
                        return super.getResource("index.html", location);
                    }
                });
    }
}

package br.com.senai.telemetria.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration 
public class CorsConfig implements WebMvcConfigurer {
    
    @Override 
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            )
            .allowedMethods(
                "GET",
                "POST",
                "PATCH",
                "PUT",
                "DELETE",
                "OPTIONS"
            )
            .allowedHeaders(
                "Content-Type",
                "Authorization"
            )
            .maxAge(3600);
    }
}

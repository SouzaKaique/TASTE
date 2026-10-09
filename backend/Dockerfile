# ---- Etapa 1: compila o projeto (JDK + Maven Wrapper) ----
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Baixa as dependencias primeiro: so refaz esta etapa quando o pom.xml mudar.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -B dependency:go-offline

COPY src src
RUN ./mvnw -q -B -DskipTests package && cp target/*.jar app.jar

# ---- Etapa 2: imagem final, so com o Java necessario para rodar ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Usuario sem privilegios de administrador.
RUN useradd --system --uid 1001 taste
USER taste

COPY --from=build /app/app.jar app.jar

# Plano gratuito do Render tem 512 MB: limita o uso de memoria do Java.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"

# O Render informa a porta pela variavel PORT (lida em application.properties).
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

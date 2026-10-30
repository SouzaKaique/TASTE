# Imagem unica do TASTE (Coolify): o site Angular e servido pelo proprio backend Spring Boot,
# entao site e API ficam no mesmo endereco e na mesma porta (8080).

# ---- Etapa 1: compila o site (Angular) ----
FROM node:22-alpine AS site
WORKDIR /site

# Instala as dependencias primeiro: so refaz esta etapa quando o package-lock.json mudar.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
# "container" troca o environment para apiUrl = '/api' (mesmo endereco do site).
RUN npx ng build --configuration production,container

# ---- Etapa 2: compila o backend (JDK + Maven Wrapper) com o site dentro ----
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Baixa as dependencias primeiro: so refaz esta etapa quando o pom.xml mudar.
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -B dependency:go-offline

COPY backend/src src
COPY --from=site /site/dist/taste-app/browser src/main/resources/static
RUN ./mvnw -q -B -DskipTests package && cp target/*.jar app.jar

# ---- Etapa 3: imagem final, so com o Java necessario para rodar ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Usa ate 75% da memoria do container (ajustavel pela variavel JAVA_TOOL_OPTIONS no Coolify).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
# O Coolify fica na frente com HTTPS (proxy): o Spring passa a respeitar os cabecalhos X-Forwarded-*.
ENV SERVER_FORWARD_HEADERS_STRATEGY=native

# curl para o health check do Coolify e usuario sem privilegios de administrador.
# Os arquivos ja nascem do usuario "taste" (um chown -R depois duplicaria tudo na imagem).
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1001 taste && chown taste /app
USER taste

# Partida mais rapida com CDS (Class Data Sharing): o jar e extraido e uma
# execucao de "treino" (banco H2 em memoria, encerra assim que o contexto sobe)
# grava as classes ja processadas em app.jsa, reaproveitadas a cada inicializacao.
COPY --from=build --chown=taste /app/app.jar /tmp/app.jar
RUN java -Djarmode=tools -jar /tmp/app.jar extract --destination /app/application \
    && rm /tmp/app.jar \
    && java -XX:ArchiveClassesAtExit=/app/application/app.jsa -Dspring.context.exit=onRefresh \
         -jar /app/application/app.jar

# Porta lida da variavel PORT (padrao 8080) em application.properties.
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT:-8080}/actuator/health" || exit 1
ENTRYPOINT ["java", "-XX:SharedArchiveFile=/app/application/app.jsa", "-Xshare:auto", "-jar", "/app/application/app.jar"]

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

# Plano gratuito do Render tem 512 MB e pouca CPU: limita memoria e acelera a partida.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"

# Partida mais rapida com CDS (Class Data Sharing): o jar e extraido e uma
# execucao de "treino" (banco H2 em memoria, encerra assim que o contexto sobe)
# grava as classes ja processadas em app.jsa, reaproveitadas a cada inicializacao.
COPY --from=build /app/app.jar /tmp/app.jar
RUN java -Djarmode=tools -jar /tmp/app.jar extract --destination /app/application \
    && rm /tmp/app.jar \
    && java -XX:ArchiveClassesAtExit=/app/application/app.jsa -Dspring.context.exit=onRefresh \
         -jar /app/application/app.jar

# Usuario sem privilegios de administrador.
RUN useradd --system --uid 1001 taste && chown -R taste /app
USER taste

# O Render informa a porta pela variavel PORT (lida em application.properties).
EXPOSE 8080
ENTRYPOINT ["java", "-XX:SharedArchiveFile=/app/application/app.jsa", "-Xshare:auto", "-jar", "/app/application/app.jar"]

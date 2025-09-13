@echo off
echo Iniciando o processo de limpeza e reconstrucao do Docker...

REM Define o nome do projeto (ajuste se necessario)
set PROJETO=whatssap_bot_api_back_end
set SERVICO=web

echo 1. Parando e removendo containers e volumes...
docker-compose down -v

echo 2. Removendo todas as imagens Docker nao utilizadas...
docker image prune -a -f

echo 3. Reconstruindo a imagem Docker sem cache...
docker-compose build --no-cache %SERVICO%

echo 4. Iniciando os containers...
docker-compose up -d

echo Processo concluido. Verifique os logs com: docker logs %PROJETO%_%SERVICO%_1
pause

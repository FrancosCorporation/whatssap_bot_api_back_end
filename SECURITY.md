# Política de segurança

Reporte vulnerabilidades pela opção de reporte privado do GitHub para este repositório ou contate os mantenedores pela organização FrancosCorporation. Não publique detalhes exploráveis em issues públicas.

## Invariantes

- Páginas externas não são carregadas pela API nem enviadas a modelos de IA.
- Cada sessão do WhatsApp usa um identificador SHA-256 derivado do e-mail normalizado e fica no diretório persistente do serviço. IDs antigos só migram quando pertencem a uma única conta; colisões antigas exigem novo pareamento e nunca são atribuídas automaticamente.
- O Chromium roda sem --no-sandbox, como usuário sem privilégios, e recebe apenas variáveis de ambiente necessárias ao navegador; JWT_SECRET e MONGO_URI ficam no processo servidor.
- JWT exige segredo único de pelo menos 32 bytes, algoritmo HS256, emissor e audiência validados.
- CORS usa allowlist exata. Login, pareamento e envio de mensagens têm limites de requisições.

# ANEFAC — Sistema de Certificações Profissionais

## Fase 1 — MVP Completo

### Design System & Infraestrutura
- [x] Design system: cores, tipografia, tokens CSS
- [x] index.css com variáveis ANEFAC (azul marinho, dourado)
- [x] index.html com fontes Google (Inter + Playfair Display)
- [x] Schema MySQL completo (todas as tabelas)
- [x] Migrations aplicadas via webdev_execute_sql
- [x] Helpers de banco em db.ts
- [x] Routers tRPC base (auth, certificações, candidatos, avaliadores, bancas, cursos, eventos)

### Site Público
- [x] Home: hero, seção de certificações, como funciona, CTA
- [x] Página de certificação individual (CCA, CCA Plus, EcodoBem N1-N4)
- [x] Página "Como Funciona" por certificação (dinâmica)
- [x] Página de Cursos (modelo Netflix com filtros)
- [x] Popup de captura de lead (nome + email) antes de "Quero me certificar"
- [x] Navbar pública com links e botão de login
- [x] Footer com informações da ANEFAC

### Autenticação Multi-Perfil
- [x] Perfis: admin, coordenador, avaliador_documental, membro_banca, candidato
- [x] Login via Manus OAuth
- [x] Redirecionamento por perfil após login
- [x] Middleware de controle de acesso por papel (adminProcedure, avaliadorProcedure etc.)
- [x] Página de acesso negado

### Área do Candidato
- [x] Dashboard com timeline visual das 8 etapas do processo
- [x] Etapa 1: Cadastro (formulário de dados pessoais e profissionais)
- [x] Etapa 2: Pagamento 1 — Taxa de Análise e Avaliação
- [x] Etapa 3: Upload de documentos via S3 (com checklist de documentos exigidos)
- [x] Etapa 4: Validação documental — aguardando resultado
- [x] Etapa 5: Avaliação teórica (Caminho B) — se aplicável
- [x] Etapa 6: Entrevista — data e banca atribuída
- [x] Etapa 7: Pagamento 2 — Taxa de Emissão do Certificado
- [x] Etapa 8: Certificado emitido — download
- [x] Acesso a cursos de reforço após pagamento 1
- [x] Visualização de documentos enviados

### Painel Administrativo — Módulos Base
- [x] Dashboard admin com KPIs (candidatos por etapa, taxa de aprovação, etc.)
- [x] Gestão de certificações (CRUD: CCA, CCA Plus, EcodoBem N1-N4)
- [x] Aba "Como Funciona" por certificação (etapas editáveis)
- [x] Gestão de candidatos (listagem, filtros, detalhes, histórico)
- [x] Gestão de cursos (CRUD com link externo, categoria, nível)
- [ ] Gestão de pacotes de cursos
- [ ] Configurações gerais do sistema

### Módulo de Avaliadores
- [x] Cadastro de avaliadores (nome, email, tipo: documental/entrevista/ambos)
- [x] Habilitação por certificação
- [x] Status: ativo/inativo/afastado
- [x] Contador de atribuições ativas e históricas
- [x] Distribuição aleatória com balanceamento de carga (menor nº de atribuições ativas)
- [x] Listagem de candidatos atribuídos a cada avaliador

### Módulo de Bancas de Entrevista
- [x] Criação de bancas numeradas (Banca 1, Banca 2...)
- [x] Composição com 1 a 5 membros (presidente + membros)
- [x] Habilitação por certificação
- [x] Status: ativa/inativa
- [x] Atribuição aleatória de candidatos com balanceamento
- [x] Listagem de entrevistas por banca

### Análise Documental (Painel do Avaliador)
- [x] Lista de candidatos atribuídos ao avaliador logado
- [x] Modal de análise por documento com visualizador (iframe/img)
- [x] Checklist dinâmico por tipo de documento
- [x] Campo de parecer individual por documento
- [x] Aprovação/reprovação individual por documento
- [x] Tela de relatório final consolidado
- [x] Decisão de encaminhamento: Caminho A, Caminho B ou reprovado
- [x] Envio da decisão (atualiza status do candidato no banco + registra evento)

### Sistema de Eventos / Log de Notificações
- [x] Tabela de eventos com etapa, candidato, destinatários e status
- [x] Registro automático de evento a cada etapa concluída pelo candidato
- [x] Destinatários mapeados por etapa (candidato, admin, avaliador atribuído, membros da banca)
- [x] Página admin de eventos com histórico e filtros
- [x] Status de notificação: pendente (envio de email será Fase 2)

### Upload de Documentos (S3)
- [x] Integração com S3 via storage helpers do template
- [x] Upload de documentos do candidato (PDF, imagem)
- [x] Geração de URL presignada para visualização pelo avaliador
- [x] Listagem de documentos por candidato no painel admin

### Qualidade
- [x] Zero erros TypeScript
- [x] Testes vitest passando (auth.logout)

## Fase 2 — Futuro
- [ ] Envio real de e-mails (SMTP/SendGrid/Resend) usando a fila de eventos
- [ ] Simulação de conhecimento (trilha Controller e trilha Liderança EcodoBem)
- [ ] Integração com plataformas de cursos (Hotmart, Kiwify)
- [ ] Relatórios avançados e exportação PDF
- [ ] App mobile para candidatos
- [ ] Gestão de pacotes de cursos
- [ ] Configurações gerais do sistema

CREATE TABLE `atribuicoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidatoId` int NOT NULL,
	`atribuicao_tipo` enum('documental','entrevista') NOT NULL,
	`avaliadorId` int,
	`bancaId` int,
	`atribuicao_status` enum('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`encaminhamento` enum('caminho_a','caminho_b','reprovado'),
	`parecerGeral` text,
	`decisaoEm` timestamp,
	`dataEntrevista` timestamp,
	`resultadoEntrevista` enum('aprovado','reprovado'),
	`observacoesEntrevista` text,
	`atribuidoEm` timestamp NOT NULL DEFAULT (now()),
	`concluidoEm` timestamp,
	CONSTRAINT `atribuicoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avaliadores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`telefone` varchar(20),
	`empresa` varchar(255),
	`cargo` varchar(128),
	`avaliador_tipo` enum('documental','entrevista','ambos') NOT NULL,
	`avaliador_status` enum('ativo','inativo','afastado') NOT NULL DEFAULT 'ativo',
	`certificacoesHabilitadas` json DEFAULT ('[]'),
	`totalAtribuicoes` int NOT NULL DEFAULT 0,
	`atribuicoesAtivas` int NOT NULL DEFAULT 0,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avaliadores_id` PRIMARY KEY(`id`),
	CONSTRAINT `avaliadores_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `bancas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(64) NOT NULL,
	`numero` int NOT NULL,
	`certificacoesHabilitadas` json DEFAULT ('[]'),
	`banca_status` enum('ativa','inativa') NOT NULL DEFAULT 'ativa',
	`totalEntrevistas` int NOT NULL DEFAULT 0,
	`entrevistasAtivas` int NOT NULL DEFAULT 0,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bancas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidatos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`certificacaoId` int NOT NULL,
	`nomeCompleto` varchar(255),
	`cpf` varchar(14),
	`telefone` varchar(20),
	`empresa` varchar(255),
	`cargo` varchar(128),
	`anosExperiencia` int,
	`formacao` varchar(255),
	`linkedin` varchar(255),
	`candidato_etapa` enum('cadastro','pagamento_1','upload_documentos','validacao_documental','avaliacao_teorica','entrevista','pagamento_2','certificado','encerrado') NOT NULL DEFAULT 'cadastro',
	`caminho` enum('A','B'),
	`pagamento1Status` enum('pendente','pago','cancelado') DEFAULT 'pendente',
	`pagamento1Data` timestamp,
	`pagamento2Status` enum('pendente','pago','cancelado') DEFAULT 'pendente',
	`pagamento2Data` timestamp,
	`aprovado` boolean,
	`certificadoUrl` text,
	`certificadoEmitidoEm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidatos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(128) NOT NULL,
	`subtitulo` varchar(128),
	`descricao` text,
	`descricaoBreve` varchar(255),
	`publicoAlvo` text,
	`competencias` json DEFAULT ('[]'),
	`preRequisitos` json DEFAULT ('[]'),
	`documentosExigidos` json DEFAULT ('[]'),
	`taxaAnalise` decimal(10,2) DEFAULT '0.00',
	`taxaEmissao` decimal(10,2) DEFAULT '0.00',
	`caminho` enum('A','B'),
	`cert_status` enum('ativa','em_breve','inativa','encerrada') NOT NULL DEFAULT 'ativa',
	`cert_color` enum('blue','gold','green','purple','orange','red','teal') NOT NULL DEFAULT 'blue',
	`imagemUrl` text,
	`editalUrl` text,
	`comoFunciona` json,
	`ordem` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificacoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificacoes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cursos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`curso_categoria` enum('controladoria','financas','gestao','sustentabilidade','lideranca','outros') NOT NULL DEFAULT 'controladoria',
	`curso_nivel` enum('basico','intermediario','avancado') NOT NULL DEFAULT 'basico',
	`duracaoHoras` int,
	`instrutor` varchar(255),
	`preco` decimal(10,2),
	`linkCompra` text,
	`imagemUrl` text,
	`certificacaoRelacionadaId` int,
	`destaque` boolean DEFAULT false,
	`ativo` boolean DEFAULT true,
	`ordem` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cursos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidatoId` int NOT NULL,
	`nomeDocumento` varchar(255) NOT NULL,
	`tipoDocumento` varchar(64),
	`s3Key` varchar(512) NOT NULL,
	`s3Url` text,
	`mimeType` varchar(64),
	`tamanhoBytes` int,
	`doc_status` enum('pendente','aprovado','reprovado') NOT NULL DEFAULT 'pendente',
	`checklistRespostas` json,
	`parecer` text,
	`avaliadorId` int,
	`avaliadoEm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidatoId` int NOT NULL,
	`candidato_etapa` enum('cadastro','pagamento_1','upload_documentos','validacao_documental','avaliacao_teorica','entrevista','pagamento_2','certificado','encerrado') NOT NULL DEFAULT 'cadastro',
	`descricao` varchar(255) NOT NULL,
	`destinatarios` json DEFAULT ('[]'),
	`evento_status` enum('pendente','enviado','erro') NOT NULL DEFAULT 'pendente',
	`notificadoEm` timestamp,
	`metadados` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`certificacaoInteresse` varchar(64),
	`origem` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membros_banca` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bancaId` int NOT NULL,
	`avaliadorId` int NOT NULL,
	`membro_papel` enum('presidente','membro') NOT NULL DEFAULT 'membro',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membros_banca_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pacotes_cursos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`preco` decimal(10,2),
	`linkCompra` text,
	`imagemUrl` text,
	`cursosIds` json DEFAULT ('[]'),
	`certificacaoRelacionadaId` int,
	`destaque` boolean DEFAULT false,
	`ativo` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pacotes_cursos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','coordenador','avaliador_documental','membro_banca','candidato') NOT NULL DEFAULT 'candidato';
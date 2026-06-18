ALTER TABLE `avaliadores` MODIFY COLUMN `certificacoesHabilitadas` json;--> statement-breakpoint
ALTER TABLE `bancas` MODIFY COLUMN `certificacoesHabilitadas` json;--> statement-breakpoint
ALTER TABLE `certificacoes` MODIFY COLUMN `competencias` json;--> statement-breakpoint
ALTER TABLE `certificacoes` MODIFY COLUMN `preRequisitos` json;--> statement-breakpoint
ALTER TABLE `certificacoes` MODIFY COLUMN `documentosExigidos` json;--> statement-breakpoint
ALTER TABLE `eventos` MODIFY COLUMN `destinatarios` json;--> statement-breakpoint
ALTER TABLE `pacotes_cursos` MODIFY COLUMN `cursosIds` json;
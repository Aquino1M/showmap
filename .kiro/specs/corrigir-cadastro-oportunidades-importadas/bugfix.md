# Bugfix Requirements Document

## Introdução

Este documento especifica a correção de um bug crítico que impede usuários com perfil `company_admin` e `agent` de confirmarem o cadastro de oportunidades importadas de planilhas Excel/CSV. O sistema atualmente rejeita essas operações com "Erro inesperado", bloqueando um fluxo importante de entrada de dados.

O problema está na validação de permissões da função `save_event` no backend, que não permite que agentes criem eventos com status "Cadastro" - apenas com status "Proposta". Porém, as oportunidades importadas precisam ser cadastradas com status "Cadastro" para representar leads iniciais que ainda não foram qualificados como propostas.

## Bug Analysis

### Current Behavior (Defect)

**Seção 1: Comportamento Atual (Defeituoso)**

1.1 QUANDO um usuário com perfil `agent` tenta confirmar uma oportunidade importada que possui status "Cadastro" ENTÃO o sistema rejeita a operação com a mensagem de erro "O agente só pode cadastrar propostas em seu próprio nome" e a oportunidade não é salva no banco de dados

1.2 QUANDO um usuário com perfil `agent` tenta criar um novo evento (via importação) com status "Cadastro" e sem agent_id previamente atribuído ENTÃO o sistema rejeita a operação porque a validação `!eventId && (safeEvent.status !== 'Proposta' || eventAgentId !== authData.user.id)` é verdadeira

1.3 QUANDO a função `confirmImportedOpportunity` é executada no frontend ENTÃO ela chama `saveDocument('events', {...})` com status "Cadastro", mas a função backend `save_event` valida que apenas status "Proposta" é permitido para agentes em novos registros

### Expected Behavior (Correct)

**Seção 2: Comportamento Esperado (Correto)**

2.1 QUANDO um usuário com perfil `agent` tenta confirmar uma oportunidade importada com status "Cadastro" ENTÃO o sistema SHALL permitir a operação e salvar a oportunidade no banco de dados com sucesso, exibindo a mensagem "Oportunidade cadastrada no banco com sucesso"

2.2 QUANDO um usuário com perfil `company_admin` tenta confirmar uma oportunidade importada com qualquer status (incluindo "Cadastro") ENTÃO o sistema SHALL permitir a operação sem restrições e salvar a oportunidade com sucesso

2.3 QUANDO um usuário com perfil `superadmin` tenta confirmar uma oportunidade importada com qualquer status ENTÃO o sistema SHALL permitir a operação sem restrições e salvar a oportunidade com sucesso

2.4 QUANDO a função backend `save_event` valida permissões para criação de novos eventos por agentes ENTÃO o sistema SHALL permitir eventos com status "Cadastro" quando originados de importação de oportunidades

### Unchanged Behavior (Regression Prevention)

**Seção 3: Comportamento Inalterado (Prevenção de Regressão)**

3.1 QUANDO um usuário com perfil `agent` tenta criar manualmente (não via importação) um evento com status diferente de "Proposta" ENTÃO o sistema SHALL CONTINUE TO rejeitar a operação com a mensagem "O agente só pode cadastrar propostas em seu próprio nome"

3.2 QUANDO um usuário com perfil `agent` tenta criar um evento do tipo "Proposta" com agent_id diferente do seu próprio ID ENTÃO o sistema SHALL CONTINUE TO rejeitar a operação

3.3 QUANDO um usuário com perfil `agent` tenta editar um evento existente que não pertence a ele (agent_id diferente) ENTÃO o sistema SHALL CONTINUE TO rejeitar a operação com a mensagem "O agente só pode alterar propostas assumidas por ele"

3.4 QUANDO um usuário com perfil `agent` tenta alterar o status de um evento para valores que não sejam 'Proposta', 'Reservado' ou 'Vendido' ENTÃO o sistema SHALL CONTINUE TO rejeitar a operação com a mensagem "O agente pode registrar somente proposta, reserva ou venda"

3.5 QUANDO um usuário tenta salvar um evento de uma company_id diferente da sua própria company_id (exceto superadmin) ENTÃO o sistema SHALL CONTINUE TO rejeitar a operação com a mensagem "Você não pode salvar dados de outro escritório"

3.6 QUANDO um usuário com perfil `company_admin` cria ou edita eventos dentro de sua própria companhia ENTÃO o sistema SHALL CONTINUE TO permitir essas operações sem as restrições aplicadas aos agentes

3.7 QUANDO um usuário com perfil `superadmin` realiza qualquer operação de criação ou edição de eventos ENTÃO o sistema SHALL CONTINUE TO permitir essas operações sem restrições de company_id ou agent_id

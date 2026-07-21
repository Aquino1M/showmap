# Bugfix Design - Correção de Validação de Permissões para Cadastro de Oportunidades Importadas

## Overview

Este design aborda a correção de um bug crítico na função `save_event` (Edge Function `manage-user/index.ts`) que impede usuários com perfil `agent` e `company_admin` de confirmarem oportunidades importadas com status "Cadastro".

O bug está localizado na validação de permissões para criação de novos eventos (linha ~273 da Edge Function), que rejeita qualquer tentativa de agentes criarem eventos com status diferente de "Proposta". Esta regra é muito restritiva para o fluxo de importação de oportunidades, onde agentes precisam cadastrar leads iniciais (status "Cadastro") que ainda não foram qualificados como propostas.

A estratégia de correção consiste em relaxar a validação para permitir que agentes criem eventos com status "Cadastro" quando o `agent_id` é `null`, indicando que a oportunidade ainda não foi assumida por nenhum agente específico. Esta abordagem preserva a segurança (agentes só podem criar cadastros não atribuídos) e mantém todas as outras restrições intactas.

## Glossary

- **Bug_Condition (C)**: A condição que desencadeia o bug - quando um agente tenta criar um evento com status "Cadastro" e agent_id null (oportunidade importada)
- **Property (P)**: O comportamento desejado quando C(X) ocorre - o sistema deve permitir a criação do evento sem erros
- **Preservation**: Todas as validações de segurança existentes que impedem agentes de criar propostas em nome de outros agentes ou manipular eventos que não lhes pertencem
- **save_event**: A ação `save_event` na Edge Function `manage-user/index.ts` que valida e persiste eventos no banco de dados
- **confirmImportedOpportunity**: Função no `App.jsx` (linha ~472) que processa oportunidades importadas de planilhas e chama `saveDocument` com status "Cadastro"
- **isMaster**: Variável booleana que identifica se o usuário autenticado possui role "superadmin"
- **isCompanyAdmin**: Variável booleana que identifica se o usuário autenticado possui role "company_admin"
- **eventId**: O ID do evento sendo editado (null para novos eventos)
- **safeEvent**: Objeto sanitizado contendo os dados do evento a ser salvo

## Bug Details

### Bug Condition

O bug se manifesta quando um usuário com perfil `agent` ou `company_admin` tenta confirmar uma oportunidade importada de uma planilha Excel/CSV. A função `confirmImportedOpportunity` no frontend cria um evento com status "Cadastro" e `agent_id` null, mas a validação no backend rejeita essa operação.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: string, event: Event, caller: Profile }
  OUTPUT: boolean
  
  RETURN input.action == 'save_event'
         AND input.caller.role == 'agent'
         AND input.event.id == null
         AND input.event.status == 'Cadastro'
         AND input.event.agent_id == null
         AND input.event.company_id == input.caller.company_id
END FUNCTION
```

**Code Location:**
- **File**: `supabase/functions/manage-user/index.ts`
- **Line**: ~273
- **Code**:
```typescript
if (!isMaster && !isCompanyAdmin && !eventId && (safeEvent.status !== 'Proposta' || eventAgentId !== authData.user.id)) {
  throw new Error('O agente só pode cadastrar propostas em seu próprio nome.')
}
```

### Examples

**Example 1: Agente confirmando oportunidade importada**
- **Input**: 
  - Usuário: role = "agent", company_id = "abc-123"
  - Evento: { status: "Cadastro", agent_id: null, company_id: "abc-123" }
- **Expected**: Evento criado com sucesso
- **Actual**: Erro "O agente só pode cadastrar propostas em seu próprio nome"

**Example 2: Company Admin confirmando oportunidade importada**
- **Input**:
  - Usuário: role = "company_admin", company_id = "xyz-789"
  - Evento: { status: "Cadastro", agent_id: null, company_id: "xyz-789" }
- **Expected**: Evento criado com sucesso (company_admin não tem restrições)
- **Actual**: Funciona corretamente (não afetado pelo bug)

**Example 3: Agente tentando criar proposta em nome de outro agente**
- **Input**:
  - Usuário: role = "agent", id = "user-1", company_id = "abc-123"
  - Evento: { status: "Proposta", agent_id: "user-2", company_id: "abc-123" }
- **Expected**: Erro de permissão
- **Actual**: Funciona corretamente - deve continuar bloqueando após o fix

**Example 4: Superadmin criando evento com qualquer status**
- **Input**:
  - Usuário: role = "superadmin"
  - Evento: { status: "Cadastro", agent_id: null }
- **Expected**: Evento criado com sucesso
- **Actual**: Funciona corretamente (não afetado pelo bug)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Agentes NÃO podem criar eventos com status diferente de "Cadastro" ou "Proposta"
- Agentes NÃO podem criar eventos tipo "Proposta" atribuídos a outros agentes (agent_id diferente do seu)
- Agentes NÃO podem editar eventos de outros agentes
- Agentes NÃO podem alterar status de eventos para valores além de 'Proposta', 'Reservado' ou 'Vendido'
- Usuários NÃO podem manipular eventos de outras empresas (exceto superadmin)
- Company admins continuam com permissões totais dentro de suas empresas
- Superadmins continuam com permissões totais sem restrições
- Todas as validações de campos obrigatórios (state_id, city, date, type) permanecem ativas

**Scope:**
Todas as operações que NÃO envolvem a criação de novos eventos com status "Cadastro" e agent_id null por agentes devem permanecer completamente inalteradas. Isso inclui:
- Criação manual de propostas por agentes (via modal de cadastro)
- Edição de eventos existentes por agentes
- Alteração de status de eventos assumidos por agentes
- Deleção de eventos (somente company_admin e superadmin)
- Operações realizadas por company_admin e superadmin

## Hypothesized Root Cause

Com base na análise do código, identifiquei a causa raiz do bug:

1. **Validação Excessivamente Restritiva**: A validação na linha ~273 usa uma lógica booleana que rejeita QUALQUER combinação onde:
   - O usuário não é superadmin (`!isMaster`)
   - O usuário não é company_admin (`!isCompanyAdmin`)
   - É um novo evento (`!eventId`)
   - E QUALQUER UMA das seguintes condições é verdadeira:
     - `safeEvent.status !== 'Proposta'` (status diferente de Proposta)
     - `eventAgentId !== authData.user.id` (agent_id diferente do usuário)

2. **Contexto Ignorado**: A validação não considera o CONTEXTO da operação. Ela trata igualmente:
   - Criação manual de eventos (onde o agente deve assumir responsabilidade)
   - Importação de oportunidades (onde agent_id é null propositalmente)

3. **Lógica Booleana Composta**: A expressão `(safeEvent.status !== 'Proposta' || eventAgentId !== authData.user.id)` significa:
   - Rejeita se status ≠ "Proposta" **OU** se agent_id ≠ user.id
   - Para oportunidades importadas: status = "Cadastro" ✓ (primeira condição verdadeira)
   - Para oportunidades importadas: agent_id = null ✓ (segunda condição verdadeira)
   - Resultado: **REJEITA** mesmo sendo um caso válido

4. **Semântica de Status "Cadastro"**: O status "Cadastro" foi criado para representar oportunidades não qualificadas que ainda não foram assumidas por nenhum agente. A validação atual não reconhece esta semântica.

## Correctness Properties

Property 1: Bug Condition - Permitir Cadastro de Oportunidades Importadas por Agentes

_For any_ input where an agent attempts to create a new event with status "Cadastro" and agent_id null within their own company, the fixed save_event function SHALL allow the operation and persist the event to the database successfully, returning the event ID without throwing an error.

**Validates: Requirements 2.1, 2.4**

Property 2: Preservation - Manutenção de Restrições de Segurança para Agentes

_For any_ input where an agent attempts to create or edit events in ways that do NOT match the bug condition (status ≠ "Cadastro" with agent_id null), the fixed save_event function SHALL produce the same validation behavior as the original function, rejecting unauthorized operations with appropriate error messages.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de root cause está correta:

**File**: `supabase/functions/manage-user/index.ts`

**Function**: `save_event` action handler

**Specific Changes**:

1. **Modificar a Validação de Criação para Agentes (Linha ~273)**:
   - **Before**:
     ```typescript
     if (!isMaster && !isCompanyAdmin && !eventId && (safeEvent.status !== 'Proposta' || eventAgentId !== authData.user.id)) {
       throw new Error('O agente só pode cadastrar propostas em seu próprio nome.')
     }
     ```
   - **After**:
     ```typescript
     if (!isMaster && !isCompanyAdmin && !eventId) {
       const isValidProposal = safeEvent.status === 'Proposta' && eventAgentId === authData.user.id
       const isValidImportedOpportunity = safeEvent.status === 'Cadastro' && eventAgentId === null
       
       if (!isValidProposal && !isValidImportedOpportunity) {
         throw new Error('O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.')
       }
     }
     ```

2. **Rationale da Mudança**:
   - Torna a lógica explícita e legível: define claramente os dois casos válidos
   - `isValidProposal`: Mantém a regra original - agente pode criar Proposta se agent_id é dele
   - `isValidImportedOpportunity`: Nova regra - agente pode criar Cadastro se agent_id é null
   - A validação rejeita qualquer outra combinação

3. **Segurança Preservada**:
   - Agentes ainda não podem criar eventos com status diferente de "Cadastro" ou "Proposta"
   - Agentes ainda não podem criar propostas em nome de outros (agent_id diferente)
   - Agentes ainda não podem criar cadastros já atribuídos (agent_id preenchido)
   - A validação de company_id anterior (linha ~269) garante isolamento entre empresas

4. **Mensagem de Erro Atualizada** (opcional mas recomendado):
   - A mensagem pode ser melhorada para refletir os dois cenários válidos
   - Versão original: "O agente só pode cadastrar propostas em seu próprio nome."
   - Nova versão sugerida: "O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas."

5. **Nenhuma Alteração Necessária em Outras Validações**:
   - As validações de edição de eventos existentes (linhas ~285-299) permanecem inalteradas
   - As validações de campos obrigatórios (linha ~272) permanecem inalteradas
   - As validações de company_id (linhas ~269-271) permanecem inalteradas

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de três fases: primeiro, executar testes exploratórios no código UNFIXED para confirmar o bug e o root cause; segundo, aplicar o fix e executar testes que verificam a correção; terceiro, executar testes de preservação para garantir que nenhum comportamento existente foi quebrado.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar o bug no código UNFIXED. Confirmar que agentes não conseguem criar eventos com status "Cadastro" e agent_id null, e que a mensagem de erro corresponde ao esperado.

**Test Plan**: Criar testes de integração que simulam a chamada à Edge Function `manage-user` com ação `save_event`. Usar tokens de autenticação reais ou mocks para simular usuários com diferentes perfis. Executar os testes no código UNFIXED para observar as falhas.

**Test Cases**:
1. **Agent Creating Imported Opportunity**: Simular agente criando evento com status "Cadastro" e agent_id null (will fail on unfixed code)
   - Input: role = "agent", event = { status: "Cadastro", agent_id: null, ... }
   - Expected on unfixed: Error "O agente só pode cadastrar propostas em seu próprio nome"
   - Expected on fixed: Success with event ID returned

2. **Company Admin Creating Imported Opportunity**: Simular company_admin criando evento com status "Cadastro" e agent_id null (should pass on unfixed code)
   - Input: role = "company_admin", event = { status: "Cadastro", agent_id: null, ... }
   - Expected on both: Success with event ID returned

3. **Agent Creating Self-Assigned Proposal**: Simular agente criando proposta atribuída a si mesmo (should pass on unfixed code)
   - Input: role = "agent", event = { status: "Proposta", agent_id: <own_id>, ... }
   - Expected on both: Success with event ID returned

4. **Agent Creating Other-Agent Proposal**: Simular agente tentando criar proposta para outro agente (should fail on both)
   - Input: role = "agent", event = { status: "Proposta", agent_id: <other_id>, ... }
   - Expected on both: Error message about permissions

**Expected Counterexamples**:
- Agentes não conseguem criar eventos com status "Cadastro" mesmo quando agent_id é null
- A validação booleana `(safeEvent.status !== 'Proposta' || eventAgentId !== authData.user.id)` é verdadeira para oportunidades importadas
- Root cause confirmado: validação não permite exceção para status "Cadastro" com agent_id null

### Fix Checking

**Goal**: Verificar que para todas as entradas onde a bug condition é verdadeira, a função corrigida produz o comportamento esperado (permite criação de eventos).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := save_event_fixed(input)
  ASSERT result.success == true
  ASSERT result.id != null
  ASSERT NO error thrown
END FOR
```

**Test Implementation**: Executar os mesmos test cases da fase exploratória no código FIXED e verificar que:
- Test Case 1 (Agent Creating Imported Opportunity) agora passa
- Nenhum erro é lançado
- Um ID de evento válido é retornado
- O evento é persistido corretamente no banco de dados

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde a bug condition NÃO é verdadeira, a função corrigida produz o mesmo resultado que a função original (comportamento preservado).

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  result_original := save_event_original(input)
  result_fixed := save_event_fixed(input)
  ASSERT result_original.success == result_fixed.success
  ASSERT result_original.error == result_fixed.error
END FOR
```

**Testing Approach**: Property-based testing é altamente recomendado para preservation checking porque:
- Gera automaticamente muitos casos de teste cobrindo todo o domínio de entrada
- Detecta edge cases que testes manuais podem perder
- Fornece garantias fortes de que o comportamento foi preservado para todas as entradas não-buggy

**Test Plan**: Observar comportamento no código UNFIXED primeiro para capturar o comportamento correto esperado, depois escrever property-based tests que capturam esse comportamento e executar no código FIXED.

**Test Cases**:

1. **Agent Creating Cadastro with Assigned Agent**: Observar que unfixed code rejeita, then verify fixed code also rejeita
   - Input: role = "agent", event = { status: "Cadastro", agent_id: <other_id>, ... }
   - Expected on both: Error message

2. **Agent Creating Non-Cadastro Non-Proposta Status**: Observar que unfixed code rejeita, then verify fixed code also rejeita
   - Input: role = "agent", event = { status: "Reservado", agent_id: null, ... }
   - Expected on both: Error message

3. **Agent Editing Other Agent's Event**: Observar que unfixed code rejeita, then verify fixed code also rejeita
   - Input: role = "agent", existing event with agent_id = <other_id>
   - Expected on both: Error "O agente só pode alterar propostas assumidas por ele"

4. **Agent Editing Own Event to Invalid Status**: Observar que unfixed code rejeita, then verify fixed code also rejeita
   - Input: role = "agent", existing event with agent_id = <own_id>, new status = "Cadastro"
   - Expected on both: Error "O agente pode registrar somente proposta, reserva ou venda"

5. **Agent Cross-Company Operation**: Observar que unfixed code rejeita, then verify fixed code also rejeita
   - Input: role = "agent", company_id = "abc", event.company_id = "xyz"
   - Expected on both: Error "Você não pode salvar dados de outro escritório"

6. **Company Admin Operations**: Observar que unfixed code permite, then verify fixed code also permite
   - Input: role = "company_admin", various event configurations within own company
   - Expected on both: Success

7. **Superadmin Operations**: Observar que unfixed code permite, then verify fixed code also permite
   - Input: role = "superadmin", any event configuration
   - Expected on both: Success

### Unit Tests

- Test the modified validation logic in isolation
- Test both valid cases (isValidProposal and isValidImportedOpportunity)
- Test rejection cases (neither condition met)
- Test edge cases (null values, empty strings, undefined fields)
- Test role-based access control (agent, company_admin, superadmin)
- Test company isolation (same company vs different company)

### Property-Based Tests

- Generate random agent users and verify they can create Cadastro events with agent_id null
- Generate random agent users and verify they cannot create Cadastro events with agent_id assigned
- Generate random event configurations and verify preservation of rejection rules for invalid operations
- Generate random company_admin users and verify they maintain unrestricted access within their companies
- Generate random superadmin users and verify they maintain unrestricted global access
- Test across many scenarios to ensure no regression in existing security validations

### Integration Tests

- Test the full flow from frontend (confirmImportedOpportunity) to backend (save_event) to database
- Import a real CSV/Excel file and confirm all opportunities can be registered
- Test with multiple user profiles (agent, company_admin, superadmin)
- Test error handling and user feedback (toast messages)
- Verify database state after successful operations
- Verify events are visible in the UI after creation

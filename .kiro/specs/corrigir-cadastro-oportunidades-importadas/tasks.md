# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Agent Cannot Create Imported Opportunities
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Test that when `input.action == 'save_event'`
    - AND `input.caller.role == 'agent'`
    - AND `input.event.id == null` (new event)
    - AND `input.event.status == 'Cadastro'`
    - AND `input.event.agent_id == null` (unassigned opportunity)
    - AND `input.event.company_id == input.caller.company_id` (same company)
    - THEN the system should allow the operation and return success with event ID
  - The test assertions should match the Expected Behavior Properties from design:
    - Assert no error is thrown
    - Assert event ID is returned
    - Assert event is persisted to database
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with error "O agente só pode cadastrar propostas em seu próprio nome" (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Security Validations for Agent Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (cases where isBugCondition returns false)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - **Test 2.1**: Agent creating Cadastro with assigned agent_id (should be rejected)
      - Observe: Unfixed code rejects with error
      - Property: For all agents attempting to create events with status "Cadastro" and agent_id != null, system rejects with error
    - **Test 2.2**: Agent creating event with invalid status (not "Cadastro" or "Proposta")
      - Observe: Unfixed code rejects with error
      - Property: For all agents attempting to create events with status not in ["Cadastro", "Proposta"], system rejects with error
    - **Test 2.3**: Agent creating Proposta for another agent (agent_id different from own)
      - Observe: Unfixed code rejects with error
      - Property: For all agents attempting to create Proposta events with agent_id != own_id, system rejects with error
    - **Test 2.4**: Agent editing other agent's event
      - Observe: Unfixed code rejects with "O agente só pode alterar propostas assumidas por ele"
      - Property: For all agents attempting to edit events where event.agent_id != own_id, system rejects with error
    - **Test 2.5**: Agent changing event status to invalid values
      - Observe: Unfixed code rejects with "O agente pode registrar somente proposta, reserva ou venda"
      - Property: For all agents attempting to update event status to values not in ["Proposta", "Reservado", "Vendido"], system rejects with error
    - **Test 2.6**: Agent cross-company operation
      - Observe: Unfixed code rejects with "Você não pode salvar dados de outro escritório"
      - Property: For all agents attempting to save events with company_id != own_company_id, system rejects with error
    - **Test 2.7**: Company admin operations within own company
      - Observe: Unfixed code allows all operations
      - Property: For all company_admin users, all event operations within own company are permitted
    - **Test 2.8**: Superadmin operations
      - Observe: Unfixed code allows all operations
      - Property: For all superadmin users, all event operations are permitted without restrictions
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix for Agent Cannot Create Imported Opportunities

  - [x] 3.1 Implement the fix in manage-user Edge Function
    - Open file: `supabase/functions/manage-user/index.ts`
    - Locate the validation at line ~273
    - Replace the existing validation logic:
      ```typescript
      // BEFORE (linha ~273):
      if (!isMaster && !isCompanyAdmin && !eventId && (safeEvent.status !== 'Proposta' || eventAgentId !== authData.user.id)) {
        throw new Error('O agente só pode cadastrar propostas em seu próprio nome.')
      }
      ```
    - With the new explicit validation logic:
      ```typescript
      // AFTER:
      if (!isMaster && !isCompanyAdmin && !eventId) {
        const isValidProposal = safeEvent.status === 'Proposta' && eventAgentId === authData.user.id
        const isValidImportedOpportunity = safeEvent.status === 'Cadastro' && eventAgentId === null
        
        if (!isValidProposal && !isValidImportedOpportunity) {
          throw new Error('O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.')
        }
      }
      ```
    - Rationale:
      - Makes validation logic explicit and readable
      - `isValidProposal`: Maintains original rule - agent can create Proposta if agent_id is theirs
      - `isValidImportedOpportunity`: New rule - agent can create Cadastro if agent_id is null
      - Rejects any other combination
      - Security preserved: agents still cannot create events with other statuses or proposals for other agents
    - _Bug_Condition: isBugCondition(input) where input.action == 'save_event' AND input.caller.role == 'agent' AND input.event.id == null AND input.event.status == 'Cadastro' AND input.event.agent_id == null AND input.event.company_id == input.caller.company_id_
    - _Expected_Behavior: expectedBehavior(result) - operation allowed, event ID returned, event persisted to database_
    - _Preservation: All security validations from Preservation Requirements section - agents cannot create events with invalid statuses, cannot create proposals for other agents, cannot edit other agents' events, cannot perform cross-company operations_
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Agent Can Create Imported Opportunities
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that agents can now successfully create events with status "Cadastro" and agent_id null
    - Verify that event ID is returned
    - Verify that event is persisted to database
    - _Requirements: 2.1, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Security Validations Maintained
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all 8 preservation test cases still pass:
      - Test 2.1: Agent creating Cadastro with assigned agent_id still rejected
      - Test 2.2: Agent creating event with invalid status still rejected
      - Test 2.3: Agent creating Proposta for another agent still rejected
      - Test 2.4: Agent editing other agent's event still rejected
      - Test 2.5: Agent changing event status to invalid values still rejected
      - Test 2.6: Agent cross-company operation still rejected
      - Test 2.7: Company admin operations within own company still permitted
      - Test 2.8: Superadmin operations still permitted without restrictions
    - Confirm no security regressions introduced
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests (bug condition + preservation tests)
  - Verify test output shows all tests passing
  - Verify no error messages in console
  - Test the complete user flow:
    - Login as agent user
    - Import Excel/CSV file with opportunities
    - Confirm multiple imported opportunities with status "Cadastro"
    - Verify success messages appear
    - Verify events are visible in the UI
    - Verify events are correctly persisted in database
  - If any issues arise, document them and ask the user for guidance
  - Mark as complete when all tests pass and user flow works correctly

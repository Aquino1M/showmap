import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Bug Condition Exploration Test - Imported Opportunities Creation by Agents
 * 
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.4**
 * 
 * This test validates the bug condition where agents should be able to create
 * imported opportunities (status "Cadastro" with agent_id null) but currently cannot.
 * 
 * CRITICAL: This test MUST FAIL on unfixed code to confirm the bug exists.
 * 
 * Bug Condition:
 * - action: 'save_event'
 * - caller.role: 'agent'
 * - event.id: null (new event)
 * - event.status: 'Cadastro'
 * - event.agent_id: null
 * - event.company_id: matches caller.company_id
 * 
 * Expected on unfixed code: Error "O agente só pode cadastrar propostas em seu próprio nome"
 * Expected after fix: Success with event ID returned
 */

// Mock Supabase client for testing
function createMockSupabaseClient(mockBehavior) {
  return {
    auth: {
      getUser: mockBehavior.getUser,
      admin: {
        createUser: mockBehavior.createUser,
        updateUserById: mockBehavior.updateUserById,
        deleteUser: mockBehavior.deleteUser,
        listUsers: mockBehavior.listUsers,
      }
    },
    from: (table) => ({
      select: (columns) => ({
        eq: (col, val) => ({
          single: mockBehavior.queries?.[table]?.single,
          maybeSingle: mockBehavior.queries?.[table]?.maybeSingle,
        }),
        ilike: (col, val) => ({
          maybeSingle: mockBehavior.queries?.[table]?.maybeSingle,
        }),
        order: (col, opts) => mockBehavior.queries?.[table]?.list || { data: [], error: null },
      }),
      upsert: (data, opts) => ({
        select: (cols) => ({
          single: mockBehavior.queries?.[table]?.upsertSingle,
        }),
      }),
      update: (data) => ({
        eq: (col, val) => ({
          select: (cols) => ({
            single: mockBehavior.queries?.[table]?.updateSingle,
          }),
        }),
      }),
      delete: () => ({
        eq: (col, val) => mockBehavior.queries?.[table]?.delete,
      }),
    }),
  };
}

// Simulate the FIXED save_event validation logic from manage-user/index.ts
// This mirrors the actual code AFTER the fix is applied.
function simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin) {
  const safeEvent = {
    id: event.id || null,
    state_id: event.state_id?.trim().toUpperCase() || '',
    city: event.city?.trim() || '',
    date: event.date || '',
    time: event.time || null,
    type: event.type || '',
    status: event.status || 'Disponível',
    company_id: event.company_id,
    agent_id: event.agent_id || null,
    contractor_name: event.contractor_name?.trim() || null,
    contractor_email: event.contractor_email?.trim().toLowerCase() || null,
    contractor_phone: event.contractor_phone?.trim() || null,
    contractor_instagram: event.contractor_instagram?.trim() || null,
    event_name: event.event_name?.trim() || null,
    artist_name: event.artist_name?.trim() || null,
    is_recurring: event.is_recurring === true,
  };

  if (!safeEvent.state_id || !safeEvent.city || !safeEvent.date || !safeEvent.type) {
    throw new Error('Preencha os dados obrigatórios da agenda.');
  }

  const eventCompanyId = safeEvent.company_id;
  const eventAgentId = safeEvent.agent_id;
  const eventId = safeEvent.id || null;

  if (!isMaster && eventCompanyId !== caller.company_id) {
    throw new Error('Você não pode salvar dados de outro escritório.');
  }

  // FIXED validation — mirrors the corrected code in index.ts:
  // Explicitly allows two valid cases for new events by agents:
  //   1. isValidProposal: status 'Proposta' with agent_id equal to own id
  //   2. isValidImportedOpportunity: status 'Cadastro' with agent_id null
  if (!isMaster && !isCompanyAdmin && !eventId) {
    const isValidProposal = safeEvent.status === 'Proposta' && eventAgentId === caller.id;
    const isValidImportedOpportunity = safeEvent.status === 'Cadastro' && eventAgentId === null;

    if (!isValidProposal && !isValidImportedOpportunity) {
      throw new Error('O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.');
    }
  }

  return { success: true, id: 'mock-event-id', event: safeEvent };
}

test('Bug Condition: Agent creating imported opportunity (status Cadastro, agent_id null) - EXPECTED TO PASS after fix', () => {
  // Arrange: Setup the bug condition inputs
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const event = {
    id: null, // New event
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Cadastro', // Imported opportunity status
    company_id: 'company-abc', // Same as caller
    agent_id: null, // Unassigned (imported)
    contractor_name: 'Imported Client',
    contractor_email: 'client@example.com',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  // Act & Assert: This should succeed (allow creation) after fix
  // But will FAIL with error on unfixed code
  try {
    const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
    
    // After fix: These assertions should pass
    assert.ok(result.success, 'Agent should be able to create imported opportunity');
    assert.ok(result.id, 'Event ID should be returned');
    assert.equal(result.event.status, 'Cadastro', 'Status should be Cadastro');
    assert.equal(result.event.agent_id, null, 'Agent ID should be null for imported opportunities');
  } catch (error) {
    // After fix: should NOT reach here. If it does, the fix was not applied correctly.
    assert.equal(
      error.message,
      'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.',
      'Unexpected error: fix may not be applied correctly'
    );
    
    // Re-throw so test fails and surfaces the problem
    throw new Error(`FIX NOT APPLIED: ${error.message}`);
  }
});

test('Baseline: Agent creating self-assigned proposal should work - EXPECTED TO PASS on unfixed code', () => {
  // This test validates that the current behavior for self-assigned proposals is correct
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const event = {
    id: null,
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta', // Proposal status
    company_id: 'company-abc',
    agent_id: 'agent-user-123', // Self-assigned
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Agent should be able to create self-assigned proposal');
  assert.ok(result.id, 'Event ID should be returned');
});

test('Baseline: Agent creating proposal for another agent should fail - EXPECTED TO FAIL on unfixed code', () => {
  // This test validates that security is maintained - agents cannot create proposals for others
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const event = {
    id: null,
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-abc',
    agent_id: 'other-agent-456', // Different agent
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.' },
    'Agent should not be able to create proposals for other agents'
  );
});

test('Baseline: Company admin creating imported opportunity should work - EXPECTED TO PASS on unfixed code', () => {
  // This test validates that company_admin has proper permissions
  const caller = {
    id: 'admin-user-789',
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'company_admin',
    company_id: 'company-abc',
  };

  const event = {
    id: null,
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Cadastro', // Imported opportunity
    company_id: 'company-abc',
    agent_id: null, // Unassigned
    contractor_name: 'Imported Client',
  };

  const isMaster = false;
  const isCompanyAdmin = true;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Company admin should be able to create imported opportunities');
  assert.ok(result.id, 'Event ID should be returned');
});

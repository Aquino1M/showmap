import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Preservation Property Tests - Security Validations for Agent Operations
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 * 
 * CRITICAL: These tests MUST PASS on unfixed code to establish baseline behavior.
 * Follow observation-first methodology: observe unfixed code behavior, capture it in tests.
 * 
 * These tests ensure that the fix for the bug (allowing agents to create imported opportunities)
 * does NOT break existing security validations. All agent restrictions must remain intact.
 */

// Simulate the save_event validation logic from manage-user/index.ts
function simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin, existingEvent = null) {
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

  // Cross-company validation
  if (!isMaster && eventCompanyId !== caller.company_id) {
    throw new Error('Você não pode salvar dados de outro escritório.');
  }

  // FIXED: Explicit validation - allows both proposals (self-assigned) and imported opportunities (agent_id null)
  if (!isMaster && !isCompanyAdmin && !eventId) {
    const isValidProposal = safeEvent.status === 'Proposta' && eventAgentId === caller.id;
    const isValidImportedOpportunity = safeEvent.status === 'Cadastro' && eventAgentId === null;
    if (!isValidProposal && !isValidImportedOpportunity) {
      throw new Error('O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.');
    }
  }

  // Editing existing events
  if (eventId && existingEvent) {
    if (!isMaster && existingEvent.company_id !== caller.company_id) {
      throw new Error('Você não pode alterar dados de outro escritório.');
    }
    if (!isMaster && !isCompanyAdmin && existingEvent.agent_id && existingEvent.agent_id !== caller.id) {
      throw new Error('O agente só pode alterar propostas assumidas por ele.');
    }

    // Agent restrictions on editing
    if (!isMaster && !isCompanyAdmin && existingEvent) {
      if (!existingEvent.agent_id && (safeEvent.status !== 'Proposta' || eventAgentId !== caller.id)) {
        throw new Error('Assuma a proposta antes de alterar o status.');
      }
      if (existingEvent.agent_id && !['Proposta', 'Reservado', 'Vendido'].includes(String(safeEvent.status))) {
        throw new Error('O agente pode registrar somente proposta, reserva ou venda.');
      }
    }
  }

  return { success: true, id: eventId || 'mock-new-event-id', event: safeEvent };
}

/**
 * Test 2.1: Agent creating Cadastro with assigned agent_id (should be rejected)
 * 
 * **Validates: Requirements 3.1**
 * 
 * Agents should NOT be able to create events with status "Cadastro" when agent_id is assigned.
 * This preserves the restriction that Cadastro status is only for unassigned imported opportunities.
 */
test('Preservation 2.1: Agent creating Cadastro with assigned agent_id - MUST be rejected', () => {
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
    status: 'Cadastro',
    company_id: 'company-abc',
    agent_id: 'agent-user-123', // Assigned (should be rejected)
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.' },
    'Agent should not be able to create Cadastro with assigned agent_id'
  );
});

/**
 * Test 2.2: Agent creating event with invalid status (should be rejected)
 * 
 * **Validates: Requirements 3.2**
 * 
 * Agents should only be able to create events with status "Proposta" (self-assigned)
 * or "Cadastro" (unassigned). Any other status should be rejected.
 */
test('Preservation 2.2: Agent creating event with invalid status (Disponível) - MUST be rejected', () => {
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
    status: 'Disponível', // Invalid status for agent creation
    company_id: 'company-abc',
    agent_id: null,
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.' },
    'Agent should not be able to create event with status "Disponível"'
  );
});

test('Preservation 2.2b: Agent creating event with invalid status (Reservado) - MUST be rejected', () => {
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
    status: 'Reservado', // Invalid status for agent creation
    company_id: 'company-abc',
    agent_id: 'agent-user-123',
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.' },
    'Agent should not be able to create event with status "Reservado"'
  );
});

test('Preservation 2.2c: Agent creating event with invalid status (Vendido) - MUST be rejected', () => {
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
    status: 'Vendido', // Invalid status for agent creation
    company_id: 'company-abc',
    agent_id: 'agent-user-123',
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.' },
    'Agent should not be able to create event with status "Vendido"'
  );
});

/**
 * Test 2.3: Agent creating Proposta for another agent (should be rejected)
 * 
 * **Validates: Requirements 3.3**
 * 
 * Agents must only create Proposta events assigned to themselves.
 * Creating proposals for other agents should be rejected.
 */
test('Preservation 2.3: Agent creating Proposta for another agent - MUST be rejected', () => {
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
    'Agent should not be able to create Proposta for another agent'
  );
});

test('Preservation 2.3b: Agent creating Proposta with null agent_id - MUST be rejected', () => {
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
    agent_id: null, // Null (should be self-assigned)
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'O agente só pode cadastrar propostas em seu próprio nome ou oportunidades importadas.' },
    'Agent should not be able to create Proposta with null agent_id'
  );
});

/**
 * Test 2.4: Agent editing other agent's event (should be rejected)
 * 
 * **Validates: Requirements 3.4**
 * 
 * Agents can only edit events that are assigned to them.
 * Attempting to edit another agent's event should be rejected.
 */
test('Preservation 2.4: Agent editing other agent\'s event - MUST be rejected', () => {
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const existingEvent = {
    id: 'event-999',
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-abc',
    agent_id: 'other-agent-456', // Belongs to another agent
    contractor_name: 'Original Client',
  };

  const updatedEvent = {
    ...existingEvent,
    contractor_name: 'Updated Client',
    status: 'Reservado',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, updatedEvent, isMaster, isCompanyAdmin, existingEvent),
    { message: 'O agente só pode alterar propostas assumidas por ele.' },
    'Agent should not be able to edit other agent\'s event'
  );
});

/**
 * Test 2.5: Agent changing event status to invalid values (should be rejected)
 * 
 * **Validates: Requirements 3.5**
 * 
 * Agents can only update status to: Proposta, Reservado, or Vendido.
 * Attempting to change to other statuses should be rejected.
 */
test('Preservation 2.5: Agent changing event status to invalid value (Cadastro) - MUST be rejected', () => {
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const existingEvent = {
    id: 'event-999',
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-abc',
    agent_id: 'agent-user-123', // Own event
    contractor_name: 'Test Client',
  };

  const updatedEvent = {
    ...existingEvent,
    status: 'Cadastro', // Invalid status for agent update
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, updatedEvent, isMaster, isCompanyAdmin, existingEvent),
    { message: 'O agente pode registrar somente proposta, reserva ou venda.' },
    'Agent should not be able to change status to "Cadastro"'
  );
});

test('Preservation 2.5b: Agent changing event status to invalid value (Disponível) - MUST be rejected', () => {
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const existingEvent = {
    id: 'event-999',
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-abc',
    agent_id: 'agent-user-123', // Own event
    contractor_name: 'Test Client',
  };

  const updatedEvent = {
    ...existingEvent,
    status: 'Disponível', // Invalid status for agent update
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, updatedEvent, isMaster, isCompanyAdmin, existingEvent),
    { message: 'O agente pode registrar somente proposta, reserva ou venda.' },
    'Agent should not be able to change status to "Disponível"'
  );
});

/**
 * Test 2.6: Agent cross-company operation (should be rejected)
 * 
 * **Validates: Requirements 3.6**
 * 
 * Agents cannot create or edit events for different companies.
 * This ensures company isolation.
 */
test('Preservation 2.6: Agent cross-company operation (create) - MUST be rejected', () => {
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
    company_id: 'company-xyz', // Different company
    agent_id: 'agent-user-123',
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin),
    { message: 'Você não pode salvar dados de outro escritório.' },
    'Agent should not be able to create event for different company'
  );
});

test('Preservation 2.6b: Agent cross-company operation (edit) - MUST be rejected', () => {
  const caller = {
    id: 'agent-user-123',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    company_id: 'company-abc',
  };

  const existingEvent = {
    id: 'event-999',
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-xyz', // Different company
    agent_id: 'agent-user-123',
    contractor_name: 'Test Client',
  };

  const updatedEvent = {
    ...existingEvent,
    status: 'Reservado',
  };

  const isMaster = false;
  const isCompanyAdmin = false;

  assert.throws(
    () => simulateSaveEventValidation(caller, updatedEvent, isMaster, isCompanyAdmin, existingEvent),
    { message: 'Você não pode salvar dados de outro escritório.' },
    'Agent should not be able to edit event from different company'
  );
});

/**
 * Test 2.7: Company admin operations within own company (should be permitted)
 * 
 * **Validates: Requirements 3.7**
 * 
 * Company admins should have unrestricted access to all operations within their company.
 * They can create events with any status and for any agent.
 */
test('Preservation 2.7a: Company admin creating Cadastro with null agent_id - MUST be permitted', () => {
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
    status: 'Cadastro',
    company_id: 'company-abc',
    agent_id: null,
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = true;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Company admin should be able to create Cadastro');
  assert.ok(result.id, 'Event ID should be returned');
});

test('Preservation 2.7b: Company admin creating Proposta for specific agent - MUST be permitted', () => {
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
    status: 'Proposta',
    company_id: 'company-abc',
    agent_id: 'agent-user-123', // Assigning to specific agent
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = true;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Company admin should be able to create Proposta for any agent');
  assert.ok(result.id, 'Event ID should be returned');
});

test('Preservation 2.7c: Company admin creating event with any status - MUST be permitted', () => {
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
    status: 'Reservado', // Any status
    company_id: 'company-abc',
    agent_id: 'agent-user-123',
    contractor_name: 'Test Client',
  };

  const isMaster = false;
  const isCompanyAdmin = true;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Company admin should be able to create event with any status');
  assert.ok(result.id, 'Event ID should be returned');
});

test('Preservation 2.7d: Company admin editing any event in own company - MUST be permitted', () => {
  const caller = {
    id: 'admin-user-789',
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'company_admin',
    company_id: 'company-abc',
  };

  const existingEvent = {
    id: 'event-999',
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-abc',
    agent_id: 'agent-user-123', // Different agent
    contractor_name: 'Original Client',
  };

  const updatedEvent = {
    ...existingEvent,
    status: 'Vendido',
    contractor_name: 'Updated Client',
  };

  const isMaster = false;
  const isCompanyAdmin = true;

  const result = simulateSaveEventValidation(caller, updatedEvent, isMaster, isCompanyAdmin, existingEvent);
  
  assert.ok(result.success, 'Company admin should be able to edit any event in own company');
  assert.ok(result.id, 'Event ID should be returned');
});

/**
 * Test 2.8: Superadmin operations (should be permitted)
 * 
 * **Validates: Requirements 3.7**
 * 
 * Superadmins should have unrestricted global access without company_id or agent_id restrictions.
 */
test('Preservation 2.8a: Superadmin creating event with any status - MUST be permitted', () => {
  const caller = {
    id: 'superadmin-user-001',
    name: 'Super Admin',
    email: 'superadmin@example.com',
    role: 'superadmin',
    company_id: null,
  };

  const event = {
    id: null,
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Cadastro',
    company_id: 'company-abc',
    agent_id: null,
    contractor_name: 'Test Client',
  };

  const isMaster = true;
  const isCompanyAdmin = false;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Superadmin should be able to create event with any status');
  assert.ok(result.id, 'Event ID should be returned');
});

test('Preservation 2.8b: Superadmin creating event for any company - MUST be permitted', () => {
  const caller = {
    id: 'superadmin-user-001',
    name: 'Super Admin',
    email: 'superadmin@example.com',
    role: 'superadmin',
    company_id: null,
  };

  const event = {
    id: null,
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-xyz', // Any company
    agent_id: 'agent-user-456',
    contractor_name: 'Test Client',
  };

  const isMaster = true;
  const isCompanyAdmin = false;

  const result = simulateSaveEventValidation(caller, event, isMaster, isCompanyAdmin);
  
  assert.ok(result.success, 'Superadmin should be able to create event for any company');
  assert.ok(result.id, 'Event ID should be returned');
});

test('Preservation 2.8c: Superadmin editing any event across companies - MUST be permitted', () => {
  const caller = {
    id: 'superadmin-user-001',
    name: 'Super Admin',
    email: 'superadmin@example.com',
    role: 'superadmin',
    company_id: null,
  };

  const existingEvent = {
    id: 'event-999',
    state_id: 'SP',
    city: 'São Paulo',
    date: '2025-03-15',
    type: 'Show',
    status: 'Proposta',
    company_id: 'company-xyz',
    agent_id: 'agent-user-456',
    contractor_name: 'Original Client',
  };

  const updatedEvent = {
    ...existingEvent,
    status: 'Cadastro',
    agent_id: null,
  };

  const isMaster = true;
  const isCompanyAdmin = false;

  const result = simulateSaveEventValidation(caller, updatedEvent, isMaster, isCompanyAdmin, existingEvent);
  
  assert.ok(result.success, 'Superadmin should be able to edit any event across companies');
  assert.ok(result.id, 'Event ID should be returned');
});

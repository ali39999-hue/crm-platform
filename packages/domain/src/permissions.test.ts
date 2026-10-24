import { describe, expect, it } from 'vitest';
import { getRolePermissionScope, isActionAllowed } from './permissions.js';

describe('permissions matrix and authorization rules', () => {
  it('allows SystemOwner to manage members and organization settings', () => {
    expect(isActionAllowed('SystemOwner', 'manage_members')).toBe(true);
    expect(isActionAllowed('SystemOwner', 'organization_settings')).toBe(true);
  });

  it('strictly forbids CustomerPortalUser from viewing internal tasks or notes', () => {
    expect(isActionAllowed('CustomerPortalUser', 'view_internal_tasks')).toBe(false);
    expect(isActionAllowed('CustomerPortalUser', 'view_ticket_internal_notes')).toBe(false);
    expect(getRolePermissionScope('CustomerPortalUser', 'view_internal_tasks')).toBe('no');
  });

  it('allows Employee to view and edit tasks within own or permitted scope', () => {
    expect(isActionAllowed('Employee', 'create_or_edit_tasks')).toBe(true);
    expect(getRolePermissionScope('Employee', 'create_or_edit_tasks')).toBe('own_or_permitted');
    expect(isActionAllowed('Employee', 'view_ticket_internal_notes')).toBe(false);
  });

  it('auditor has read_scope and cannot edit tasks', () => {
    expect(isActionAllowed('Auditor', 'create_or_edit_tasks')).toBe(false);
    expect(getRolePermissionScope('Auditor', 'view_audit')).toBe('read_scope');
  });
});

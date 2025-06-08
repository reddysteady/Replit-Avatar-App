import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../storage', () => ({
  storage: {
    getSettings: vi.fn().mockResolvedValue({ airtableToken: 'token' })
  }
}))

import { AirtableService } from './airtable'
const service = new AirtableService()

describe('AirtableService', () => {
  const lead = {
    name: 'Bob',
    message: 'hi',
    source: 'ig',
    contactInfo: 'bob@test.com',
    intentCategory: 'general',
    baseId: 'base',
    tableName: 'tbl'
  }

  it('addLead returns record id', async () => {
    const id = await service.addLead(lead)
    expect(id).toMatch(/^rec/)
  })

  it('updateLead returns success', async () => {
    const res = await service.updateLead('rec1', 'base', 'tbl', { a: 1 })
    expect(res).toEqual({ success: true, message: 'Lead updated in Airtable' })
  })

  it('getLeads returns array', async () => {
    const res = await service.getLeads('base', 'tbl')
    expect(res).toEqual([])
  })

  it('validateCredentials returns success', async () => {
    const res = await service.validateCredentials('token', 'base', 'tbl')
    expect(res).toEqual({ success: true, message: 'Airtable credentials are valid' })
  })
})

import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PrivacyPersonalityForm from './PrivacyPersonalityForm'

describe('PrivacyPersonalityForm', () => {
  it('renders save button', () => {
    const html = renderToStaticMarkup(
      <PrivacyPersonalityForm onSave={() => {}} />,
    )
    expect(html).toContain('Save Preferences')
  })

  it('shows empty fields when initialConfig is null', () => {
    const html = renderToStaticMarkup(
      <PrivacyPersonalityForm onSave={() => {}} initialConfig={null} />,
    )
    expect(html).toContain('textarea')
    expect(html).toContain('value=""')
  })
})

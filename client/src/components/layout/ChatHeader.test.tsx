import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ChatHeader from './ChatHeader';

const sampleProps = { name: 'Liz Cell', avatarUrl: '/liz.jpg' };

describe('ChatHeader', () => {
  it('renders the user name and avatar', () => {
    const html = renderToStaticMarkup(
      <ChatHeader {...sampleProps} />
    );
    expect(html).toContain('Liz Cell');
    expect(html).toContain('/liz.jpg');
  });

  it('includes the back arrow icon', () => {
    const html = renderToStaticMarkup(
      <ChatHeader {...sampleProps} />
    );
    expect(html.includes('svg')).toBe(true);
  });
});

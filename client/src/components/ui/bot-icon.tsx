// See CHANGELOG.md for 2025-06-15 [Added]
import React from 'react';
import { Bot } from 'lucide-react';

export const BotIcon: React.FC<React.ComponentPropsWithoutRef<typeof Bot>> = (props) => (
  <Bot {...props} />
);

export default BotIcon;

// See CHANGELOG.md for 2025-06-12 [Fixed]
import React from 'react';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from '@/components/ui/menubar';
import { useGenerateBatch } from '@/hooks/useGenerateBatch';

export default function ToolsMenu() {
  const { mutate: generateBatch, isPending: isLoading } = useGenerateBatch();

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Tools</MenubarTrigger>
        <MenubarContent align="end">
          <MenubarItem onSelect={() => generateBatch()} disabled={isLoading}>
            Generate Batch Messages
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

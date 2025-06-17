
# Desktop Burger Menu Implementation

## Overview
Transform the desktop sidebar navigation to use a burger menu approach similar to mobile, but with a simplified Thread Actions-only interface when viewing conversations.

## Current State
- Desktop uses a persistent sidebar (`client/src/components/layout/Sidebar.tsx`) with full navigation
- Mobile uses a burger menu (`client/src/components/layout/MobileHeader.tsx`) with collapsible navigation
- Thread Actions are currently only available in mobile burger menu

## Target Implementation

### Desktop Behavior Changes
1. **Replace persistent sidebar** with a burger menu button in the top-left corner
2. **Thread Actions only** - When on conversation pages (`/`, `/instagram`, `/youtube`), the burger menu should only show:
   - Generate Custom Message (with text input and Generate button)
   - Generate Batch Messages functionality
3. **No navigation menu** - Remove all other navigation items (Conversations, Insights, Settings, etc.) from the desktop burger menu
4. **Clean header** - Maintain clean top bar with just burger menu and conversation info

### Files to Modify

#### 1. `client/src/App.tsx`
- Remove desktop sidebar rendering logic
- Add burger menu for desktop similar to mobile implementation
- Ensure conversation data flows to desktop header component

#### 2. `client/src/components/layout/Sidebar.tsx`
- Remove or deprecate this component entirely
- All navigation will be handled through direct URL access

#### 3. Create `client/src/components/layout/DesktopHeader.tsx`
- New component similar to `MobileHeader.tsx`
- Burger menu with Thread Actions section only
- No navigation menu items
- Clean, minimal design matching mobile patterns

#### 4. Remove deprecated functionality
- Remove "Reload database", "Reload - frontend cache", and "Setup webhook" options
- These are already available in Settings > Testing Tools

### UI/UX Specifications

#### Header Layout
```
[🍔 Burger] [Conversation Info: Avatar + Name + Platform] [...]
```

#### Burger Menu Contents (Conversations pages only)
```
Thread Actions
├── Generate Custom Message
│   ├── [Text Input Field]
│   └── [Generate Button]
└── Generate Batch Messages
    └── [Batch Generate Button]
```

#### Non-conversation pages
- Burger menu should be minimal or hidden
- Users navigate via direct URLs or browser back/forward

### Implementation Strategy

1. **Phase 1**: Create DesktopHeader component
   - Copy MobileHeader structure
   - Strip out navigation items
   - Keep only Thread Actions section
   - Ensure proper conversation data handling

2. **Phase 2**: Update App.tsx layout
   - Remove Sidebar component usage
   - Add DesktopHeader for desktop
   - Maintain MobileHeader for mobile
   - Ensure responsive behavior

3. **Phase 3**: Clean up
   - Remove unused Sidebar component
   - Remove deprecated testing options
   - Update any references or imports

### Technical Considerations

- **Responsive breakpoints**: Use existing `useIsMobile()` hook logic
- **State management**: Thread Actions need access to active thread ID
- **Query invalidation**: Maintain existing React Query cache invalidation
- **Accessibility**: Ensure burger menu is keyboard accessible
- **Styling**: Match existing Tailwind/shadcn patterns

### Testing Requirements

- Test Thread Actions work on desktop burger menu
- Verify conversation data flows correctly
- Ensure responsive behavior at breakpoint transitions
- Test keyboard navigation and accessibility
- Verify no navigation menu items appear on desktop

## Prompt for Codex Agent

**Task**: Implement desktop burger menu with Thread Actions only

**Context**: The desktop currently uses a persistent sidebar for navigation. We want to replace this with a burger menu that only shows Thread Actions (Generate Custom Message, Generate Batch Messages) when viewing conversations, similar to the mobile implementation but simplified.

**Requirements**:
1. Create `client/src/components/layout/DesktopHeader.tsx` based on `MobileHeader.tsx`
2. Strip out all navigation menu items (Conversations, Insights, Settings, etc.)
3. Keep only Thread Actions section with Generate Custom Message and Generate Batch Messages
4. Update `client/src/App.tsx` to use DesktopHeader instead of Sidebar for desktop
5. Remove deprecated testing options (Reload database, Reload frontend cache, Setup webhook)
6. Ensure proper conversation data flow and thread ID detection
7. Maintain responsive behavior using existing `useIsMobile()` hook

**Files to modify**:
- `client/src/App.tsx` - Replace Sidebar with DesktopHeader
- Create `client/src/components/layout/DesktopHeader.tsx` - New component
- `client/src/components/layout/Sidebar.tsx` - Remove/deprecate

**Success criteria**:
- Desktop shows burger menu in top-right corner
- Generate Custom Message works correctly
- Generate Batch Messages works correctly  
- On desktop, no navigation menu items visible (as these are already in left hand side bar menu)
- Responsive behavior maintained
- Clean, minimal design matching mobile patterns

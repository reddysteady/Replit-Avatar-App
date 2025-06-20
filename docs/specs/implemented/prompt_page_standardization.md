
# Page Standardization Implementation Guide

## Implementation Approach
Refer to /docs/specs/prompt_page_standardization.md

### 1. Create Reusable Component
Create a `PageHeader` component that can be used across all pages to ensure consistency.

### 2. Component Props Interface
```tsx
interface PageHeaderProps {
  title: string
  description: string
  children?: React.ReactNode // For page-specific actions/buttons
}
```

### 3. Update Pages in Priority Order

#### Phase 1: Main Pages
- `ThreadedMessages.tsx` - Update existing header section
- Ensure mobile/desktop consistency

#### Phase 2: Settings Pages  
- `AISettingsPage.tsx`
- `AvatarSettingsPage.tsx`
- `ContentSourcesPage.tsx`
- `AutomationPage.tsx`
- `NotificationSettings.tsx`
- `APIKeysPage.tsx`

#### Phase 3: Utility Pages
- `Testing.tsx`
- `Privacy.tsx`
- `Analytics.tsx`

### 4. Mobile Header Integration
Ensure the new PageHeader component works seamlessly with:
- `MobileHeader.tsx` - Mobile navigation
- `DesktopHeader.tsx` - Desktop burger menu
- Existing responsive breakpoints

### 5. Testing Checklist
- [ ] Headers display correctly on desktop (>768px)
- [ ] Headers display correctly on mobile (<768px)
- [ ] Text is readable and properly sized
- [ ] Spacing is consistent across pages
- [ ] No layout shifts or overlapping content
- [ ] Descriptions are helpful and accurate

## Code Standards
- Use existing Tailwind classes for consistency
- Follow existing component patterns
- Maintain responsive design principles
- Ensure accessibility standards are met

## Files to Modify
1. Create new component: `client/src/components/PageHeader.tsx`
2. Update pages in priority order as listed above
3. Test each page after implementation
4. Update any existing header components that conflict

This approach ensures a systematic rollout with minimal disruption to existing functionality while achieving consistent user experience across all pages.

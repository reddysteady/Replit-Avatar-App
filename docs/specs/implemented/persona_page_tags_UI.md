
# Codex Agent Prompt Scaffold

## 1. Context & Background

The current Persona page (PrivacyPersonalityForm.tsx) uses scattered checkboxes for Style Tags, Allowed Topics, and Restricted Topics selection. Users have reported issues with:
- Style Tags, Allowed Topics, and Restricted Topics not saving properly
- UI not updating to reflect saved state consistently
- Poor visual feedback for selected vs unselected items
- Difficulty managing larger lists of topics
- No clear visual hierarchy between different topic categories

The current implementation uses basic checkbox grids which create cognitive load and don't scale well. We need to implement a more intuitive chip-based interface with better visual feedback and bulk operations.

## 2. Objective & Scope

Transform the Persona page UI to use modern token chip interfaces and categorization systems that provide:
- Better visual feedback for selection states
- Easier bulk topic management
- Reduced user errors and cognitive load
- Improved scalability for larger topic lists

**In-scope:**
- PrivacyPersonalityForm.tsx component redesign
- Style Tags → Interactive badge chips with presets + custom input
- Topics → Categorization interface (Allowed/Restricted/Neutral states)
- Enhanced visual feedback and micro-interactions
- Form state management improvements
- Save/persistence issue resolution

**Out-of-scope:**
- Backend API changes to persona endpoints
- Database schema modifications
- Authentication or authorization logic
- Other settings pages or components

## 3. Requirements & Steps

### Step 1: Implement Style Tags as Token Chips
- Replace checkbox grid with interactive Badge components from ShadCN
- Use `variant="default"` for selected chips (filled with accent color)
- Use `variant="outline"` for unselected chips
- Add hover states with subtle shadow and cursor pointer
- Include "×" removal on hover for selected chips
- Add custom input field that converts entries to chips on Enter
- Maintain existing preset tags: "Friendly", "Professional", "Sarcastic", "Humorous"
- Add instructions for users to use the interface

### Step 2: Implement Topic Categorization Interface
- Replace separate "Allowed" and "Restricted" checkbox lists
- Create single topic management interface with three states:
  - **Neutral** (default): Grey outlined chips
  - **Allowed**: Green accent border chips  
  - **Restricted**: Red accent border chips
- Topics cycle through states on click: neutral → allowed → restricted → neutral
- Maintain existing preset topics for both categories
- Add bulk selection capabilities
- Include visual indicators for each state with color coding
- Add instructions for users to use the interface

### Step 3: Enhanced Input and Bulk Operations
- Add type-ahead input field with topic suggestions
- Support comma-separated paste for bulk topic addition
- Include "Add topics" input that creates chips in neutral state by default
- Add clear visual hierarchy with proper spacing and typography
- Implement smart suggestions based on common topics

### Step 4: Fix Save/Update Issues
- Ensure form state properly syncs with server responses
- Add loading states during save operations
- Implement proper error handling with user feedback
- Validate that UI updates immediately reflect saved state
- Add success/error toast notifications

### Step 5: Improve Visual Design
- Use consistent electric-blue accent (#3A8DFF) for selected states
- Implement proper hover and focus states per brand guidelines
- Add smooth transitions for state changes
- Ensure mobile-responsive design
- Maintain greyscale + accent color scheme consistency

## 4. Testing & Validation

### Unit Tests
- Add tests for chip selection/deselection logic
- Test custom tag input functionality
- Validate topic state cycling (neutral → allowed → restricted)
- Test bulk paste operations
- Verify form validation rules

### Integration Tests
- Test save/load persona configuration flow
- Verify UI state updates after successful save
- Test error handling scenarios
- Validate form reset functionality

### User Acceptance Testing
- Verify intuitive chip selection behavior
- Test bulk topic management workflows
- Confirm mobile responsiveness
- Validate accessibility (keyboard navigation, screen readers)

### Test Cases
- Save persona with mix of preset and custom style tags
- Add topics via bulk paste, verify categorization
- Test form persistence across page refreshes
- Verify error states display properly
- Test fallback response selection with custom input

## 5. Code Quality & Documentation

### Formatting and Linting
- Follow existing Prettier configuration
- Maintain TypeScript strict mode compliance
- Use consistent naming conventions with existing codebase
- Follow ShadCN component patterns and props

### Required Comments
- Document chip state management logic
- Explain topic categorization flow
- Add JSDoc for new component interfaces
- Comment complex form validation rules

### File Updates
- Update component file header comments
- Add changelog entries for UI improvements
- Document new props and interfaces in TypeScript

## 6. Commit & Changelog Guidelines

### Commit Message Format
```
feat(persona): implement chip-based UI for style tags and topics

- Replace checkbox grids with interactive badge chips
- Add topic categorization with neutral/allowed/restricted states
- Implement bulk topic management and paste operations
- Fix save/update state synchronization issues
- Improve mobile responsiveness and accessibility
```

### Changelog Entry
```markdown
## [Date] - 
- [Codex][Changed] Style Tags now use interactive badge chips instead of checkboxes
- [Codex][Changed] Topics use categorization interface with visual state indicators
- [Codex][Changed] Improved bulk topic management with paste support
- [Codex][Changed] Enhanced mobile responsiveness and visual hierarchy
- [Codex][Fixed] Style Tags, Allowed Topics, and Restricted Topics saving consistently
- [Codex][Fixed] UI now properly updates to reflect saved persona state
- [Codex][Fixed] Form validation provides better user feedback
```

## 7. Acceptance Criteria

- [ ] Style Tags display as interactive badge chips with proper selected/unselected states
- [ ] Custom style tag input creates new chips on Enter keypress
- [ ] Topics show three distinct visual states (neutral/allowed/restricted)
- [ ] Topics cycle through states on click with smooth transitions
- [ ] Bulk topic paste creates multiple chips in neutral state
- [ ] Form saves successfully and UI immediately reflects saved state
- [ ] Loading states and error handling provide clear user feedback
- [ ] Mobile interface is fully responsive and touch-friendly
- [ ] Keyboard navigation works for all interactive elements
- [ ] Success/error toasts display for save operations
- [ ] Form validation prevents submission of invalid configurations
- [ ] All existing functionality preserved (fallback responses, tone description)

## 8. Reference Docs

- [Stage 1 Persona Spec](docs/stage_1_persona.md)
- [ShadCN Badge Component](https://ui.shadcn.com/docs/components/badge)
- [Current PrivacyPersonalityForm](client/src/components/PrivacyPersonalityForm.tsx)
- [AvatarPersonaConfig Interface](client/src/types/AvatarPersonaConfig.ts)
- [Redesign Concept](attached_assets/Pasted-Here-s-a-quick-redesign-concept...)
- [Brand Guidelines](docs/styleguide.md)

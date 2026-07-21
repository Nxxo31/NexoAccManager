# NX-Manager - Compact & Dense Mockup

## Stance Description
This mockup represents a **compact and dense** design approach focused on maximum information density for power users. Key characteristics:

- **Ultra-compact layout**: Minimal padding and tight spacing
- **Information-dense**: Maximum account information visible in minimal space
- **Tool-first aesthetic**: Emphasis on quick access to actions
- **Dark theme dominant**: Designed primarily for dark mode use
- **Power user focused**: Assumes users know keyboard shortcuts and prefer efficiency over guidance

## Design Decisions

### Toolbar
- Reduced to absolute minimum: only settings (⚙️) and theme toggle (🌙☀️)
- Account-related controls moved to the slicer as per requirements
- Compact height (h-12) to maximize vertical space

### Left Slicer (Accounts)
- **Search bar**: Compact input with clear button
- **Add Account button**: Direct action (no modal) with + icon
- **Show/Hide toggle**: Clean switch for filtering visibility
- **Account list**: 
  - Ultra-compact rows with minimal vertical padding
  - Avatar placeholder with account type indicator (RBX)
  - Account name and description in compact format
  - Inline group editing via badges (simulated)
  - Visual drag handles implied via cursor-grab styling
  - Maximum information density: shows multiple group badges per account

### Main Content Area
- Compact header with section title
- Main content area ready for account details
- Placeholder for detailed view when account is selected

## Technical Implementation Notes
- Uses Tailwind CSS via CDN for rapid prototyping
- Custom CSS variables for theme management (light/dark)
- Font Awesome 6 for consistent icons
- Basic JavaScript for theme persistence and drag simulation
- All interactive elements have hover states
- Responsive design that maintains density even on smaller screens

## Intended User Experience
Targeted at experienced Roblox account managers who:
- Manage many accounts (approaching the 50 account limit)
- Prefer keyboard-driven workflows
- Value seeing maximum information at a glance
- Are familiar with power-user interfaces
- Don't need explanatory UI elements

This stance prioritizes information density and efficiency over guided experiences or visual breathing room.
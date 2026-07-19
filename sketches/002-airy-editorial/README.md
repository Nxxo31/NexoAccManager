# NX-Manager - Airy & Editorial Mockup

## Design Stance: Airy & Editorial

This mockup explores a spacious, editorial-inspired approach to the NX-Manager interface, focusing on:

- **Generous whitespace** and breathing room between elements
- **Typography hierarchy** with clear visual hierarchy
- **Card-based design** with subtle elevations and hover states
- **Editorial feel** inspired by modern web magazines and dashboards
- **Visual hierarchy** that guides the eye naturally through the interface
- **Balanced dark/light theme** with thoughtful contrast

## Key Design Decisions

### Toolbar
- Reduced to essential buttons only (theme toggle + settings gear)
- Clean typography for app title ("NX-Manager")
- Ample padding and breathing room
- Subtle hover effects on buttons

### Left Slicer (Accounts)
- **Search**: Prominent input with icon and clear placeholder
- **Add Account**: Floating action button style with primary color accent
- **Toggle**: Custom styled switch for show/hide hidden accounts
- **Account Cards**: 
  - Card-based layout with elevation and hover effects
  - Avatar/icon placeholder with account type indicator
  - Account name with clear typography hierarchy
  - Group tags as subtle badges
  - Description text with line clamping
  - Status indicators (online/offline/away) with colored dots
  - Last seen timestamps

### Main Content Area
- Clear header with section title
- Welcome state with illustrative icon and descriptive text
- Account details preview (shown when account selected):
  - Two-column layout on larger screens
  - Profile information section
  - Security section
  - Current presence/game activity
  - Active friends list with status indicators

## Visual Characteristics

- **Typography**: Clear hierarchy with Inter font (system fallback)
- **Color Usage**: 
  - Primary: Roblox Red (#DE350D) for key actions and highlights
  - Accent: Nexo Purple (#6347FF) for secondary actions and highlights
  - Neutrals: Carefully balanced dark/light theme colors
- **Spacing**: Generous padding and margins throughout
- **Elevation**: Subtle shadows and hover lifts on interactive elements
- **Border Treatment**: Soft borders with transparency for depth
- **Interactivity**: Clear hover states, focus indicators, and feedback

## Target User Experience

This stance is designed for users who:
- Prefer a calm, uncluttered interface
- Value visual clarity and hierarchy over maximum density
- Appreciate thoughtful typography and spacing
- Work with moderate numbers of accounts (10-30)
- Enjoy modern, aesthetically pleasing interfaces
- Don't require maximum information density

The airy/editorial approach reduces cognitive load through whitespace and clear visual grouping, making it easier to focus on individual accounts and their details.

## Implementation Notes

- Uses Tailwind CSS via CDN for rapid prototyping
- Interactive elements simulate basic functionality (account selection, theme toggle)
- Responsive design principles applied
- Accessibility considerations (color contrast, focus states)
- Realistic Roblox account names and details for authenticity
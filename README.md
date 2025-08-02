# Leetest Code - Chrome Extension

A modern Chrome extension built with **Vite**, **React**, and **TypeScript**.

## 🚀 Features

- **Modern Tech Stack**: Built with Vite + React + TypeScript
- **Popup Interface**: Clean, responsive popup UI with dark/light theme support
- **Content Script**: Interacts with web pages
- **Background Service Worker**: Handles extension lifecycle and messaging
- **Storage API**: Persistent settings storage
- **Message Passing**: Communication between popup, content, and background scripts

## 🏗️ Project Structure

```
leetest-code/
├── src/
│   ├── background/           # Background service worker
│   │   └── background.ts
│   ├── content/             # Content scripts
│   │   └── content.ts
│   ├── App.tsx              # Main popup component
│   ├── App.css              # Styles for popup
│   └── main.tsx             # Entry point
├── public/
│   └── manifest.json        # Chrome extension manifest
├── dist/                    # Built extension files
└── vite.config.ts          # Vite configuration
```

## 🛠️ Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leetest-code
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:watch` - Build with watch mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📦 Installation

### Method 1: Load Unpacked Extension (Development)

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `dist` folder from your project

4. **Test the extension**
   - The extension icon should appear in your toolbar
   - Click it to open the popup interface

### Method 2: Package as .crx (Production)

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Package the extension**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select the `dist` folder as the extension root directory
   - Click "Pack Extension"

## 🎯 Extension Components

### Popup (React App)
- **Location**: `src/App.tsx`
- **Purpose**: Main user interface when clicking the extension icon
- **Features**:
  - Toggle extension on/off
  - View current page information
  - Theme switcher (light/dark)
  - Notification settings

### Content Script
- **Location**: `src/content/content.ts`
- **Purpose**: Runs on web pages to interact with page content
- **Features**:
  - Shows notification when extension is active
  - Listens for messages from popup/background
  - Can extract page data

### Background Script
- **Location**: `src/background/background.ts`
- **Purpose**: Service worker that handles extension lifecycle
- **Features**:
  - Manages extension settings
  - Handles message passing between components
  - Responds to tab updates and extension events

## 🔧 Configuration

### Manifest V3
The extension uses Manifest V3 with the following permissions:
- `activeTab` - Access to the current active tab
- `storage` - Persistent storage for settings

### Vite Configuration
- Configured for multi-entry build (popup, content, background)
- TypeScript support out of the box
- React Fast Refresh for development

## 🎨 Customization

### Styling
- Main styles in `src/App.css`
- Supports light and dark themes
- Responsive design for popup interface

### Adding New Features

1. **Content Script Features**:
   - Edit `src/content/content.ts`
   - Add new message handlers
   - Interact with page DOM

2. **Popup Features**:
   - Edit `src/App.tsx`
   - Add new React components
   - Update state management

3. **Background Features**:
   - Edit `src/background/background.ts`
   - Add new message handlers
   - Implement storage logic

## 🔍 Debugging

### Chrome DevTools
- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: F12 on any webpage → Console tab
- **Background**: `chrome://extensions/` → Click "service worker" link

### Console Logs
All components include console logging for debugging:
- Extension activation messages
- Message passing between components
- Settings changes and storage updates

## 🆘 Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Ensure you've built the project (`npm run build`)
   - Check that all files are in the `dist` folder
   - Verify manifest.json is valid

2. **TypeScript errors**:
   - Run `npm run lint` to check for issues
   - Ensure @types/chrome is installed

3. **Build errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check that all dependencies are installed

### Development Tips

- Use `npm run build:watch` for automatic rebuilds during development
- Check the Chrome Extensions page for error messages
- Use Chrome DevTools for debugging each component separately
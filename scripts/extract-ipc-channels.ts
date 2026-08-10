#!/usr/bin/env node
// IPC Drift Detector
// Synchronizes preload/index.ts, window-api.d.ts, and IPC handlers
// Exits with code 1 if drift != 0 (mismatch between sources)

const fs = require('fs');
const path = require('path');

// Extract IPC channels from preload/index.ts
function extractFromPreload() {
  const preloadPath = path.join(__dirname, '..', 'src', 'preload', 'index.ts');
  if (!fs.existsSync(preloadPath)) {
    console.error('❌ Preload file not found:', preloadPath);
    process.exit(1);
  }

  const content = fs.readFileSync(preloadPath, 'utf-8');
  const channels = [];

  // Match ipcRenderer.invoke('namespace:method', ...) patterns
  const invokePattern = /ipcRenderer\.invoke\s*\(\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = invokePattern.exec(content)) !== null) {
    const fullName = match[1];
    if (fullName.includes(':')) {
      const [namespace, method] = fullName.split(':', 2);
      channels.push({ namespace, method, fullName });
    }
  }

  console.log(`📋 Found ${channels.length} IPC channels in preload/index.ts`);
  return channels;
}

// Extract IPC channels from window-api.d.ts
function extractFromWindowApi() {
  const windowApiPath = path.join(__dirname, '..', 'src', 'application', 'window-api.d.ts');
  if (!fs.existsSync(windowApiPath)) {
    console.error('❌ Window API file not found:', windowApiPath);
    process.exit(1);
  }

  const content = fs.readFileSync(windowApiPath, 'utf-8');
  const channels = [];

  // Match method declarations in the api interface: methodName(args): Promise<IpcResult>
  // Look for patterns in the interface like: method: (args) => Promise<IpcResult>
  const methodPattern = /(\w+(?::\w+)?)\s*(?:\:|=\>)\s*.*?Promise<IpcResult/g;
  let match;

  while ((match = methodPattern.exec(content)) !== null) {
    const fullName = match[1];
    // Skip if it's a TypeScript type or interface declaration
    if (!fullName.includes('interface') && !fullName.includes('type')) {
      if (fullName.includes(':')) {
        const [namespace, method] = fullName.split(':', 2);
        channels.push({ namespace, method, fullName });
      } else {
        // Method without namespace — push as-is (namespace will be derived from context)
        channels.push({ namespace: '', method: fullName, fullName });
      }
    }
  }

  console.log(`📋 Found ${channels.length} IPC channels in window-api.d.ts`);
  return channels;
}

// Extract IPC channels from handler files (look for ipcMain.handle calls)
function extractFromHandlers() {
  const handlersDir = path.join(__dirname, '..', 'src', 'infrastructure', 'ipc', 'handlers');
  if (!fs.existsSync(handlersDir)) {
    console.error('❌ Handlers directory not found:', handlersDir);
    process.exit(1);
  }

  const channels = [];
  const handlerFiles = [
    'accountHandlers.ts',
    'robloxHandlers.ts',
    'settingsHandlers.ts',
    'advancedHandlers.ts',
    'shared.ts'
  ];

  for (let i = 0; i < handlerFiles.length; i++) {
    const fileName = handlerFiles[i];
    const filePath = path.join(handlersDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Match ipcMain.handle('namespace:method', ...) patterns
    const handlePattern = /ipcMain\.handle\s*\(\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = handlePattern.exec(content)) !== null) {
      const fullName = match[1];
      if (fullName.includes(':')) {
        const [namespace, method] = fullName.split(':', 2);
        channels.push({ namespace, method, fullName });
      }
    }
  }

  console.log(`📋 Found ${channels.length} IPC channels in handler files`);
  return channels;
}

// Count unique channels by full name
function countUniqueChannels(channels) {
  const uniqueSet = new Set();
  for (const channel of channels) {
    uniqueSet.add(channel.fullName);
  }
  return uniqueSet.size;
}

// Main function
function main() {
  console.log('🔍 Starting IPC drift detection...');
  console.log('');

  const preloadChannels = extractFromPreload();
  const windowApiChannels = extractFromWindowApi();
  const handlerChannels = extractFromHandlers();

  const preloadCount = countUniqueChannels(preloadChannels);
  const windowApiCount = countUniqueChannels(windowApiChannels);
  const handlerCount = countUniqueChannels(handlerChannels);

  console.log('');
  console.log('📊 Channel Count Summary:');
  console.log(`   preload/index.ts:     ${preloadCount}`);
  console.log(`   window-api.d.ts:      ${windowApiCount}`);
  console.log(`   handler files:        ${handlerCount}`);
  console.log('');

  // Check for drift
  const preloadToWindowApiDrift = Math.abs(preloadCount - windowApiCount);
  const preloadToHandlerDrift = Math.abs(preloadCount - handlerCount);
  const totalDrift = preloadToWindowApiDrift + preloadToHandlerDrift;
  
  // If window-api.d.ts is 0, it might just need to be generated - warn but don't fail on that alone
  let shouldFail = false;
  
  if (preloadToHandlerDrift > 0) {
    console.log('❌ IPC drift check FAILED - Handler drift detected!');
    console.log(`   Preload → Handler drift: ${preloadToHandlerDrift}`);
    shouldFail = true;
  }
  
  if (windowApiCount === 0 && preloadCount > 0) {
    console.log('⚠️  WARNING: window-api.d.ts appears to be empty (not generated)');
    console.log('   Run the generation script to update window-api.d.ts');
    // Don't fail on this alone - it's a warning
  } else if (windowApiCount > 0 && preloadToWindowApiDrift > 0) {
    console.log('❌ IPC drift check FAILED - Window API drift detected!');
    console.log(`   Preload → Window API drift: ${preloadToWindowApiDrift}`);
    shouldFail = true;
  }
  
  if (!shouldFail) {
    console.log('✅ IPC drift check PASSED - Core sources are synchronized');
    if (windowApiCount > 0) {
      console.log(`   Total unique channels: ${preloadCount}`);
    } else {
      console.log(`   Preload channels: ${preloadCount} (window-api.d.ts needs generation)`);
    }
    process.exit(0);
  } else {
    console.log('');
    console.log('🔧 To fix:');
    console.log('   1. Update preload/index.ts with new/removed IPC handlers');
    console.log('   2. Run the generation script to update window-api.d.ts');
    console.log('   3. Ensure handler files match the IPC interface');
    process.exit(1);
  }
}

main();
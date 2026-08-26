#!/usr/bin/env node
// IPC Drift Detector
// Synchronizes preload/index.ts, window-api.d.ts, and IPC handlers
// Exits with code 1 if drift != 0 (mismatch between sources)

import * as fs from 'fs';
import * as path from 'path';

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

  // Find the api interface content
  const apiStart = content.indexOf('api: {');
  if (apiStart === -1) {
    console.error('❌ Could not find api interface in window-api.d.ts');
    process.exit(1);
  }

  // Find the matching closing brace for api: {
  let braceCount = 0;
  let apiEnd = apiStart;
  for (let i = apiStart; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    else if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        apiEnd = i;
        break;
      }
    }
  }

  const apiContent = content.substring(apiStart, apiEnd + 1);
  
  // Parse the nested structure to extract full namespaced channel names
  const lines = apiContent.split('\n');
  const namespaceStack: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Count opening/closing braces to track nesting
    const closeBraces = (line.match(/\}/g) || []).length;
    
    // Check for method declarations: "methodName: (...) => Promise<IpcResult>"
    const methodMatch = trimmed.match(/^([\w-]+)\s*:\s*\(.*?\)\s*=>\s*.*?Promise<IpcResult/);
    
    if (methodMatch) {
      const methodName = methodMatch[1];
      // Build full namespaced name
      const fullName = [...namespaceStack, methodName].join(':');
      channels.push({ namespace: namespaceStack.join(':'), method: methodName, fullName });
    }
    
    // Check for namespace declarations: "namespaceName: {"
    // But skip if it's a method that returns an object (like controlSubscribe)
    const namespaceMatch = trimmed.match(/^([\w-]+)\s*:\s*\{/);
    if (namespaceMatch && !trimmed.includes('=>')) {
      const namespaceName = namespaceMatch[1];
      namespaceStack.push(namespaceName);
    }
    
    // Pop namespaces for closing braces
    for (let i = 0; i < closeBraces; i++) {
      if (namespaceStack.length > 0) {
        namespaceStack.pop();
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
interface ChannelEntry {
  namespace: string;
  method: string;
  fullName: string;
}

function countUniqueChannels(channels: ChannelEntry[]): number {
  const uniqueSet = new Set<string>();
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
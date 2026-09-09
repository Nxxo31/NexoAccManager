/**
 * Custom Windows signing hook for electron-builder.
 * 
 * Mitigates Windows Defender false positives (Wacatac/Bulta trojan family)
 * by NOT signing elevate.exe — the unsigned NSIS bootstrap binary that
 * triggers heuristic detection in NSIS installers.
 * 
 * Reference: https://github.com/electron-userland/electron-builder/issues/6474
 * 
 * When a code signing certificate IS available, this hook signs everything
 * EXCEPT elevate.exe. When no certificate is present (dev builds), it's a no-op.
 */

const { doSign } = require('app-builder-lib/out/codeSign/windowsCodeSign')

/** @type {import("electron-builder").CustomWindowsSign} */
module.exports = async function sign(config, packager) {
  // No certificate — skip signing entirely
  if (!config.cscInfo) {
    return
  }

  // Skip signing elevate.exe — this is the binary that triggers
  // Trojan:Win32/Wacatac.b!ml false positive in Windows Defender
  const targetPath = config.path
  if (targetPath.endsWith('elevate.exe')) {
    return
  }

  return doSign(config, packager)
}

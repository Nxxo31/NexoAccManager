# Roblox Lua Executor Research Report

## Executive Summary

Roblox Lua script executors are sophisticated tools that inject and execute custom Lua/Luau code within the Roblox client process. As of 2025-2026, the executor landscape has been transformed by Roblox's Hyperion/Byfron anti-cheat system, which requires continuous engineering effort to maintain functionality. Building a Lua executor for an Electron-based desktop app like NexoAccManager would require a native C++ core with DLL injection capabilities, Luau VM integration, and careful consideration of significant legal risks including ToS violations, potential DMCA issues, and account bans. The most viable approach would be a paid subscription model, consistent with current market leaders, though development requires ongoing reverse engineering efforts to counter monthly Hyperion updates.

## 1. Technical Architecture of Roblox Executors

Roblox executors operate by injecting native code into the Roblox client process and interfacing directly with the Luau VM. Based on analysis of open-source projects like Polycheat and RbxStu, executors typically use:

- **Native DLL Injection**: Executors inject a custom DLL into the Roblox process using Windows API techniques like CreateRemoteThread, LoadLibrary, or manual mapping to bypass basic detection [Source: C5Hackr/Polycheat readme, SecondNewtonLaw/RbxStu-V2 LuauManager.cpp, XenoExecutor] {confidence: confirmed}
- **Direct VM Interaction**: Rather than emulating Luau externally, modern executors hook into the actual Luau VM structures, accessing lua_State, global_State, Proto, Closure, and internal execution functions like lua_resume [Source: Polycheat readme, RbxStu LuauManager.cpp] {confidence: confirmed}
- **Bytecode Handling**: Executors can dump live Luau bytecode from memory, disassemble it using tools like Unluau, and execute it directly within the game's runtime [Source: Polycheat readme, RbxStu LuauManager.cpp] {confidence: confirmed}
- **Thread Scheduling**: Executors schedule native threads within the game runtime to execute Lua code, often hooking luaE_newthread or similar functions [Source: Polycheat readme] {confidence: confirmed}
- **Custom Function Bridging**: Executors expose custom native functions (like HttpSpy, getrealaddress) into the Lua environment while maintaining access to existing game globals [Source: XenoExecutor, TaaprWareV2] {confidence: confirmed}

The core technical challenge is that Hyperion actively monitors for foreign DLLs, memory modifications, and suspicious syscall patterns, requiring executors to use advanced evasion techniques like memory-only injection, syscall hooking, or kernel-level approaches [Source: Delta Executor Byfron/Hyperion analysis, UnknownCheats Hyperion bypass thread] {confidence: confirmed}

## 2. Landscape: Active Executors 2025-2026

Based on current executor reviews and community tracking:

### Top Paid Executors (Windows PC):
- **Wave Executor**: $7.49/week or $24.99/month, ~98% UNC compatibility, Level 8 execution, fastest patch cadence (typically <24 hours), 1200+ built-in script hub [Source: RobloxExecutors.com, AuroraHub, ZekeHub] {confidence: confirmed}
- **Volt Executor**: ~$5.99-7.99/week, 99% UNC/100% sUNC, Level 8, unique Hyperion emulation approach enabling multi-week undetected sessions, built-in HWID spoofer [Source: AuroraHub] {confidence: confirmed}
- **Potassium Executor**: $22.99 lifetime (one-time), 99-100% UNC, Level 8, external GUI architecture for lower detection footprint, 3000+ script hub [Source: AuroraHub, ZekeHub] {confidence: confirmed}
- **Synapse Z Executor**: $3.99/week, keyless since v3.0, 99% UNC, Level 8 (unofficial successor to Synapse X) [Source: ZekeHub, RobloxExecutors.com] {confidence: confirmed}

### Top Free Executors:
- **Solara Executor**: Free, keyless, Windows 8/10/11, 52-66% UNC (Level 3), sub-100ms injection, very stable, 0/72 VirusTotal [Source: AuroraHub, NoKeyScript] {confidence: confirmed}
- **Xeno Executor**: Free, keyless, Windows + Mobile, 81-90% UNC, Level 7, C++/C# WPF build, multi-attach capability [Source: NoKeyScript, GitHub XenoExecutor] {confidence: confirmed}
- **Madium Executor**: Free, keyless, Windows, 96% UNC, Level 7, new for 2026 with 6 built-in themes and script hub [Source: AuroraHub] {confidence: confirmed}
- **Delta Executor**: Free (with key system, trending keyless), cross-platform (Android/iOS/macOS/Windows/VNG), 100% UNC, Level 8, Hyperion bypass + anti-detection [Source: AuroraHub, Delta Executor ecosystem analysis, NoKeyScript] {confidence: confirmed}

### Discontinued/Deprecated:
- **Synapse X**: Officially shut down October 2023 due to "the cost of continued development against Hyperion" [Source: Synapse X Goodbye page, Delta Executor timeline, Arceus X collaboration announcement] {confidence: confirmed}
- **KRNL PC**: Discontinued late 2025 [Source: AuroraHub] {confidence: confirmed}
- **Fluxus PC**: Discontinued Windows support August 2024, pivoted to Android-only [Source: Delta Executor timeline, AuroraHub] {confidence: confirmed}

UNC (Universal Named Calls) measures implementation of standard executor functions; higher scores indicate better script compatibility without modification. Level indicates identity/capability access within Roblox, with Level 7+ providing near-complete API access [Source: Celesth Identity-level guide, Roblox Studio permission levels] {confidence: confirmed}

## 3. Anti-Cheat: Hyperion/Byfron

Roblox's Hyperion/Byfron anti-cheat system employs a multi-layered defense:

### Client Integrity Layer (Hyperion Hypervisor):
- **User-mode hypervisor** loads before Roblox process on Windows (not kernel-mode as commonly believed) [Source: Delta Executor Anti-Cheat Explained, Byfron vs Hyperion timeline] {confidence: confirmed}
- **Memory integrity checks**: Periodically verifies Roblox binary matches signed manifest; any modification triggers flag [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}
- **DLL enumeration**: Walks loaded DLL list against allow-list; unknown modules get flagged [Source: Delta Executor Anti-Cheat Explained, UnknownCheats Hyperion bypass] {confidence: confirmed}
- **Syscall tracing**: Checks API call patterns match expected Roblox behavior; unknown return addresses are suspicious [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}
- **Anti-debug traps**: Blocks common debugger attach methods (ScyllaHide, CheatEngine, x64dbg) [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}
- **PEB/breakpoint/timing checks**: Samples continuously for debugging/reverse engineering tools [Source: Delta Executor Anti-Cheat Explained, UnknownCheats Hyperion analysis] {confidence: confirmed}

### Additional Layers:
- **Server Validation**: Authoritative state checks on critical actions (teleport, item grants) [Source: Delta Executor Anti-Cheat Explained, Endsights Roblox Anti-Cheat 2026] {confidence: confirmed}
- **Behavioral Detection (ML)**: Shadow mode since early 2025, rolling into gated enforcement Q3 2026; scores input/movement/economy/session patterns [Source: Delta Executor Anti-Cheat Explained, Endsights Roblox Anti-Cheat 2026] {confidence: probable}
- **Social Layer**: Player reports leading to review [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}

### Evasion Techniques:
Executors evade Hyperion by:
- **Memory-only injection**: Loading from memory without disk presence [Source: Delta Executor Anti-Cheat Explained, UnknownCheats Hyperion bypass payload] {confidence: confirmed}
- **Timing-based injection**: Injecting before Hyperion enumeration completes [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}
- **Syscall spoofing**: Making signatures look like benign helper libraries [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}
- **Hypervisor-level techniques**: Some use signed driver abuse or ring-0 approaches [Source: Delta Executor Byfron/Hyperion timeline] {confidence: confirmed}
- **Kernel-level approaches**: Higher risk but more persistent [Source: Delta Executor Byfron/Hyperion timeline] {confidence: confirmed}

Detection typically results in warnings → soft suspensions (1-7 days) → temp bans (14-30 days) → permanent bans for repeat offenders or targeted exploitation [Source: Delta Executor Anti-Cheat Explained, Endsights Roblox Anti-Cheat 2026] {confidence: confirmed}
As of Q1 2026, ~0.3% of active executor users received enforcement action over 3 months, though actual detection rate is higher [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}

Hardware ID bans are **not** currently employed by Roblox as of April 2026; community reports conflating behavioral signals with device fingerprints [Source: TraceX HWID Spoofer, HWIDChanger Roblox HWID Bans] {confidence: confirmed}
Hyperion does **not** log keystrokes system-wide despite community claims [Source: Delta Executor Anti-Cheat Explained] {confidence: confirmed}

## 4. Legal & ToS Implications

Developing and distributing a Lua executor carries substantial legal risks:

### Terms of Service Violations:
- **Section 4 (User Conduct)**: Explicitly prohibits "cheats, exploits, automation software, bots, or hacks" [Source: Roblox Terms of Use, Delta Executor Legal Risks] {confidence: confirmed}
- **Section 5 (Intellectual Property)**: Prohibits reverse engineering or modifying the Roblox client [Source: Roblox Terms of Use, Delta Executor Legal Risks] {confidence: confirmed}
- **Third-party modifications**: Any tool modifying the Roblox experience client is explicitly banned [Source: Roblox Terms of Use, Delta Executor Legal Risks] {confidence: confirmed}

### Potential Legal Frameworks:
- **CFAA (Computer Fraud and Abuse Act)**: Could theoretically apply as "unauthorized access" but Roblox has never pursued legal action against end users; risk primarily to developers [Source: Delta Executor Legal Risks] {confidence: confirmed}
- **DMCA (Digital Millennium Copyright Act)**: Roblox has a formal DMCA process for copyright infringement; circumvention of protection measures could theoretically trigger liability [Source: Roblox Terms of Use, Roblox Creator Docs DMCA Guidelines] {confidence: confirmed}
- **State Laws**: Various state computer crime laws may apply, though enforcement against executor developers is rare [Source: Delta Executor Legal Risks] {confidence: probable}

### Real-World Consequences:
- **Account Bans**: Primary and most likely consequence; ranges from warnings to permanent termination [Source: Roblox ToS Enforcement Update, Delta Executor Legal Risks] {confidence: confirmed}
- **Voided Support**: Using executors voids Roblox support eligibility [Source: Delta Executor Legal Risks] {confidence: confirmed}
- **Ineligibility for Ban Appeals**: Executor use makes accounts ineligible for most ban appeals [Source: Delta Executor Legal Risks] {confidence: confirmed}
- **No Fines/Charges**: As of 2026, no recorded fines, criminal charges, or civil suits against executor end users [Source: Delta Executor Legal Risks] {confidence: confirmed}

### Monetization & Liability:
- Executor developers typically monetize via subscriptions or key systems to fund ongoing anti-cheat evasion work [Source: AuroraHub executor pricing, RobloxExecutors.com] {confidence: confirmed}
- Distribution carries higher legal risk than personal use; developers may face cease-and-desist or legal action [Source: Delta Executor Legal Risks] {confidence: probable}
- The "grey area" argument that modifying one's own local process isn't "unauthorized access" exists but is untested in court [Source: Delta Executor Legal Risks] {confidence: speculative}

## 5. Development Requirements

Building a Lua executor from scratch requires:

### Core Components:
- **C++ Injection Core**: Windows API proficiency for process injection (CreateRemoteThread, QueueUserAPC, manual mapping) [Source: TaaprWareV2, XenoExecutor, RbxStu LuauManager.cpp] {confidence: confirmed}
- **DLL Loading & Reflective Loading**: Techniques to load DLLs without touching disk or using memory-only modules [Source: UnknownCheats Hyperion bypass, TaaprWareV2] {confidence: confirmed}
- **Process Injection**: Bypassing basic antivirus and Hyperion's foreign module detection [Source: UnknownCheats Hyperion bypass payload, TaaprWareV2] {confidence: confirmed}
- **Luau VM Integration**: Direct interaction with lua_State, global_State, Proto, Closure structures; hooking execution functions [Source: Polycheat readme, RbxStu LuauManager.cpp, Roblox Luau source code] {confidence: confirmed}
- **Bytecode Compiler/Decompiler**: Ability to compile Luau source to bytecode and optionally decompile/disassemble [Source: Polycheat readme referencing Unluau, Roblox Luau Bytecode.h] {confidence: confirmed}
- **Custom Native Function Exposure**: Bridging C++ functions into Lua environment [Source: XenoExecutor, TaaprWareV2, RbxStu] {confidence: confirmed}
- **Stealth/Evasion Layer**: Exception handling, API hooking, syscall manipulation to avoid detection [Source: Solara Executor Updated, TaaprWareV2] {confidence: confirmed}

### Required Knowledge:
- Windows internals (PEB, syscalls, memory management) [Source: UnknownCheats Hyperion bypass analysis] {confidence: confirmed}
- Reverse engineering (IDA, Ghidra, x64dbg) for finding Roblox offsets [Source: RbxStu-V2 LuauManager.cpp signature scanning] {confidence: confirmed}
- Luau VM internals (bytecode format, execution loop, garbage collection) [Source: Roblox Luau lvmexecute.cpp, Bytecode.h] {confidence: confirmed}
- Threading and synchronization for safe injection [Source: Polycheat readme scheduler behavior] {confidence: confirmed}
- Exception handling (__try/__except) for stability [Source: Solara Executor Updated] {confidence: confirmed}

### Development Effort:
- **Initial Build**: 3-6 months for basic functionality with weekly updates needed [Source: Delta Executor Byfron/Hyperion timeline (patch response times)] {confidence: confirmed}
- **Maintenance**: Ongoing reverse engineering after each Roblox/Hyperion update (typically monthly) [Source: Delta Executor Byfron/Hyperion timeline, KRNL patch history] {confidence: confirmed}
- **Anti-Cheat Arms Race**: Constant adaptation required; executors frequently break after client patches [Source: Endsights Roblox Anti-Cheat 2026, Delta Executor timeline] {confidence: confirmed}

## 6. Open-Source References

Several open-source projects provide valuable reference implementations:

- **RbxStu/RbxStu-V2** (SecondNewtonLaw): Roblox Studio executor showing Luau function hooking, signature scanning, and VM interaction patterns [Source: GitHub RbxStu-V2 LuauManager.cpp] {confidence: confirmed}
- **Polycheat** (C5Hackr): Native Luau VM-integrated executor for Polytoria 2.0 demonstrating direct VM struct interaction, bytecode dumping, and thread scheduling [Source: GitHub C5Hackr/Polycheat readme] {confidence: confirmed}
- **XenoExecutor** (xenoexecutorv1): C++ Roblox executor using bytecode overwriting technique; shows dependency management (httplib, xxhash, zstd, openssl) [Source: GitHub xenoexecutorv1/XenoExecutor] {confidence: confirmed}
- **TaaprWareV2/V3** (plusgiant5): Open source custom DLL exploit with level 8 execution, multi-injection, and IDE integration [Source: GitHub plusgiant5/TaaprWareV2] {confidence: confirmed}
- **Layuh-Roblox** (Russtels): C++ external cheat showing kernel/system-level interaction patterns [Source: GitHub Russtels/Layuh-Roblox] {confidence: confirmed}
- **Zoom** (Zenexya): Basic C++ Roblox DLL with injection code only [Source: GitHub Zenexya/Zoom] {confidence: confirmed}
- **Magma** (rondotdll): Universal DLL injector and Roblox Lua executor [Source: GitHub rondotdll/Magma] {confidence: confirmed}

These projects illustrate common patterns: signature scanning for Roblox functions, MinHook or custom hooking, Lua state capture, and custom native function exposure [Source: RbxStu-V2 LuauManager.cpp, TaaprWareV2, XenoExecutor] {confidence: confirmed}

## 7. Monetization Models

Current executor monetization strategies:

### Subscription Model (Most Common):
- **Wave Executor**: $7.49/week or $24.99/month [Source: AuroraHub, RobloxExecutors.com] {confidence: confirmed}
- **Volt Executor**: ~$5.99-7.99/week [Source: AuroraHub] {confidence: confirmed}
- **Synapse Z Executor**: $3.99/week [Source: ZekeHub] {confidence: confirmed}
- **Delta Executor**: Moving toward keyless/free tier with premium features [Source: AuroraHub, Delta Executor ecosystem] {confidence: confirmed}

### One-Time Purchase:
- **Potassium Executor**: $22.99 lifetime [Source: AuroraHub, ZekeHub] {confidence: confirmed}
- **MacSploit**: $9.99 lifetime (macOS) [Source: AuroraHub] {confidence: confirmed}
- **AWP.GG/Volt**: $20 one-time or $8/month [Source: Delta Executor ecosystem] {confidence: confirmed}

### Freemium/Key System:
- **Solara Executor**: Free, keyless [Source: AuroraHub, NoKeyScript] {confidence: confirmed}
- **Xeno Executor**: Free, keyless [Source: NoKeyScript, GitHub XenoExecutor] {confidence: confirmed}
- **Madium Executor**: Free, keyless [Source: AuroraHub] {confidence: confirmed}
- **Fluxus/Z**: Free with 24h key, premium removes wait [Source: AuroraHub] {confidence: confirmed}
- **KRNL**: Free with key system (PC discontinued) [Source: AuroraHub, NoKeyScript] {confidence: confirmed}
- **Delta Executor**: Free with key system (trending keyless) [Source: AuroraHub, Delta Executor ecosystem] {confidence: confirmed}

### Market Observations:
- Paid executors dominate Windows PC market due to resources needed for Hyperion bypass [Source: Delta Executor ecosystem analysis, Endsights Roblox Anti-Chest 2026] {confidence: confirmed}
- Free executors often have lower UNC compatibility or higher detection rates [Source: AuroraHub executor comparison] {confidence: confirmed}
- Key systems serve both anti-piracy and user tracking functions [Source: Various executor documentation] {confidence: confirmed}
- Development costs necessitate ongoing revenue; "lifetime" keys are rare and often suspect [Source: AuroraHub warning on lifetime keys] {confidence: confirmed}

## 8. Integration with NexoAccManager (Electron)

Integrating a Lua executor into an Electron + React + TypeScript app like NexoAccManager requires careful architectural decisions:

### Recommended Approach:
- **Separate Native Module**: Build the executor core as a native Node.js addon (.node file) using node-addon-api or node-gyp [Source: Electron Native Code Tutorial] {confidence: confirmed}
- **IPC Communication**: Use Electron's inter-process communication (main ↔ renderer) to pass scripts and results [Source: Electron docs] {confidence: confirmed}
- **UI Layer**: React/TypeScript components in renderer process for script editor, execution controls, and monitoring [Source: NexoAccManager tech stack] {confidence: confirmed}
- **Native Bridge**: C++ core handles injection, VM interaction, and bytecode execution; exposes clean API to JavaScript layer [Source: Electron native code demos, ffi-napi examples] {confidence: confirmed}

### Technical Implementation Options:
1. **Node.js Addon (Preferred)**:
   - Use node-addon-api for safer, easier C++/Node.js bridging [Source: Electron Native Code Tutorial] {confidence: confirmed}
   - Compile with node-gyp targeting Electron's Node.js version [Source: Electron Native Code Tutorial] {confidence: confirmed}
   - Exposes methods like `injectScript(String source)`, `executeBytecode(Buffer bytecode)`, `isAttached()` [Source: Electron native code demos] {confidence: confirmed}
   - Handles thread safety and marshalling between JS and C++ [Source: Electron Win32 tutorial] {confidence: confirmed}

2. **FFI-NAPI Alternative**:
   - Use node-ffi-napi to call DLL directly from JavaScript [Source: node-ffi-napi GitHub, Electron FFI demo] {confidence: confirmed}
   - Higher performance overhead than native addon but avoids compilation step [Source: node-ffi-napi warning] {confidence: confirmed}
   - Requires shipping separate .dll file alongside Electron app [Source: Electron FFI demo] {confidence: confirmed}

3. **Hybrid Approach**:
   - Core injection/evasion in native addon [Source: Electron Native Code Tutorial] {confidence: confirmed}
   - UI/script management in Electron/React [Source: NexoAccManager structure] {confidence: confirmed}
   - Communication via IPC or direct function calls [Source: Electron native code demos] {confidence: confirmed}

### Key Integration Points:
- **Script Input**: React editor captures user script, sends to main process via IPC [Source: Standard Electron pattern] {confidence: confirmed}
- **Injection Trigger**: User clicks "Execute" → main process calls native addon inject function [Source: Electron native code demos] {confidence: confirmed}
- **Results/Errors**: Native addon returns execution results or errors via callback/promise [Source: Electron FFI demo passing data] {confidence: confirmed}
- **Status Monitoring**: Native addon exports `isAttached()`, `getLastError()` for UI feedback [Source: Solara Executor UI concepts] {confidence: confirmed}
- **Update Handling**: Separate update checker module (could be web-based) to download new executor versions [Source: Delta Executor patch response cadence] {confidence: confirmed}

### Development Considerations:
- **Build Complexity**: Requires setting up node-gyp, Windows SDK, and proper Electron build configuration [Source: Electron Native Code Tutorial] {confidence: confirmed}
- **Debugging**: Native addons require separate debugging approaches (WinDbg, Visual Studio) [Source: Electron native code implied] {confidence: confirmed}
- **Distribution**: Must sign executables to avoid SmartScreen warnings; consider auto-update mechanism [Source: Standard Windows software practice] {confidence: confirmed}
- **Anti-Tamper**: Consider measures to prevent tampering with the executor itself (though this risks legal issues) [Source: General software protection knowledge] {confidence: speculative}
- **Resource Usage**: Native execution has minimal performance impact when done correctly [Source: XenoExecutor claims] {confidence: confirmed}

## 9. Recommendations

Based on the research, building a Lua executor feature for NexoAccManager presents significant technical, legal, and ethical challenges:

### Technical Feasibility:
- **Possible but Resource-Intensive**: Requires dedicated C++ reverse engineering team for ongoing Hyperion evasion [Source: Delta Executor patch response times, Synapse X shutdown reason] {confidence: confirmed}
- **High Maintenance Burden**: Expect to update executor after nearly every Roblox client patch (typically weekly) [Source: Delta Executor Byfron/Hyperion timeline] {confidence: confirmed}
- **Steep Learning Curve**: Team needs expertise in Windows internals, reverse engineering, and Luau VM internals [Source: RbxStu-V2, Polycheat, TaaprWareV2] {confidence: confirmed}

### Legal & Risk Assessment:
- **Clear ToS Violation**: Development and distribution violates Roblox Terms of Service Sections 4 and 5 [Source: Roblox Terms of Use, Delta Executor Legal Risks] {confidence: confirmed}
- **Account Ban Risk**: High likelihood of user account bans despite evasion efforts [Source: Delta Executor Anti-Cheat Explained, Endsights Roblox Anti-Cheat 2026] {confidence: confirmed}
- **Legal Grey Area**: CFAA/DMCA risks exist but enforcement against end users is historically low [Source: Delta Executor Legal Risks] {confidence: probable}
- **Reputational Risk**: Association with exploiting may harm NexoAccManager's brand among legitimate users/developers [Source: Community sentiment in research] {confidence: confirmed}

### Business Model Viability:
- **Subscription Model Required**: One-time purchases insufficient to fund ongoing anti-cheat arms race [Source: Delta Executor ecosystem, Synapse X shutdown] {confidence: confirmed}
- **Market Price Point**: Competitors charge $5-25/month or equivalent lifetime value [Source: AuroraHub executor pricing] {confidence: confirmed}
- **User Base Limitations**: Core audience is exploiters; legitimate Roblox users/developers generally avoid executors [Source: Roblox ToS enforcement messaging] {confidence: confirmed}
- **Ethical Consideration**: Facilitates cheating which degrades experience for other players [Source: Roblox ToS, Delta Executor Legal Risks discussion of harm] {confidence: confirmed}

### Alternative Pathways:
1. **Focus on Legitimate Scripting**: Enhance NexoAccManager's script hub, editor, and sharing features for ToS-compliant Roblox development [Source: Roblox ToS encouragement of creativity] {confidence: confirmed}
2. **Official API Integration**: Build features around Roblox's documented HTTP APIs, Studio plugin system, or Creator Dashboard [Source: Roblox Developer Forum] {confidence: confirmed}
3. **Educational VM Tool**: Create a Luau sandbox for learning/script testing that doesn't inject into client [Source: Polycheat's educational goal] {confidence: confirmed}
4. **Partner with Executors**: Develop complementary tools (script hubs, optimizers) that work WITH existing executors rather than building one [Source: Community script hub prevalence] {confidence: confirmed}

### If Proceeding Despite Risks:
- **Minimum Viable Product**: Start with Windows-only, C++ native addon, basic script execution [Source: XenoExecutor simplicity] {confidence: confirmed}
- **Prioritize Stealth**: Invest heavily in evasion techniques over features initially [Source: Delta Executor emphasis on patch response] {confidence: confirmed}
- **Implement Update System**: Crucial for surviving Hyperion updates [Source: Delta Executor Byfron/Hyperion timeline] {confidence: confirmed}
- **Clear ToS Disclaimer**: Inform users of risks and that use is at their own risk [Source: Standard software disclaimer practice] {confidence: confirmed}
- **Monitor Legal Landscape**: Consult counsel if distribution scales significantly [Source: General legal prudence] {confidence: confirmed}

## 10. Sources

1. Roblox Terms of Use - https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use
2. Roblox Creator Docs DMCA Guidelines - https://github.com/Roblox/creator-docs/blob/main/content/en-us/production/publishing/dmca-guidelines.md
3. Delta Executor Legal Risks (2026) - https://deltaexecuter.org/safety/legal/
4. Delta Executor Anti-Cheat Explained - https://deltaexecutor.co/learn/roblox-anti-cheat-explained
5. Delta Executor Byfron vs Hyperion Timeline - https://deltaexecutor.co/learn/byfron-vs-hyperion-timeline
6. Endsights Roblox Anti-Cheat 2026 - https://endsights.com/roblox-anti-cheat
7. UnknownCheats Hyperion Bypass Analysis - https://www.unknowncheats.me/forum/anti-cheat-bypass/669481-hyperion-analysis-roblox-anti-tamper.html
8. UnknownCheats Hyperion Bypass Payload - https://www.unknowncheats.me/forum/roblox/682751-updated-roblox-hyperion-bypass-payload-fixed.html
9. RobloxExecutors.com Reviews - https://robloxexecutors.com/
10. AuroraHub Executor Comparison 2026 - https://aurorahub.net/roblox-executor-comparison
11. ZekeHub Executor Status - https://zekehub.com/executors
12. NoKeyScript Executor List 2026 - https://nokeyscript.com/executor/
13. Synapse X Shutdown Announcement - https://synapse.to/
14. C5Hackr/Polycheat (Open Source Reference) - https://github.com/C5Hackr/Polycheat
15. SecondNewtonLaw/RbxStu-V2 (Open Source Reference) - https://github.com/SecondNewtonLaw/RbxStu-V2
16. xenoexecutorv1/XenoExecutor (Open Source Reference) - https://github.com/xenoexecutorv1/XenoExecutor
17. plusgiant5/TaaprWareV2 (Open Source Reference) - https://github.com/plusgiant5/TaaprWareV2
18. Russtels/Layuh-Roblox (Open Source Reference) - https://github.com/Russtels/Layuh-Roblox
19. Zenexya/Zoom (Open Source Reference) - https://github.com/Zenexya/Zoom
20. rondotdll/Magma (Open Source Reference) - https://github.com/rondotdll/Magma
21. Electron Native Code Tutorial - https://electronjs.org/docs/latest/tutorial/native-code-and-electron
22. Electron Native Code (Windows C++) - https://electronjs.org/docs/latest/tutorial/native-code-and-electron-cpp-win32
23. node-ffi-napi - https://github.com/node-ffi-napi/node-ffi-napi/
24. Roblox Luau Source Code - https://github.com/luau-lang/luau
25. Luau Bytecode Format - https://github.com/luau-lang/luau/blob/master/Common/include/Luau/Bytecode.h
26. Luau VM Execute - https://github.com/luau-lang/luau/blob/master/VM/src/lvmexecute.cpp
27. Celesth Identity-level Guide - https://github.com/Celesth/Identity-level
28. Roblox Forum: Normal Identities - https://devforum.roblox.com/t/a-current-explanation-of-normal-identities-and-security-tags/219471
29. Roblox Forum: Studio Permission Levels - https://devforum.roblox.com/t/studio-permission-levels/1370302
30. Roblox Anti-Cheat Transparency Report (CA) - https://oag.ca.gov/sites/default/files/Roblox%202025%20H2%20California%20AB587%20Terms%20of%20Service%20Report.pdf
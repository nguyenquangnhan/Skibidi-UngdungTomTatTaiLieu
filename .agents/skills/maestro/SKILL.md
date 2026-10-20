---
name: maestro
description: >-
  Automate mobile UI testing, end-to-end flows, and user journey validation for Flutter,
  Android, and iOS applications using Maestro (mobile-dev-inc/Maestro). Use when creating,
  running, debugging, or maintaining declarative YAML test flows, inspecting mobile widget hierarchies,
  automating gestures, and running regression tests on emulators or physical devices.
triggers:
  - "maestro"
  - "mobile test"
  - "flutter test"
  - "mobile e2e"
  - "kiểm thử mobile"
  - "maestro test"
  - "mobile automation"
---

# Maestro — Mobile UI & E2E Automation Skill

This skill provides comprehensive instructions and best practices for authoring, running, and debugging mobile UI test flows using [Maestro](https://github.com/mobile-dev-inc/Maestro) by Mobile.dev.

## 1. When to Use
- Creating End-to-End (E2E) UI test flows for the mobile application (`flutter_app`).
- Automating smoke tests, regression tests, and user onboarding/login flows.
- Inspecting UI element hierarchies, accessibility IDs, and text labels on mobile screens.
- Validating mobile navigation, forms, gestures (tap, swipe, scroll), and asynchronous state changes.

## 2. Prerequisites & Environment Setup

### 2.1 Installation
Maestro CLI can be installed via:

**macOS / Linux:**
```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://get.maestro.mobile.dev" -OutFile "$env:TEMP\maestro.bat"
# Or run with WSL / Git Bash / npm wrapper:
npm install -g maestro
```

Verify installation:
```bash
maestro --version
```

### 2.2 Device & Target App Setup
- Ensure an Android emulator or connected device is active:
  ```bash
  adb devices
  ```
- Target App Identifier for `flutter_app`:
  - Default package: `dev.example.flutteragenticstarter` (or configured `applicationId` in `android/app/build.gradle`).
- Ensure the Flutter app is built or launched before executing flows:
  ```bash
  flutter run -d <device_id>
  ```

---

## 3. Directory & File Organization
Organize mobile test flows in `flutter_app/.maestro/` or `flutter_app/e2e/`:

```text
flutter_app/
├── .maestro/
│   ├── config.yaml               # Shared configuration and app id
│   ├── subflows/
│   │   ├── login.yaml            # Reusable login flow
│   │   └── reset_state.yaml      # Clear cache / reset state
│   ├── auth/
│   │   ├── login_success.yaml
│   │   └── login_failure.yaml
│   └── summarize/
│       └── document_flow.yaml
```

---

## 4. Flow Structure & Syntax Guide

Every flow starts with the `appId` header followed by commands:

```yaml
appId: dev.example.flutteragenticstarter
---
# 1. Launch & setup
- launchApp:
    clearState: true

# 2. Assert initial screen loaded
- assertVisible: "Welcome"

# 3. Form input & action
- tapOn:
    id: "input_email" # In Flutter: Key('input_email') or Semantics(identifier: 'input_email')
- inputText: "testuser@example.com"

- tapOn:
    id: "input_password"
- inputText: "secret123"

- hideKeyboard

# 4. Tap action button
- tapOn: "Đăng nhập"

# 5. Assert result
- assertVisible: "Trang chủ"
```

### Key Maestro Commands Reference

| Command | Usage & Example |
| :--- | :--- |
| `launchApp` | `- launchApp: { clearState: true }` (or `stopIfRunning: false`) |
| `tapOn` | `- tapOn: "Button Text"` or `- tapOn: { id: "widget_key" }` or `- tapOn: { point: "50%,50%" }` |
| `inputText` | `- inputText: "Text to enter"` |
| `eraseText` | `- eraseText: 10` (erases 10 characters) |
| `clearText` | Clears text field before entering new input |
| `hideKeyboard` | Dismisses on-screen keyboard |
| `scroll` | `- scroll` (scrolls down) |
| `swipe` | `- swipe: { direction: UP }` or `- swipe: { start: "50%,80%", end: "50%,20%" }` |
| `back` | Simulates system Back navigation button |
| `assertVisible` | `- assertVisible: "Expected Text"` or `- assertVisible: { id: "my_key" }` |
| `assertNotVisible` | Confirms an element has disappeared |
| `extendedWaitUntil` | `- extendedWaitUntil: { visible: "Result", timeout: 15000 }` |
| `runFlow` | `- runFlow: subflows/login.yaml` |
| `takeScreenshot` | `- takeScreenshot: report/screenshot_home` |
| `stopApp` | Terminates the app process |

For full command documentation, refer to [`references/flow-commands.md`](./references/flow-commands.md).

---

## 5. Flutter Best Practices for Maestro

1. **Use Explicit Keys & Semantics**:
   - In Flutter widgets, assign `Key('login_button')` or wrap with `Semantics(identifier: 'login_button')`.
   - Maestro maps Flutter `ValueKey` to `id:` in YAML.
2. **Handling Animations & Async State**:
   - Flutter's progress spinners or stream updates can cause race conditions. Use `extendedWaitUntil:` instead of arbitrary sleep commands.
   - Example:
     ```yaml
     - extendedWaitUntil:
         visible: "Tóm tắt thành công"
         timeout: 20000
     ```
3. **Environment Variables**:
   - Pass dynamic parameters via CLI:
     ```bash
     maestro test -e BASE_URL=http://10.0.2.2:8000 flow.yaml
     ```
   - Reference in YAML: `${BASE_URL}`.

---

## 6. CLI Execution Workflow

### Run a Single Flow
```bash
maestro test .maestro/auth/login_success.yaml
```

### Run All Flows in a Suite
```bash
maestro test .maestro/
```

### Interactive UI Hierarchy Inspection (Maestro Studio)
```bash
maestro studio
```
*Opens a local web studio at `http://localhost:9999` visualizing device hierarchy, clickable elements, and suggested selector commands.*

### Continuous Integration (Headless)
```bash
maestro test --format junit --output test-reports/report.xml .maestro/
```

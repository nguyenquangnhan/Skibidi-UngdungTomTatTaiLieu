# Maestro Flow Commands & Assertions Reference

Comprehensive reference guide for writing declarative Maestro YAML flows.

## 1. Flow Metadata & Headers
Every test file is configured with an optional header block:
```yaml
appId: dev.example.flutteragenticstarter
name: "Document Summary E2E Flow"
tags:
  - smoke
  - regression
env:
  USERNAME: "user@example.com"
---
```

## 2. Interaction Commands

### tapOn
```yaml
# Simple text match
- tapOn: "Đăng nhập"

# Key / Accessibility ID match (Flutter ValueKey or Semantics)
- tapOn:
    id: "submit_btn"

# Regex pattern match
- tapOn:
    text: "Notebook.*"

# Tap by relative coordinate percentage
- tapOn:
    point: "50%,75%"

# Tap specific index when multiple elements match
- tapOn:
    text: "Mở"
    index: 0

# Tap with retry/optional flag
- tapOn:
    text: "Cho phép thông báo"
    optional: true
```

### Text Input
```yaml
# Tap field, clear previous content and type
- tapOn:
    id: "prompt_input"
- clearText
- inputText: "Tóm tắt tài liệu PDF chương 5"

# Erase specific character count
- eraseText: 5

# Press enter / search key on soft keyboard
- pressKey: Enter
```

### Gestures & Scrolling
```yaml
# Standard vertical scroll
- scroll

# Scroll until a target is visible
- scrollUntilVisible:
    element:
      text: "Xác nhận gửi"
    direction: DOWN
    timeout: 10000

# Explicit swipe
- swipe:
    direction: LEFT
- swipe:
    start: "80%,50%"
    end: "20%,50%"
```

## 3. Assertions & Wait Conditions

```yaml
# Element presence
- assertVisible: "Trang chủ"
- assertVisible:
    id: "graph_view"

# Element absence
- assertNotVisible: "Đang tải dữ liệu..."

# Extended wait for heavy AI / asynchronous responses
- extendedWaitUntil:
    visible: "Kết quả tóm tắt"
    timeout: 30000

# Wait for animations to settle
- waitForAnimationToEnd:
    timeout: 3000
```

## 4. Subflows & Reusable Routines

```yaml
# Execute a subflow with parameters
- runFlow:
    file: subflows/login.yaml
    env:
      EMAIL: "demo@test.com"
      PASSWORD: "Password123"

# Conditional flow execution
- runFlow:
    when:
      visible: "Bỏ qua giới thiệu"
    commands:
      - tapOn: "Bỏ qua giới thiệu"
```

## 5. Media & Reporting
```yaml
# Capture screenshot for reporting or documentation
- takeScreenshot: artifacts/summary_completed.png

# System back button
- back
```

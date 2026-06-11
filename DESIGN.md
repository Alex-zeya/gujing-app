# Design

## Visual Theme

股镜是一个手机端产品界面，设计服务于快速判断和反复使用。场景是用户在通勤、饭后或收盘后用手机查看股票信息，需要清楚、克制、可信，但不能像传统金融后台一样沉闷。视觉应有专业研究工具的秩序感，也保留轻量 App 的呼吸感。

## Color Palette

```css
:root {
  --bg: oklch(0.985 0.002 260);
  --surface: oklch(1 0 0);
  --surface-strong: oklch(0.955 0.006 260);
  --ink: oklch(0.16 0.018 260);
  --muted: oklch(0.42 0.024 260);
  --primary: oklch(0.34 0.118 255);
  --primary-soft: oklch(0.93 0.028 255);
  --accent: oklch(0.56 0.13 168);
  --success: oklch(0.49 0.12 154);
  --warning: oklch(0.62 0.14 76);
  --danger: oklch(0.55 0.16 28);
  --border: oklch(0.885 0.008 260);
}
```

## Typography

Use the system UI font stack for a native iPhone feel: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif`. Keep hierarchy compact with fixed rem sizes. No display font, no fluid type.

## Components

- App shell with fixed top identity row and bottom tab bar.
- Logo is a disciplined K-line mark inside a compact app icon shape, not an eye-only symbol.
- Cards only for repeated content, stock summaries, and risk modules.
- Form controls use one rounded rectangle vocabulary with clear focus states.
- Primary action uses deep indigo with white text.
- Risk and opportunity badges use restrained semantic colors, with green reserved for positive state and orange/red reserved for risk.

## Layout

Mobile-first with a maximum app width for desktop preview. Respect iOS safe areas. Bottom navigation stays reachable by thumb. Content is organized into dense but readable panels.

## Motion

Transitions are 160-220ms and limited to tab changes, button feedback, and card selection. Reduced motion removes transform effects.

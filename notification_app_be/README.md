# notification_app_be

A minimal Bun-based backend that fetches notifications from the evaluation API and returns the top notifications by priority.

## Install

```bash
bun install
```

## Run

```bash
NOTIF_API_TOKEN="<token>" bun run index.ts 10
```

The first CLI argument is the number of top notifications to show (default 10).

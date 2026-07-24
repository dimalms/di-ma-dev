# di-ma.dev

Personal profile site, self-hosted on a **Raspberry Pi Zero 2 W** on my desk.

Live at **[di-ma.dev](https://di-ma.dev)** — try pressing `t` for the terminal.

## What it is

- **HTML/CSS/JS** — no framework, no build step
- **Gruvbox dark + phthalo green** palette, retro-terminal look with a
  fish-style prompt
- **GSAP + ScrollTrigger + Lenis** (vendored, no CDN) for smooth scrolling,
  reveals, and a scroll-reactive liquid background
- Cross-document **View Transitions** between pages, with a JS fallback
- A **fake fish terminal** easter egg (`terminal.js`) — `help`, `neofetch`,
  `cd projects`, …
- **Live Pi vitals** in the footer (CPU temp, uptime, load) served from
  `status.json`, refreshed every minute by a systemd timer on the Pi

## How it's hosted

```
push to master ──▶ GitHub ──▶ Pi pulls every 5 min (systemd timer)
                                │
                                ▼
                    rsync into Apache webroot
                                │
                                ▼
              cloudflared tunnel ──▶ https://di-ma.dev
```

- **Apache** serves the static files on the Pi
- **Cloudflare Tunnel** exposes it — no open ports on the router, origin
  stays unreachable from the internet
- `deploy.sh` + `deploy-site.timer` auto-deploy new commits within 5 minutes
- `pi-status.timer` writes fresh vitals to `status.json` every minute

## Credits

Background image: [magnific](https://www.magnific.com/free-photo/abstract-heavy-azure-haze-liquid_4251077.htm)

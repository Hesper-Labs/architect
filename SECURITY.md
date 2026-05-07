# Security Policy

Architect is a fully client-side, BYOK (bring-your-own-key) application — your API keys, project data, and settings live exclusively in your browser's `localStorage`. No backend, no telemetry, no third-party analytics.

This document covers what we worry about and how to report security concerns.

## Threat model

The realistic threat surface for Architect is:

| Threat                                         | Mitigation                                                                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS** stealing your stored Anthropic API key | Conservative `Content-Security-Policy` meta tag in `index.html`; no user-supplied HTML is rendered as HTML; React's default escaping.                                                                      |
| **Tab hijacking / clickjacking**               | `frame-ancestors 'self'` in CSP.                                                                                                                                                                           |
| **Malicious dependency**                       | Dependabot auto-PRs weekly. We pin exact major versions and review changelogs before merging.                                                                                                              |
| **Compromised CDN font**                       | Fonts loaded from `fonts.googleapis.com`/`fonts.gstatic.com` only; CSP whitelists these explicitly.                                                                                                        |
| **API key exfiltration**                       | Key sent only to `api.anthropic.com` (the only domain in `connect-src`). The Anthropic key is stored at `localStorage[architect:claude_api_key]` so it can't be touched by other sites on the same origin. |

**Out of scope**: physical access to the user's device, browser-level vulnerabilities, malicious browser extensions reading localStorage. Architect can't defend against these.

## What we ask of forks

If you fork Architect to host a multi-user version, you **must** replace the BYOK direct-browser-access pattern. The `anthropic-dangerous-direct-browser-access: true` header is acceptable when the user owns the key; it is not acceptable when keys live on a server. Use a server-side proxy to keep the key off the wire.

## Supported versions

Only the `main` branch receives security fixes. Tagged releases follow semver — pin to a major version to get patch backports.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security concerns. Instead:

- Open a [private security advisory](https://github.com/Hesper-Labs/architect/security/advisories/new) on GitHub, or
- Email the maintainers at the contact listed in the project's GitHub profile.

Include:

- A description of the issue and its potential impact
- Steps to reproduce (if possible, a minimal reproduction)
- Browser + version (XSS-related issues vary by engine)

You can expect an initial response within **5 business days**. We will not pursue legal action against good-faith researchers who follow responsible disclosure.

## Disclosure timeline

After confirming a valid report, we aim to:

1. Acknowledge the report within 5 business days
2. Provide a remediation plan within 14 days
3. Ship a fix and public advisory within 30 days for high-severity issues

Timeline may extend for complex or upstream-dependent fixes. We'll keep you updated.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Research before implementing

Before implementing a non-trivial feature (especially security-sensitive ones: auth, CSRF, session handling, crypto, rate limiting), search for how others have already solved it — established libraries, OWASP guidance, framework-specific patterns. Understand the standard approach, then adopt or adapt it rather than designing from scratch. Prefer a well-known library over hand-rolled code when one exists for the framework in use. Only skip this step for genuinely trivial or purely project-specific logic with no external precedent.

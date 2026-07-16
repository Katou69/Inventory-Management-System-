# Backend (FastAPI)

## Running it

```bash
uv run uvicorn app.main:app --reload --host localhost --port 8123
```

Both `--host localhost` and `--port 8123` are load-bearing. Read on before
changing either.

## Why `--host localhost` (not `::`, not `127.0.0.1`)

`--host localhost` binds **both** stacks — `127.0.0.1:8123` and `[::1]:8123` —
from one process. That matters because `localhost` resolves to both addresses,
and the browser and Node do not agree on which to try first. The order varies by
OS and Node version, so it is not something to assume. Check yours:

```bash
node -e "require('dns').lookup('localhost',{all:true},(e,a)=>console.log(a))"
```

If the backend answers on only one stack, whatever resolves to the other either
fails outright or — much worse — reaches a *different* server that happens to
hold that address.

That is not hypothetical. It cost an afternoon:

An unrelated FastAPI dev server was holding `127.0.0.1:8000` while this backend
was bound IPv6-only on `[::]:8000`. The result was a split brain:

- The **browser** reached this backend over IPv6. Login worked, cookies were
  set, `/auth/me` returned 200. The client looked perfectly healthy.
- **Node** (Server Components) reached the *stranger's* app over IPv4 and got a
  404 on `/auth/me`.
- `requireUser()` saw no user and called `redirect("/login")`.

The dashboard rendered for a split second, then bounced to login — with a valid
session and **nothing in any console**. It presented as an unexplainable login
loop.

Binding both stacks makes the resolution order irrelevant.

## Why port 8123 and not 8000

8000 is every Python dev server's default, which makes it the port most likely
to be squatted by another project. Moving *our* port is what actually prevents a
repeat. Pinning the frontend to an IP literal like `[::1]` does not — it only
changes which stack you gamble on, and it breaks the cookie (see below).

## The cookie constraint

The auth cookie is set without a `Domain` attribute, so it is locked to the host
that set it. The browser loads the app from `localhost:3000`, so the API must
also be `localhost` — `NEXT_PUBLIC_API_URL=http://localhost:8123`.

Do **not** work around a connection problem by putting an IP literal in that
URL. An API on `http://[::1]:8123` sets the cookie for host `::1`, which:

- orphans every session issued before the change (old cookies are scoped to
  `localhost` and are simply never sent), and
- makes the browser/API pair cross-host, for no benefit.

`localhost` on both sides, both stacks bound, private port. That combination has
no failure mode that depends on what else is running.

## Tests

```bash
uv run pytest
```

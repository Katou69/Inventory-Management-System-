# Backend (FastAPI)

## Running it

```bash
uv run uvicorn app.main:app --reload --host :: --port 8000
```

`--host ::` is not optional. Read the next section before changing it.

## Why `--host ::`, and why the frontend says `[::1]`

The frontend's `NEXT_PUBLIC_API_URL` is pinned to an **explicit address**
(`http://[::1]:8000`), not to the name `localhost`. These two facts have to stay
in sync: the URL names IPv6, so the backend has to answer on IPv6.

The reason is a bug that cost an afternoon:

`localhost` resolves to **both** `127.0.0.1` and `::1`, and the browser and Node
do not agree on which to try first. The order is not something to assume — it
varies by OS and Node version. Check yours with:

```bash
node -e "require('dns').lookup('localhost',{all:true},(e,a)=>console.log(a))"
```

If some *other* dev server is holding the half that Node picks — port 8000 is
every Python dev server's default, so this is common — you get a split brain:

- The **browser** reaches this backend over one stack. Login works, cookies are
  set, `/auth/me` returns 200. The client looks perfectly healthy.
- **Node** (Server Components) reaches the *stranger's* app over the other stack
  and gets a 404 on `/auth/me`.
- `requireUser()` sees no user and calls `redirect("/login")`.

Result: the dashboard renders for a split second, then bounces to the login
page, with a valid session and **nothing in any console**. It presents as an
unexplainable login loop.

Pinning the address removes the guesswork. `--host ::` is what makes that
address real.

### If port 8000 is already taken

Don't work around it by changing the address — that just moves which stack you
gamble on. Move this app to a private port on **both** sides:

```bash
uv run uvicorn app.main:app --reload --host :: --port 8123
```

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://[::1]:8123
```

### The cookie constraint

The auth cookie is set without a `Domain` attribute, so it is locked to the host
that set it. The browser and Node must use the **same host string** in
`NEXT_PUBLIC_API_URL`, or the cookie is never sent and every authed request
401s. This is why the URL is one pinned value rather than per-environment
guesses.

## Tests

```bash
uv run pytest
```

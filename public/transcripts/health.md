# http health raw conversation

Command:

```sh
just http-demo health
```

This endpoint does not call the model. It only checks whether the mini-agent HTTP server is running.

## Message 1 - Client -> HTTP server

```http
GET /health HTTP/1.1
Host: 127.0.0.1:3000
```

## Message 2 - HTTP server -> Client

```json
{
  "status": "ok",
  "mode": "dry-run"
}
```

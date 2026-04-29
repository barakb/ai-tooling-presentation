# 01-basic-chat raw conversation

Command:

```sh
just curl-dry-run 01-basic-chat
```

## Message 1 - Host -> OpenAI

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": "Explain tool calling in one sentence."
    }
  ],
  "temperature": 0.2
}
```

## Message 2 - OpenAI -> Host

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Tool calling lets a model ask the host application to run a named function with structured arguments, while the host keeps control over execution."
      }
    }
  ]
}
```

## Message 3 - Host -> Terminal

```json
{
  "role": "assistant",
  "content": "Tool calling lets a model ask the host application to run a named function with structured arguments, while the host keeps control over execution."
}
```

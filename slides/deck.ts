import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes/notes.esm.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import agentLoopDiagram from "./diagrams/agent-loop.svg?url";
import hooksDiagram from "./diagrams/hooks.svg?url";
import miniCopilotDiagram from "./diagrams/mini-copilot.svg?url";
import "./theme.css";

interface Slide {
  className?: string;
  html: string;
  notes?: string;
  children?: Slide[];
}

interface DemoTranscript {
  id: string;
  command: string;
  title: string;
  diagram: string;
  steps: string[];
  stepMessageNumbers?: number[];
  messages?: TranscriptMessage[];
  rawTranscriptHref?: string;
  callout: string;
}

interface TranscriptMessage {
  sequenceNumber: number;
  title: string;
  summary: string;
  body?: string;
  language?: "json" | "text";
}

interface SequenceParticipant {
  id: string;
  label: string;
}

interface SequenceMessage {
  id: string;
  number: number;
  from: string;
  to?: string;
  text: string;
  direction: "forward" | "reverse" | "self" | "note";
  start: number;
  end: number;
}

const copilotAgentLoopDocs =
  "https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md";
const copilotHooksDocs =
  "https://github.com/github/copilot-sdk/blob/main/docs/features/hooks.md";
const runItLocallySlideHash = "#/12";

const speakerNotes = (...items: string[]): string => `
  <ul>
    ${items.map((item) => `<li>${item}</li>`).join("")}
  </ul>
`;

const demoTranscripts: DemoTranscript[] = [
  {
    id: "01-basic-chat",
    command: "just curl-dry-run 01-basic-chat",
    title: "01-basic-chat",
    diagram: `sequenceDiagram
  autonumber
  participant User
  participant Host
  participant OpenAI
  participant Terminal
  User->>Host: Ask a simple question
  Host->>OpenAI: messages only, no tools
  OpenAI-->>Host: assistant content
  Host-->>Terminal: JSON response shape`,
    steps: [
      "The user prompt is wrapped as a single Chat Completions message.",
      "The host sends no tool schema, so the model can only answer with text.",
      "The terminal output demonstrates the normal assistant-message response shape."
    ],
    callout: "Baseline demo: one user message, one model answer, no tool loop yet."
  },
  {
    id: "02-tool-schema",
    command: "just curl-dry-run 02-tool-schema",
    title: "02-tool-schema",
    diagram: `sequenceDiagram
  autonumber
  participant User
  participant Host
  participant OpenAI
  participant Terminal
  User->>Host: Is payments-api healthy?
  Host->>OpenAI: messages plus get_service_status schema
  OpenAI-->>Host: assistant tool_call
  Host-->>Terminal: tool_calls JSON, no execution yet`,
    steps: [
      "The host defines get_service_status with a JSON schema.",
      "The model responds with a requested tool call and arguments.",
      "The script stops at the tool-call boundary so the raw provider shape is visible."
    ],
    callout: "This shows model intent, not tool execution; the host still owns validation and execution."
  },
  {
    id: "03-tool-result-roundtrip",
    command: "just curl-dry-run 03-tool-result-roundtrip",
    title: "03-tool-result-roundtrip",
    diagram: `sequenceDiagram
  autonumber
  participant User
  participant Host
  participant Tool
  participant OpenAI
  User->>Host: Is payments-api healthy?
  Host->>Tool: get_service_status(payments-api)
  Tool-->>Host: degraded status JSON
  Host->>OpenAI: prior tool_call plus role=tool result
  OpenAI-->>Host: final grounded answer`,
    steps: [
      "The host simulates running get_service_status for payments-api.",
      "The tool result is returned as a provider-specific tool message.",
      "The model produces final text grounded in the tool result."
    ],
    callout: "Full REST round trip: host tool result goes back to the model before the final answer."
  },
  {
    id: "genai-tool-basic",
    command: "just rust-demo genai-tool-basic",
    title: "genai-tool-basic",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant RustHost
  participant GenAI
  participant Model
  CLI->>RustHost: run dry-run schema demo
  RustHost->>GenAI: Tool::new plus ChatRequest::with_tools
  GenAI->>Model: provider-specific tool JSON
  Model-->>GenAI: requested ToolCall
  GenAI-->>CLI: print function name and arguments`,
    steps: [
      "Rust builds the same service-status schema shown in the REST demo.",
      "genai converts the common Tool into provider-specific request JSON.",
      "The demo prints the requested tool call instead of hiding it behind abstractions."
    ],
    callout: "Same contract as curl, with Rust builders around Tool and ChatRequest."
  },
  {
    id: "genai-tool-roundtrip",
    command: "just rust-demo genai-tool-roundtrip",
    title: "genai-tool-roundtrip",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant RustHost
  participant GenAI
  participant Model
  CLI->>RustHost: run dry-run round trip
  RustHost->>RustHost: create synthetic ToolCall
  RustHost->>GenAI: ToolResponse::new(call_id, result)
  GenAI->>Model: conversation with tool result
  Model-->>CLI: final answer text`,
    steps: [
      "The demo starts from a synthetic model-requested tool call.",
      "The host creates a ToolResponse with the matching call_id.",
      "genai sends the conversation forward so the model can produce final text."
    ],
    callout: "This is the Rust version of returning a tool result and asking for the final answer."
  },
  {
    id: "genai-tool-basic-live",
    command: "just rust-demo genai-tool-basic-live",
    title: "genai-tool-basic-live",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant RustHost
  participant GenAI
  participant OpenAI
  CLI->>RustHost: run live schema demo
  RustHost->>GenAI: ChatRequest with Tool schema
  GenAI->>OpenAI: authenticated model request
  OpenAI-->>GenAI: live tool_call or text
  GenAI-->>CLI: print returned tool calls`,
    steps: [
      "Uses OPENAI_API_KEY and OPENAI_MODEL from the environment.",
      "Sends the same schema as the dry-run demo to the live provider.",
      "Prints returned tool calls so the presenter can compare live behavior with dry-run output."
    ],
    callout: "Live variant: useful when quota is available; dry-run remains the reliable rehearsal path."
  },
  {
    id: "genai-tool-roundtrip-live",
    command: "just rust-demo genai-tool-roundtrip-live",
    title: "genai-tool-roundtrip-live",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant RustHost
  participant GenAI
  participant OpenAI
  CLI->>RustHost: run live round trip
  RustHost->>RustHost: prepare synthetic tool result
  RustHost->>GenAI: user, assistant tool_call, tool result
  GenAI->>OpenAI: authenticated continuation
  OpenAI-->>CLI: final grounded answer`,
    steps: [
      "Uses a synthetic service-status result, then sends the continuation live.",
      "The model sees the tool result as prior conversation context.",
      "The response demonstrates final-answer generation after host-side tool execution."
    ],
    callout: "Live continuation demo: provider call happens after the host has produced the tool result."
  },
  {
    id: "mini-copilot-agent-loop",
    command: "just rust-demo mini-copilot-agent-loop",
    title: "mini-copilot-agent-loop",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant AgentLoop
  participant Hooks
  participant Tools
  participant Workspace
  CLI->>AgentLoop: Summarize service status
  AgentLoop->>Hooks: before_model and after_model
  AgentLoop->>Hooks: before_tool approval
  AgentLoop->>Tools: read_file(service_status.md)
  Tools->>Workspace: scoped file read
  Workspace-->>Tools: file content
  AgentLoop->>Hooks: after_tool
  AgentLoop-->>CLI: answer plus transcript`,
    steps: [
      "The deterministic planner selects read_file for a status question.",
      "Hooks record the visible loop events before and after model/tool steps.",
      "The scoped ToolRegistry reads only from the fixture workspace."
    ],
    callout: "Mini Copilot loop: prompt, plan, approve, execute, summarize, return transcript."
  },
  {
    id: "mini-copilot-hooks",
    command: "just rust-demo mini-copilot-hooks",
    title: "mini-copilot-hooks",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant AgentLoop
  participant TraceHook
  participant ToolRegistry
  CLI->>AgentLoop: demo hooks
  AgentLoop->>TraceHook: BeforeModel
  AgentLoop->>TraceHook: AfterModel
  AgentLoop->>TraceHook: BeforeTool approval
  AgentLoop->>ToolRegistry: execute selected tool
  AgentLoop->>TraceHook: AfterTool
  AgentLoop-->>CLI: transcript.events`,
    steps: [
      "The same agent loop runs, but the important output is the hook transcript.",
      "TraceHook records hook point, hook name, and message.",
      "The output is a compact way to explain where policy and observability plug in."
    ],
    callout: "Hook demo: the transcript is the teaching artifact."
  },
  {
    id: "mini-copilot-ask",
    command: "just rust-demo mini-copilot-ask",
    title: "mini-copilot-ask",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant Agent
  participant Policy
  participant ToolRegistry
  participant Workspace
  CLI->>Agent: ask Summarize service_status.md
  Agent->>Policy: file access allowed
  Agent->>ToolRegistry: read_file(service_status.md)
  ToolRegistry->>Workspace: canonicalize and read
  Workspace-->>ToolRegistry: service status content
  Agent-->>CLI: answer plus tool_result`,
    steps: [
      "The prompt is wrapped as a Conversation.",
      "AgentLoop selects read_file and checks policy before execution.",
      "The answer includes the selected tool, tool result, and hook transcript."
    ],
    rawTranscriptHref: "./transcripts/mini-copilot-ask.md",
    stepMessageNumbers: [1, 2, 6],
    messages: [
      {
        sequenceNumber: 1,
        title: "CLI request to the local agent",
        summary:
          "The just recipe calls the mini-copilot CLI in dry-run mode with the file question.",
        language: "json",
        body: `{
  "command": "just rust-demo mini-copilot-ask",
  "argv": [
    "mini-copilot-cli",
    "--dry-run",
    "ask",
    "Summarize service_status.md"
  ]
}`
      },
      {
        sequenceNumber: 2,
        title: "Policy allows the read_file tool",
        summary:
          "The agent checks the selected tool against the current policy before touching the workspace.",
        language: "json",
        body: `{
  "policy": {
    "tool": "read_file",
    "requires_file_access": true,
    "veto_file_access": false,
    "decision": "allow"
  }
}`
      },
      {
        sequenceNumber: 3,
        title: "Agent selects a scoped file tool",
        summary:
          "The model-side intent becomes a host-owned tool call with validated arguments.",
        language: "json",
        body: `{
  "selected_tool": {
    "name": "read_file",
    "arguments": {
      "path": "service_status.md"
    }
  }
}`
      },
      {
        sequenceNumber: 4,
        title: "ToolRegistry performs the workspace read",
        summary:
          "The file tool resolves the requested path inside the fixture workspace before reading it.",
        language: "json",
        body: `{
  "workspace_access": {
    "requested_path": "service_status.md",
    "scope": "examples/rust/fixtures/workspace",
    "checks": [
      "canonicalize",
      "stay_under_workspace_root"
    ],
    "operation": "read"
  }
}`
      },
      {
        sequenceNumber: 5,
        title: "Workspace returns file content",
        summary:
          "The local file content is returned to the tool layer as structured data, not hidden model state.",
        language: "json",
        body: `{
  "tool_result": {
    "name": "read_file",
    "content": {
      "path": "service_status.md",
      "content": "# Service status\\n\\npayments-api is degraded while a database failover is in progress.\\n\\n- Current latency: 420 ms\\n- Next update: 15 minutes\\n- Customer impact: checkout retries may be slower than normal\\n"
    }
  }
}`
      },
      {
        sequenceNumber: 6,
        title: "Agent returns the final CLI JSON",
        summary:
          "The response keeps the final answer, selected tool, tool result, and hook transcript visible.",
        language: "json",
        body: `{
  "answer": "Dry-run answer for 'Summarize service_status.md': service_status.md says payments-api is degraded while a database failover is in progress",
  "selected_tool": {
    "name": "read_file",
    "arguments": {
      "path": "service_status.md"
    }
  },
  "tool_result": {
    "name": "read_file",
    "content": {
      "path": "service_status.md",
      "content": "# Service status\\n\\npayments-api is degraded while a database failover is in progress.\\n\\n- Current latency: 420 ms\\n- Next update: 15 minutes\\n- Customer impact: checkout retries may be slower than normal\\n"
    }
  },
  "transcript": {
    "events": [
      {
        "point": "before_model",
        "hook": "trace",
        "message": "planning tool call for prompt: Summarize service_status.md"
      },
      {
        "point": "after_model",
        "hook": "trace",
        "message": "dry-run model selected tool: read_file"
      },
      {
        "point": "before_tool",
        "hook": "trace",
        "message": "requesting approval for tool: read_file"
      },
      {
        "point": "before_tool",
        "hook": "trace",
        "message": "validating and executing tool: read_file"
      },
      {
        "point": "after_tool",
        "hook": "trace",
        "message": "tool result captured: read_file"
      }
    ]
  }
}`
      }
    ],
    callout: "Local file question: safe fixture access with visible host-side control."
  },
  {
    id: "mini-copilot-veto",
    command: "just rust-demo mini-copilot-veto",
    title: "mini-copilot-veto",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant Agent
  participant Policy
  participant ToolRegistry
  CLI->>Agent: ask with veto_file_access=true
  Agent->>Policy: read_file requires file access
  Policy-->>Agent: deny before execution
  Agent-->>CLI: access denied
  Note over ToolRegistry: read_file is never called`,
    steps: [
      "The planned tool is read_file, which requires local file access.",
      "AgentPolicy veto_file_access blocks execution before the ToolRegistry runs.",
      "The just recipe treats the expected denial as a successful safety demo."
    ],
    callout: "Veto demo: user denial happens before local file content is read."
  },
  {
    id: "mini-copilot-http",
    command: "just rust-demo mini-copilot-http",
    title: "mini-copilot-http",
    diagram: `sequenceDiagram
  autonumber
  participant Terminal
  participant Just
  participant Axum
  participant AgentCore
  Terminal->>Just: start HTTP demo
  Just->>Axum: cargo run mini-copilot-http --dry-run
  Axum->>AgentCore: share workspace and dry-run state
  Axum-->>Terminal: listening on 127.0.0.1:3000`,
    steps: [
      "Starts the Axum server with the deterministic mini-agent core.",
      "The server exposes health, agent-loop, hooks, ask, and veto endpoints.",
      "Run http-demo commands from another terminal while this process stays open."
    ],
    callout: "Server startup demo: keep it running before clicking through HTTP endpoint demos."
  },
  {
    id: "mini-copilot-cli",
    command: "just rust-demo mini-copilot-cli",
    title: "mini-copilot-cli",
    diagram: `sequenceDiagram
  autonumber
  participant CLI
  participant AgentLoop
  participant Hooks
  participant ToolRegistry
  CLI->>AgentLoop: alias for demo agent-loop
  AgentLoop->>Hooks: record loop events
  AgentLoop->>ToolRegistry: execute selected file tool
  ToolRegistry-->>AgentLoop: tool_result
  AgentLoop-->>CLI: JSON response`,
    steps: [
      "This is a backwards-compatible alias for mini-copilot-agent-loop.",
      "It runs the same deterministic service-status flow.",
      "Keep it as a short command for people who saw the older docs."
    ],
    callout: "Alias demo: same conversation as mini-copilot-agent-loop."
  },
  {
    id: "health",
    command: "just http-demo health",
    title: "http health",
    diagram: `sequenceDiagram
  autonumber
  participant Client
  participant HTTP
  Client->>HTTP: GET /health
  HTTP-->>Client: status ok, mode dry-run`,
    steps: [
      "Confirms the mini-agent HTTP server is running.",
      "Does not invoke the agent loop or any tool.",
      "Useful as the first endpoint check before running ask or veto."
    ],
    callout: "Health check: server readiness only."
  },
  {
    id: "agent-loop",
    command: "just http-demo agent-loop",
    title: "http agent-loop",
    diagram: `sequenceDiagram
  autonumber
  participant Client
  participant HTTP
  participant AgentLoop
  participant ToolRegistry
  Client->>HTTP: POST /demo/agent-loop
  HTTP->>AgentLoop: Summarize service status
  AgentLoop->>ToolRegistry: read_file(service_status.md)
  ToolRegistry-->>AgentLoop: tool_result
  AgentLoop-->>HTTP: AgentResponse
  HTTP-->>Client: JSON response`,
    steps: [
      "The endpoint supplies the prompt used by the CLI agent-loop demo.",
      "HTTP maps the request into the same core AgentLoop.",
      "The JSON response contains answer, selected_tool, tool_result, and transcript."
    ],
    callout: "HTTP surface, same core loop."
  },
  {
    id: "hooks",
    command: "just http-demo hooks",
    title: "http hooks",
    diagram: `sequenceDiagram
  autonumber
  participant Client
  participant HTTP
  participant AgentLoop
  participant TraceHook
  Client->>HTTP: POST /demo/hooks
  HTTP->>AgentLoop: show hook trace
  AgentLoop->>TraceHook: before and after events
  TraceHook-->>AgentLoop: transcript entries
  AgentLoop-->>Client: JSON with transcript.events`,
    steps: [
      "The endpoint runs the hook-focused mini-agent prompt.",
      "TraceHook captures each important loop point.",
      "The transcript makes before-model, after-model, before-tool, and after-tool visible."
    ],
    callout: "HTTP hook demo: inspect transcript.events in the response."
  },
  {
    id: "ask",
    command: "just http-demo ask",
    title: "http ask",
    diagram: `sequenceDiagram
  autonumber
  participant Client
  participant HTTP
  participant Agent
  participant ToolRegistry
  Client->>HTTP: POST /ask prompt
  HTTP->>Agent: ask_with_policy(default)
  Agent->>ToolRegistry: read_file(service_status.md)
  ToolRegistry-->>Agent: file content
  Agent-->>HTTP: answer and tool_result
  HTTP-->>Client: JSON response`,
    steps: [
      "The client sends an explicit prompt in the JSON body.",
      "The HTTP handler calls Agent::ask_with_policy with default policy.",
      "The same scoped file tool and transcript are returned over HTTP."
    ],
    callout: "Custom prompt over HTTP: the API surface reuses the same agent core."
  },
  {
    id: "veto",
    command: "just http-demo veto",
    title: "http veto",
    diagram: `sequenceDiagram
  autonumber
  participant Client
  participant HTTP
  participant Agent
  participant Policy
  participant ToolRegistry
  Client->>HTTP: POST /ask veto_file_access=true
  HTTP->>Agent: ask_with_policy(veto)
  Agent->>Policy: selected tool needs file access
  Policy-->>Agent: deny
  Agent-->>HTTP: access denied error
  HTTP-->>Client: 400 JSON error
  Note over ToolRegistry: no file read occurs`,
    steps: [
      "The request body sets veto_file_access to true.",
      "The selected read_file tool is denied before execution.",
      "The API returns a 400 JSON error instead of file content."
    ],
    callout: "HTTP veto demo: the same safety behavior is available through the API."
  }
];

const demoTranscriptIndex = new Map(
  demoTranscripts.map((demo, index) => [demo.id, index + 2])
);

const demoHash = (id: string): string =>
  `${runItLocallySlideHash}/${demoTranscriptIndex.get(id) ?? 1}`;

const demoOptionLink = (id: string): string =>
  `<a class="demo-option-link" href="${demoHash(id)}"><code>${id}</code></a>`;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const parseSequence = (
  source: string,
  demoId: string
): {
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
} => {
  const participants: SequenceParticipant[] = [];
  const messages: SequenceMessage[] = [];

  const participantIndex = (id: string): number => {
    const index = participants.findIndex((participant) => participant.id === id);
    return index === -1 ? 0 : index + 1;
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    const participantMatch = line.match(/^participant\s+(\w+)(?:\s+as\s+(.+))?$/);

    if (participantMatch) {
      participants.push({
        id: participantMatch[1],
        label: participantMatch[2] ?? participantMatch[1]
      });
    }
  }

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    const messageMatch = line.match(/^(\w+)(--)?->>(\w+):\s+(.+)$/);
    const noteMatch = line.match(/^Note over (\w+):\s+(.+)$/);

    if (messageMatch) {
      const number = messages.length + 1;
      const from = participantIndex(messageMatch[1]);
      const to = participantIndex(messageMatch[3]);
      const start = Math.min(from, to);
      const end = Math.max(from, to) + 1;
      const direction =
        from === to ? "self" : from < to ? "forward" : "reverse";

      messages.push({
        id: `${demoId}-message-${number}`,
        number,
        from: messageMatch[1],
        to: messageMatch[3],
        text: messageMatch[4],
        direction,
        start,
        end
      });
    } else if (noteMatch) {
      const number = messages.length + 1;
      const participant = participantIndex(noteMatch[1]);
      messages.push({
        id: `${demoId}-message-${number}`,
        number,
        from: noteMatch[1],
        text: noteMatch[2],
        direction: "note",
        start: participant,
        end: participant + 1
      });
    }
  }

  return { participants, messages };
};

const renderSequenceDiagram = (demo: DemoTranscript): string => {
  const { participants, messages } = parseSequence(demo.diagram, demo.id);

  return `
    <div class="sequence-diagram" style="--participants: ${participants.length};">
      <div class="sequence-participants">
        ${participants
          .map(
            (participant) =>
              `<span>${escapeHtml(participant.label)}</span>`
          )
          .join("")}
      </div>
      <div class="sequence-rows">
        ${messages
          .map(
            (message) => `
              <div class="sequence-row ${message.direction}" style="--start: ${message.start}; --end: ${message.end};">
                <a class="sequence-message" href="${demoHash(demo.id)}" data-message-target="${message.id}">
                  <span class="sequence-number">${message.number}</span>
                  <strong>${escapeHtml(message.to ? `${message.from} ${message.direction === "reverse" ? "<-" : "->"} ${message.to}` : "Note")}</strong>
                  ${escapeHtml(message.text)}
                </a>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
};

const renderMessageDetails = (demo: DemoTranscript): string => {
  const { messages } = parseSequence(demo.diagram, demo.id);
  const fallbackDetails: TranscriptMessage[] = messages.map((message) => ({
    sequenceNumber: message.number,
    title: message.to
      ? `${message.from} -> ${message.to}`
      : `Note over ${message.from}`,
    summary: message.text
  }));
  const details = demo.messages ?? fallbackDetails;

  return details
    .map((detail, index) => {
      const message =
        messages.find((candidate) => candidate.number === detail.sequenceNumber) ??
        messages[Math.min(index, messages.length - 1)];

      return `
        <article class="message-detail" id="${message.id}">
          <h4>
            <a class="message-detail-anchor" href="${demoHash(demo.id)}" data-message-target="${message.id}">
              Message ${message.number} · ${escapeHtml(detail.title)}
            </a>
          </h4>
          <p>${escapeHtml(detail.summary)}</p>
          ${
            detail.body
              ? `<pre><code class="language-${detail.language ?? "text"}">${escapeHtml(detail.body)}</code></pre>`
              : ""
          }
        </article>
      `;
    })
    .join("");
};

const renderNoticeLinks = (demo: DemoTranscript): string => {
  const { messages } = parseSequence(demo.diagram, demo.id);

  return demo.steps
    .map((step, index) => {
      const explicitMessageNumber = demo.stepMessageNumbers?.[index];
      const message =
        messages.find((candidate) => candidate.number === explicitMessageNumber) ??
        messages[Math.min(index, messages.length - 1)];

      return `
        <li>
          <a class="notice-link" href="${demoHash(demo.id)}" data-message-target="${message.id}">
            <span>Message ${message.number}</span>
            ${escapeHtml(step)}
          </a>
        </li>
      `;
    })
    .join("");
};

const renderRawTranscriptLink = (demo: DemoTranscript): string =>
  demo.rawTranscriptHref
    ? `<a class="raw-transcript-link" href="${escapeHtml(demo.rawTranscriptHref)}" target="_blank" rel="noreferrer">Open raw messages</a>`
    : "";

const renderTranscriptSlide = (demo: DemoTranscript): Slide => ({
  className: "compact-slide transcript-slide",
  html: `
    <h2>${demo.title}</h2>
    <p class="demo-command"><code>${demo.command}</code></p>
    <div class="transcript-layout">
      <article class="sequence-card">
        <h3>Sequence diagram</h3>
        ${renderSequenceDiagram(demo)}
      </article>
      <article class="transcript-card">
        <div class="transcript-toolbar">
          <h3>Actual messages</h3>
          ${renderRawTranscriptLink(demo)}
        </div>
        <div class="message-detail-list">
          ${renderMessageDetails(demo)}
        </div>
        <h3>What to notice</h3>
        <ol>
          ${renderNoticeLinks(demo)}
        </ol>
      </article>
    </div>
    <p class="callout">${demo.callout}</p>
  `,
  notes: speakerNotes(
    `Use this transcript page to explain the conversation behind ${demo.command}.`,
    "Walk the sequence diagram first, then read the transcript bullets as the concrete message flow.",
    "Rubber duck review: name which participant owns each step and which data crosses the boundary."
  )
});

const slides: Slide[] = [
  {
    className: "title-slide",
    html: `
      <p class="eyebrow">R&D learning session</p>
      <h1>LLM Tooling, Agent Loops, and Hooks</h1>
      <p class="subtitle">From raw REST calls to a mini Copilot-style agent in Rust</p>
      <p class="meta">Reveal.js + curl + rust-genai</p>
    `,
    notes: speakerNotes(
      "Set the promise: this is not a high-level AI talk. We will look at the wire format, then build up to an agent loop.",
      "Rubber duck review: say what the audience will be able to do by the end: read provider JSON, run curl demos, and recognize the same loop in Rust."
    )
  },
  {
    html: `
      <h2>What we will build</h2>
      <div class="cards">
        <article><h3>1. Mental model</h3><p>Agent loop, tool calls, tool results, and hooks.</p></article>
        <article><h3>2. Provider syntax</h3><p>OpenAI runnable examples, plus Claude and Gemini comparisons.</p></article>
        <article><h3>3. Rust implementation</h3><p>rust-genai examples and a mini Copilot-style API.</p></article>
      </div>
    `,
    notes: speakerNotes(
      "Frame the talk as three layers: concept, wire format, implementation.",
      "Point out that OpenAI is runnable here, while Claude and Gemini are syntax comparisons so the presentation stays focused and reliable."
    )
  },
  {
    html: `
      <h2>Why tooling matters</h2>
      <ul>
        <li>Models are strong at reasoning over context, but they cannot directly read your repo, call APIs, or make changes.</li>
        <li>Tools turn model intent into host-controlled actions.</li>
        <li>The host application keeps authority: validation, execution, policy, logging, and final UX.</li>
      </ul>
      <p class="callout">The model suggests. The host decides and executes.</p>
    `,
    notes: speakerNotes(
      "Use this slide to separate model intelligence from host authority.",
      "Rubber duck review: if a model asks to read a file, where does permission, path validation, and logging happen? Answer: in host code, not in the model."
    )
  },
  {
    html: `
      <h2>The agent loop</h2>
      <img class="diagram" src="${agentLoopDiagram}" alt="Agent loop diagram" />
      <ol>
        <li>User asks for work.</li>
        <li>Model responds with text or tool calls.</li>
        <li>Host validates and runs tools.</li>
        <li>Tool results go back to the model.</li>
        <li>Loop continues until final answer.</li>
      </ol>
      <p class="source-link-row"><a href="${copilotAgentLoopDocs}" target="_blank" rel="noreferrer">Copilot SDK agent loop docs</a></p>
    `,
    notes: speakerNotes(
      "Walk the diagram clockwise and name the owner of each step: user, model, host, tool, model again.",
      "Rubber duck review: can we explain every box without saying magic? The important point is that tool execution is outside the model.",
      "Call out the linked Copilot SDK doc as the conceptual source for the loop."
    )
  },
  {
    className: "compact-slide",
    html: `
      <h2>Hooks: control points around the loop</h2>
      <img class="diagram diagram-short" src="${hooksDiagram}" alt="Hook lifecycle diagram" />
      <p>Hooks are where product behavior, policy, and observability become explicit.</p>
      <div class="split">
        <ul>
          <li>Before model request</li>
          <li>After model response</li>
          <li>Before tool execution</li>
        </ul>
        <ul>
          <li>After tool execution</li>
          <li>On error</li>
          <li>Before final response</li>
        </ul>
      </div>
      <p class="source-link-row"><a href="${copilotHooksDocs}" target="_blank" rel="noreferrer">Copilot SDK hooks docs</a></p>
    `,
    notes: speakerNotes(
      "Explain hooks as product and platform control points, not just callbacks.",
      "Use the lifecycle positions to show where teams can add policy, tracing, confirmation, and eval capture without changing every tool implementation.",
      "Rubber duck review: ask which hook would catch a dangerous file write before it runs."
    )
  },
  {
    html: `
      <h2>Concrete hook examples</h2>
      <table>
        <thead><tr><th>Hook</th><th>Real use</th></tr></thead>
        <tbody>
          <tr><td>Before model</td><td>Add repo context, redact secrets, attach policy.</td></tr>
          <tr><td>After model</td><td>Trace output, detect unsafe intent, capture eval data.</td></tr>
          <tr><td>Before tool</td><td>Validate args, require confirmation, enforce path scope.</td></tr>
          <tr><td>After tool</td><td>Log result shape, update metrics, summarize errors.</td></tr>
        </tbody>
      </table>
    `,
    notes: speakerNotes(
      "Move from lifecycle names to practical engineering behavior.",
      "Connect before-tool policy to the later veto demo and path-scoped file tools.",
      "Rubber duck review: each example should answer what risk or operational need it handles."
    )
  },
  {
    html: `
      <h2>Tool call anatomy</h2>
      <pre><code>{
  "name": "get_service_status",
  "description": "Return service health by name",
  "parameters": {
    "type": "object",
    "properties": {
      "service": { "type": "string" }
    },
    "required": ["service"]
  }
}</code></pre>
      <p class="callout">A schema guides the model. Your code still validates everything.</p>
    `,
    notes: speakerNotes(
      "Name the three parts: tool name, natural-language description, JSON schema.",
      "Emphasize that JSON schema improves model behavior but is not a security boundary.",
      "Rubber duck review: the host must validate the actual arguments because they are model output."
    )
  },
  {
    html: `
      <h2>Provider flavor comparison</h2>
      <table class="dense">
        <thead><tr><th>Concept</th><th>OpenAI</th><th>Claude</th><th>Gemini</th></tr></thead>
        <tbody>
          <tr><td>Tool definition</td><td><code>tools[].function</code></td><td><code>tools[]</code></td><td><code>functionDeclarations[]</code></td></tr>
          <tr><td>Model asks for tool</td><td><code>tool_calls</code></td><td><code>tool_use</code></td><td><code>functionCall</code></td></tr>
          <tr><td>Host returns result</td><td><code>role: tool</code></td><td><code>tool_result</code></td><td><code>functionResponse</code></td></tr>
          <tr><td>Host responsibility</td><td colspan="3">Validate, execute, log, secure, and continue the conversation.</td></tr>
        </tbody>
      </table>
    `,
    notes: speakerNotes(
      "Keep this as a translation table. Do not imply exact feature parity between providers.",
      "Use the table to create a stable vocabulary before diving into provider-specific JSON.",
      "Rubber duck review: the same host responsibilities remain even when the field names change."
    ),
    children: [
      {
        className: "compact-slide provider-example-slide",
        html: `
          <h2>OpenAI tool messages</h2>
          <div class="provider-json-grid">
            <article class="provider-json-card">
              <h3>1. Host request</h3>
              <pre><code>{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": "Is payments-api healthy?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_service_status",
        "description": "Return service health.",
        "parameters": {
          "type": "object",
          "properties": {
            "service": { "type": "string" }
          },
          "required": ["service"]
        }
      }
    }
  ]
}</code></pre>
            </article>
            <article class="provider-json-card">
              <h3>2. Model asks for tool</h3>
              <pre><code>{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_123",
      "type": "function",
      "function": {
        "name": "get_service_status",
        "arguments": "{\\"service\\":\\"payments-api\\"}"
      }
    }
  ]
}</code></pre>
            </article>
            <article class="provider-json-card">
              <h3>3. Host returns result</h3>
              <pre><code>{
  "role": "tool",
  "tool_call_id": "call_123",
  "name": "get_service_status",
  "content": "{\\"status\\":\\"degraded\\",\\"latency_ms\\":420}"
}</code></pre>
            </article>
          </div>
        `,
        notes: speakerNotes(
          "Walk left to right: request with tools, assistant tool call, host tool result.",
          "Point out that OpenAI function arguments arrive as a JSON string, so the host must parse and validate them.",
          "Rubber duck review: where is get_service_status implemented? It is host code; the JSON only advertises the contract."
        )
      },
      {
        className: "compact-slide provider-example-slide",
        html: `
          <h2>Anthropic Claude tool messages</h2>
          <div class="provider-json-grid">
            <article class="provider-json-card">
              <h3>1. Host request</h3>
              <pre><code>{
  "model": "claude-sonnet-4-5",
  "messages": [
    {
      "role": "user",
      "content": "Is payments-api healthy?"
    }
  ],
  "tools": [
    {
      "name": "get_service_status",
      "description": "Return service health.",
      "input_schema": {
        "type": "object",
        "properties": {
          "service": { "type": "string" }
        },
        "required": ["service"]
      }
    }
  ]
}</code></pre>
            </article>
            <article class="provider-json-card">
              <h3>2. Model asks for tool</h3>
              <pre><code>{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_123",
      "name": "get_service_status",
      "input": {
        "service": "payments-api"
      }
    }
  ]
}</code></pre>
            </article>
            <article class="provider-json-card">
              <h3>3. Host returns result</h3>
              <pre><code>{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_123",
      "content": "{\\"status\\":\\"degraded\\",\\"latency_ms\\":420}"
    }
  ]
}</code></pre>
            </article>
          </div>
        `,
        notes: speakerNotes(
          "Contrast Claude's content blocks with OpenAI's assistant/tool messages.",
          "The model emits a tool_use block and the host answers with a tool_result block tied to the tool_use_id.",
          "Rubber duck review: do not claim the Claude shape is interchangeable with OpenAI; the shared idea is the loop, not the exact JSON."
        )
      },
      {
        className: "compact-slide provider-example-slide",
        html: `
          <h2>Google Gemini tool messages</h2>
          <div class="provider-json-grid">
            <article class="provider-json-card">
              <h3>1. Host request</h3>
              <pre><code>{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "Is payments-api healthy?" }
      ]
    }
  ],
  "tools": [
    {
      "functionDeclarations": [
        {
          "name": "get_service_status",
          "description": "Return service health.",
          "parameters": {
            "type": "object",
            "properties": {
              "service": { "type": "string" }
            },
            "required": ["service"]
          }
        }
      ]
    }
  ]
}</code></pre>
            </article>
            <article class="provider-json-card">
              <h3>2. Model asks for tool</h3>
              <pre><code>{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "functionCall": {
              "name": "get_service_status",
              "args": {
                "service": "payments-api"
              }
            }
          }
        ]
      }
    }
  ]
}</code></pre>
            </article>
            <article class="provider-json-card">
              <h3>3. Host returns result</h3>
              <pre><code>{
  "role": "function",
  "parts": [
    {
      "functionResponse": {
        "name": "get_service_status",
        "response": {
          "status": "degraded",
          "latency_ms": 420
        }
      }
    }
  ]
}</code></pre>
            </article>
          </div>
        `,
        notes: speakerNotes(
          "Contrast Gemini's functionDeclarations, functionCall, and functionResponse terms.",
          "Highlight that Gemini uses parts inside contents, so the host has to preserve that provider-specific envelope.",
          "Rubber duck review: the host still validates args and executes the local service-status function."
        )
      }
    ]
  },
  {
    html: `
      <h2>OpenAI REST flow with curl</h2>
      <ol>
        <li>Send user message plus tool schema.</li>
        <li>Receive assistant message with a tool call.</li>
        <li>Run the local function in the host.</li>
        <li>Send the tool result back as a tool message.</li>
        <li>Receive the final natural-language answer.</li>
      </ol>
      <pre><code>just curl-dry-run 03-tool-result-roundtrip
OPENAI_API_KEY=... just curl-demo 03-tool-result-roundtrip</code></pre>
    `,
    notes: speakerNotes(
      "This is the first runnable bridge from slides to terminal.",
      "Start with dry-run because it prints the payload deterministically; only run live mode if the key and quota are ready.",
      "Rubber duck review: every bullet should map to one message in the next vertical slide and to the curl script."
    ),
    children: [
      {
        className: "compact-slide message-flow-slide",
        html: `
          <h2>Tool contract + participant messages</h2>
          <div class="tool-message-grid">
            <article class="tool-definition-card">
              <h3>0. Host defines the tool before the model call</h3>
              <pre><code>"tools": [{
  "type": "function",
  "function": {
    "name": "get_service_status",
    "description": "Return current health for an internal service.",
    "parameters": {
      "type": "object",
      "properties": {
        "service": { "type": "string" }
      },
      "required": ["service"],
      "additionalProperties": false
    }
  }
}]</code></pre>
            </article>
            <article class="message-steps-card">
              <h3>1-6. The loop uses that contract</h3>
              <ol class="message-steps">
                <li><strong>User -&gt; Host</strong><code>Is payments-api healthy?</code></li>
                <li><strong>Host -&gt; Model</strong><code>messages + tools[get_service_status]</code></li>
                <li><strong>Model -&gt; Host</strong><code>tool_call: get_service_status({"service":"payments-api"})</code></li>
                <li><strong>Host -&gt; Tool</strong><code>validate args, run local function</code></li>
                <li><strong>Tool -&gt; Host</strong><code>{"status":"degraded","latency_ms":420}</code></li>
                <li><strong>Host -&gt; Model -&gt; User</strong><code>role=tool result, then final answer</code></li>
              </ol>
            </article>
          </div>
          <p class="callout">The model can only request the tool. The host owns the definition, validation, execution, and returned result.</p>
        `,
        notes: speakerNotes(
          "Make the missing piece explicit: get_service_status is defined by the host before the model call.",
          "Trace the participant messages in order and remind the audience that the tool result is not generated by the model.",
          "Rubber duck review: if the model invents a different service name or malformed JSON, the host must reject or correct it."
        )
      }
    ]
  },
  {
    className: "compact-slide rust-genai-slide",
    html: `
      <h2>rust-genai uses the same tool schema</h2>
      <div class="rust-tool-grid">
        <article class="tool-definition-card">
          <h3>1. Define the JSON schema in Rust</h3>
          <pre><code>let schema = json!({
  "type": "object",
  "properties": {
    "service": {
      "type": "string",
      "description": "Internal service name"
    }
  },
  "required": ["service"],
  "additionalProperties": false
});</code></pre>
        </article>
        <article class="tool-definition-card">
          <h3>2. Attach it to the tool request</h3>
          <pre><code>let tool = Tool::new("get_service_status")
  .with_description("Return service health by name")
  .with_schema(schema);

let req = ChatRequest::from_user(question)
  .with_tools(vec![tool]);

let response =
  client.exec_chat(model, req, None).await?;</code></pre>
        </article>
      </div>
      <p class="callout">The SDK changes the ergonomics; the contract is still the same schema the REST call sends to the model.</p>
    `,
    notes: speakerNotes(
      "Show that rust-genai does not remove the schema contract; it gives Rust builders around it.",
      "Connect Tool::new and with_schema directly back to the REST tools array.",
      "Rubber duck review: ask what still has to be validated after the model asks for a tool."
    ),
    children: [
      {
        className: "compact-slide code-walkthrough-slide",
        html: `
          <h2>How genai implements tooling</h2>
          <div class="walkthrough-grid">
            <article class="source-card">
              <h3>Tool definition</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/chat/tool/tool_base.rs" target="_blank" rel="noreferrer">
                  genai/src/chat/tool/tool_base.rs
                </a>
              </p>
              <pre><code>pub struct Tool {
  pub name: ToolName,
  pub description: Option&lt;String&gt;,
  pub schema: Option&lt;Value&gt;,
  pub strict: Option&lt;bool&gt;,
  pub config: Option&lt;ToolConfig&gt;,
}</code></pre>
            </article>
            <article class="source-card">
              <h3>Request carries tools</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/chat/chat_request.rs" target="_blank" rel="noreferrer">
                  genai/src/chat/chat_request.rs
                </a>
              </p>
              <pre><code>pub struct ChatRequest {
  pub messages: Vec&lt;ChatMessage&gt;,
  pub tools: Option&lt;Vec&lt;Tool&gt;&gt;,
}

pub fn with_tools&lt;I&gt;(mut self, tools: I) -&gt; Self {
  self.tools = Some(tools.into_iter()
    .map(Into::into)
    .collect());
  self
}</code></pre>
            </article>
          </div>
          <p class="callout">genai normalizes the Rust API, then each provider adapter serializes these common structs into OpenAI, Claude, Gemini, etc.</p>
        `,
        notes: speakerNotes(
          "Use the docs.rs links as source-code anchors, not just references.",
          "Explain that Tool and ChatRequest are provider-neutral structs in the genai API.",
          "Rubber duck review: the SDK hides provider serialization, but it does not make tools run automatically."
        )
      },
      {
        className: "compact-slide code-walkthrough-slide",
        html: `
          <h2>Provider adapters turn Tool into provider JSON</h2>
          <div class="provider-adapter-grid">
            <article class="source-card">
              <h3>OpenAI adapter</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/adapter/adapters/openai/adapter_shared.rs" target="_blank" rel="noreferrer">
                  openai/adapter_shared.rs
                </a>
              </p>
              <pre><code>json!({
  "type": "function",
  "function": {
    "name": tool.name,
    "description": tool.description,
    "parameters": parameters,
    "strict": strict,
  }
})</code></pre>
            </article>
            <article class="source-card">
              <h3>Anthropic adapter</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/adapter/adapters/anthropic/adapter_impl.rs" target="_blank" rel="noreferrer">
                  anthropic/adapter_impl.rs
                </a>
              </p>
              <pre><code>tool_value.x_insert("name", name)?;
tool_value.x_insert("input_schema", schema)?;

if let Some(description) = description {
  tool_value.x_insert("description", description)?;
}</code></pre>
            </article>
            <article class="source-card">
              <h3>Gemini adapter</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/adapter/adapters/gemini/adapter_impl.rs" target="_blank" rel="noreferrer">
                  gemini/adapter_impl.rs
                </a>
              </p>
              <pre><code>for req_tool in req_tools {
  match Self::tool_to_gemini_tool(req_tool)? {
    GeminiTool::Builtin(value) =&gt; tools.push(value),
    GeminiTool::User(value) =&gt;
      function_declarations.push(value),
  }
}

tools.push(json!({
  "functionDeclarations": function_declarations
}));</code></pre>
            </article>
          </div>
          <p class="callout">This is why the same <code>Tool</code> object becomes <code>tools[].function</code>, <code>input_schema</code>, or <code>functionDeclarations</code> depending on the adapter.</p>
        `,
        notes: speakerNotes(
          "This slide answers the internal implementation question: common Tool in, provider JSON out.",
          "Compare the three snippets against the provider JSON slides from earlier.",
          "Rubber duck review: if a provider changes its envelope, the adapter changes, not every caller."
        )
      },
      {
        className: "compact-slide code-walkthrough-slide",
        html: `
          <h2>genai tool-call round trip</h2>
          <div class="walkthrough-grid">
            <article class="source-card">
              <h3>Model-requested call</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/chat/tool/tool_call.rs" target="_blank" rel="noreferrer">
                  genai/src/chat/tool/tool_call.rs
                </a>
              </p>
              <pre><code>pub struct ToolCall {
  pub call_id: String,
  pub fn_name: String,
  pub fn_arguments: Value,
  pub thought_signatures: Option&lt;Vec&lt;String&gt;&gt;,
}</code></pre>
            </article>
            <article class="source-card">
              <h3>Host returns result</h3>
              <p class="source-path">
                <a href="https://docs.rs/crate/genai/0.6.0-beta.18/source/src/chat/tool/tool_response.rs" target="_blank" rel="noreferrer">
                  genai/src/chat/tool/tool_response.rs
                </a>
              </p>
              <pre><code>pub struct ToolResponse {
  pub call_id: String,
  pub content: String,
}

ToolResponse::new(call_id, result_json)</code></pre>
            </article>
          </div>
          <pre class="wide-code"><code>let tool_calls = response.into_tool_calls();
let result = run_host_tool(&tool_calls[0])?;
let next_req = req
  .append_message(tool_calls)
  .append_message(ToolResponse::new(call_id, result));</code></pre>
        `,
        notes: speakerNotes(
          "Explain the second half of the loop: receive ToolCall, run host code, build ToolResponse.",
          "Point to ToolCall.fn_arguments as untrusted model output and ToolResponse.content as host-produced data.",
          "Rubber duck review: the model never executes the function; the host does and then returns the result."
        )
      }
    ]
  },
  {
    html: `
      <h2>Mini Copilot-style API</h2>
      <img class="diagram" src="${miniCopilotDiagram}" alt="Mini Copilot architecture diagram" />
      <p>Small enough to teach, real enough to demonstrate the agent loop and hooks.</p>
    `,
    notes: speakerNotes(
      "Now move from provider mechanics to an intentionally small SDK-like design.",
      "Name the boundaries: CLI/HTTP entry points, Agent, AgentLoop, ToolRegistry, HookRegistry, and scoped workspace.",
      "Rubber duck review: the demo is not a full Copilot clone; it is a teaching model of the same loop and controls."
    ),
    children: [
      {
        className: "compact-slide code-walkthrough-slide",
        html: `
          <h2>Mini-agent implementation walkthrough</h2>
          <div class="walkthrough-grid">
            <article class="source-card">
              <h3>Tool registry exposes schemas</h3>
              <p class="source-path">mini-copilot-core/src/lib.rs</p>
              <pre><code>pub fn genai_tools(&self) -&gt; Vec&lt;Tool&gt; {
  self.schemas()
    .into_iter()
    .filter_map(|schema| {
      let name = schema.get("name")?.as_str()?;
      let parameters = schema.get("parameters")?.clone();
      Some(Tool::new(name).with_schema(parameters))
    })
    .collect()
}</code></pre>
            </article>
            <article class="source-card">
              <h3>AgentLoop owns execution</h3>
              <p class="source-path">mini-copilot-core/src/lib.rs</p>
              <pre><code>pub fn run(
  &self,
  conversation: &Conversation,
  policy: AgentPolicy
) -&gt; Result&lt;AgentResponse&gt; {
  let selected_tool =
    plan_tool_call(&conversation.user_prompt);

  hooks.emit(BeforeTool, "request approval", tx)?;

  if policy.veto_file_access
    && requires_file_access(&selected_tool.name) {
    return Err(AgentError::AccessDenied(...));
  }

  let tool_result = tools.execute(&selected_tool)?;
}</code></pre>
            </article>
          </div>
          <p class="callout">The mini SDK mirrors the real agent boundary: model selects intent, host policy approves, host tool registry executes.</p>
        `,
        notes: speakerNotes(
          "Show how the Rust code exposes tool schemas and then keeps execution in the host.",
          "Mention the teaching types: Conversation carries the prompt, AgentLoop runs the sequence, HookContext describes each hook event.",
          "Rubber duck review: identify where approval happens before the tool registry executes the selected tool."
        )
      },
      {
        className: "compact-slide code-walkthrough-slide",
        html: `
          <h2>Local file question with user veto</h2>
          <div class="walkthrough-grid local-file-grid">
            <article class="source-card">
              <h3>Allowed flow</h3>
              <pre><code>just rust-demo mini-copilot-ask

plan_tool_call(prompt)
  -&gt; read_file({"path":"service_status.md"})

read_file canonicalizes the path,
rejects ../ traversal and symlink escapes,
then returns file content.</code></pre>
            </article>
            <article class="source-card">
              <h3>Veto flow</h3>
              <pre><code>just rust-demo mini-copilot-veto

POST /ask
{
  "prompt": "Summarize service_status.md",
  "veto_file_access": true
}</code></pre>
            </article>
          </div>
          <p class="callout">The veto happens before the file tool runs, so no local file content is read or returned when the user denies access.</p>
        `,
        notes: speakerNotes(
          "This is the safety story for local context: path scope plus explicit user veto.",
          "For the allowed flow, explain canonicalization and symlink rejection before reading the file.",
          "For the veto flow, stress that the error happens before file content is accessed."
        )
      }
    ]
  },
  {
    html: `
      <h2>Mini-agent surfaces</h2>
      <div class="cards">
        <article><h3>Core crate</h3><p>Agent loop, hook registry, tool registry, transcript.</p></article>
        <article><h3>CLI</h3><p><code>just rust-demo mini-copilot-ask</code></p></article>
        <article><h3>HTTP</h3><p><code>just http-demo ask</code>, <code>just http-demo hooks</code>, <code>just http-demo health</code></p></article>
      </div>
    `,
    notes: speakerNotes(
      "Summarize the three consumption surfaces: library, command line, and HTTP API.",
      "Point out that all surfaces share the same core agent loop and scoped file tools.",
      "Rubber duck review: if behavior changes, it should change in mini-copilot-core, not separately in CLI and HTTP."
    )
  },
  {
    className: "compact-slide just-options-slide",
    html: `
      <h2>Run it locally: all just recipes</h2>
      <div class="just-command-grid">
        <article>
          <h3>Slides</h3>
          <code>just install</code>
          <code>just slides</code>
          <code>just build-slides</code>
          <code>just preview</code>
        </article>
        <article>
          <h3>OpenAI curl</h3>
          <code>just curl-demo list</code>
          <code>just curl-demo &lt;name&gt;</code>
          <code>just curl-dry-run list</code>
          <code>just curl-dry-run &lt;name&gt;</code>
        </article>
        <article>
          <h3>Rust</h3>
          <code>just rust-build</code>
          <code>just rust-test</code>
          <code>just rust-demo list</code>
          <code>just rust-demo &lt;name&gt;</code>
          <code>just rust-http</code>
        </article>
        <article>
          <h3>HTTP + checks</h3>
          <code>just http-demo list</code>
          <code>just http-demo &lt;name&gt;</code>
          <code>just check</code>
        </article>
      </div>
      <p class="callout">Use <code>list</code> to discover the concrete demo names. Live model calls are optional; dry-run mode keeps the workshop deterministic.</p>
    `,
    notes: speakerNotes(
      "This slide should match the top-level justfile recipes so the presenter can discover every runnable path from one place.",
      "Explain that recipes with <name> are parameterized and that the vertical child slide lists the valid demo names.",
      "Rubber duck review: if a new demo is added later, either the list command or this slide must be updated so docs and slides do not drift."
    ),
    children: [
      {
        className: "compact-slide just-options-slide",
        html: `
          <h2>Demo option names</h2>
          <div class="just-demo-grid">
            <article>
              <h3><code>just curl-demo &lt;name&gt;</code></h3>
              ${demoOptionLink("01-basic-chat")}
              ${demoOptionLink("02-tool-schema")}
              ${demoOptionLink("03-tool-result-roundtrip")}
            </article>
            <article>
              <h3><code>just rust-demo &lt;name&gt;</code></h3>
              ${demoOptionLink("genai-tool-basic")}
              ${demoOptionLink("genai-tool-roundtrip")}
              ${demoOptionLink("genai-tool-basic-live")}
              ${demoOptionLink("genai-tool-roundtrip-live")}
              ${demoOptionLink("mini-copilot-agent-loop")}
              ${demoOptionLink("mini-copilot-hooks")}
              ${demoOptionLink("mini-copilot-ask")}
              ${demoOptionLink("mini-copilot-veto")}
              ${demoOptionLink("mini-copilot-http")}
              ${demoOptionLink("mini-copilot-cli")}
            </article>
            <article>
              <h3><code>just http-demo &lt;name&gt;</code></h3>
              ${demoOptionLink("health")}
              ${demoOptionLink("agent-loop")}
              ${demoOptionLink("hooks")}
              ${demoOptionLink("ask")}
              ${demoOptionLink("veto")}
            </article>
          </div>
          <p class="callout">Click a demo name to open its transcript page. Start the HTTP server first with <code>just rust-demo mini-copilot-http</code>, then run the <code>just http-demo</code> commands from another terminal.</p>
        `,
        notes: speakerNotes(
          "Use this vertical slide when someone asks what exact names can replace <name>.",
          "Call out that live rust-genai options require OPENAI_API_KEY and quota, while the default Rust and curl demos are dry-run safe.",
          "The veto option is expected to deny file access; the just recipe treats that denial as a successful demo."
        )
      },
      ...demoTranscripts.map(renderTranscriptSlide)
    ]
  },
  {
    className: "title-slide",
    html: `
      <p class="eyebrow">Takeaway</p>
      <h2>Agents are loops, tools are contracts, hooks are control.</h2>
      <p class="subtitle">Once the mechanism is clear, the implementation becomes ordinary software engineering.</p>
    `,
    notes: speakerNotes(
      "Close by restating the three core ideas: loops coordinate, tools define contracts, hooks enforce control.",
      "Invite the audience to inspect the source links and run the deterministic demos after the session."
    )
  }
];

const renderSlideContent = (slide: Slide): string => `
  <section${slide.className ? ` class="${slide.className}"` : ""}>
    ${slide.html}
    ${slide.notes ? `<aside class="notes">${slide.notes}</aside>` : ""}
  </section>
`;

const renderSlide = (slide: Slide): string => {
  if (!slide.children?.length) {
    return renderSlideContent(slide);
  }

  return `
    <section>
      ${renderSlideContent(slide)}
      ${slide.children.map(renderSlide).join("\n")}
    </section>
  `;
};

const slidesElement = document.querySelector<HTMLDivElement>("#slides");

if (!slidesElement) {
  throw new Error("Could not find #slides container");
}

slidesElement.innerHTML = slides.map(renderSlide).join("\n");

const deck = new Reveal({
  hash: true,
  margin: 0.06,
  slideNumber: "c/t",
  transition: "slide",
  plugins: [Notes]
});

await deck.initialize();

document.addEventListener("click", (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
    "[data-message-target]"
  );

  if (!link) {
    return;
  }

  const target = document.getElementById(link.dataset.messageTarget ?? "");

  if (!target) {
    return;
  }

  event.preventDefault();

  document
    .querySelectorAll(
      ".message-detail.is-selected, .sequence-message.is-selected, .message-detail-anchor.is-selected, .notice-link.is-selected"
    )
    .forEach((element) => element.classList.remove("is-selected"));

  document
    .querySelectorAll(`[data-message-target="${link.dataset.messageTarget}"]`)
    .forEach((element) => element.classList.add("is-selected"));

  target.classList.add("is-selected");
  target.scrollIntoView({ block: "nearest", behavior: "smooth" });
});

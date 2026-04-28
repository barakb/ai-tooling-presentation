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

const slides: Slide[] = [
  {
    className: "title-slide",
    html: `
      <p class="eyebrow">R&D learning session</p>
      <h1>LLM Tooling, Agent Loops, and Hooks</h1>
      <p class="subtitle">From raw REST calls to a mini Copilot-style agent in Rust</p>
      <p class="meta">Reveal.js + curl + rust-genai</p>
    `,
    notes:
      "Set the promise: this is not a high-level AI talk. We will look at the wire format, then build up to an agent loop."
  },
  {
    html: `
      <h2>What we will build</h2>
      <div class="cards">
        <article><h3>1. Mental model</h3><p>Agent loop, tool calls, tool results, and hooks.</p></article>
        <article><h3>2. Provider syntax</h3><p>OpenAI runnable examples, plus Claude and Gemini comparisons.</p></article>
        <article><h3>3. Rust implementation</h3><p>rust-genai examples and a mini Copilot-style API.</p></article>
      </div>
    `
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
    `
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
    `,
    notes:
      "Rubber duck review: can we explain every box without saying magic? The important point is that tool execution is outside the model."
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
    `
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
    `
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
    `
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
    notes:
      "Keep this as a translation table. Do not imply exact feature parity between providers."
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
    children: [
      {
        className: "compact-slide message-flow-slide",
        html: `
          <h2>Example messages between participants</h2>
          <table class="message-table">
            <thead><tr><th>Stage</th><th>Participants</th><th>Example message</th></tr></thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>User -&gt; Host</td>
                <td><code>Is the payments-api service healthy right now?</code></td>
              </tr>
              <tr>
                <td>2</td>
                <td>Host -&gt; Model</td>
                <td><code>messages=[user question], tools=[get_service_status schema]</code></td>
              </tr>
              <tr>
                <td>3</td>
                <td>Model -&gt; Host</td>
                <td><code>assistant.tool_calls[0] = get_service_status({"service":"payments-api"})</code></td>
              </tr>
              <tr>
                <td>4</td>
                <td>Host &lt;-&gt; Tool</td>
                <td><code>execute get_service_status -&gt; {"status":"degraded","latency_ms":420}</code></td>
              </tr>
              <tr>
                <td>5</td>
                <td>Host -&gt; Model</td>
                <td><code>role=tool, tool_call_id=call_demo_status, content=status JSON</code></td>
              </tr>
              <tr>
                <td>6</td>
                <td>Model -&gt; User</td>
                <td><code>payments-api is degraded; database failover is in progress.</code></td>
              </tr>
            </tbody>
          </table>
          <p class="callout">The model never executes the tool. The host does, then reports the result back.</p>
        `
      }
    ]
  },
  {
    html: `
      <h2>rust-genai maps the same loop</h2>
      <pre><code>let tool = Tool::new("get_service_status")
    .with_description("Return service health by name")
    .with_schema(schema);

let req = ChatRequest::from_user(question).with_tools(vec![tool]);
let response = client.exec_chat(model, req, None).await?;</code></pre>
      <p>The Rust code changes the ergonomics, not the core protocol idea.</p>
    `
  },
  {
    html: `
      <h2>Mini Copilot-style API</h2>
      <img class="diagram" src="${miniCopilotDiagram}" alt="Mini Copilot architecture diagram" />
      <p>Small enough to teach, real enough to demonstrate the agent loop and hooks.</p>
    `
  },
  {
    html: `
      <h2>Mini-agent surfaces</h2>
      <div class="cards">
        <article><h3>Core crate</h3><p>Agent loop, hook registry, tool registry, transcript.</p></article>
        <article><h3>CLI</h3><p><code>mini-copilot ask "summarize"</code></p></article>
        <article><h3>HTTP</h3><p><code>POST /ask</code>, <code>POST /demo/hooks</code>, <code>GET /health</code></p></article>
      </div>
    `
  },
  {
    html: `
      <h2>Rubber duck review checklist</h2>
      <ul>
        <li>Can I explain this step without hidden assumptions?</li>
        <li>Does the slide match the code and command?</li>
        <li>Where does validation happen?</li>
        <li>What would fail during a live demo?</li>
        <li>Can this run without an API key in dry-run mode?</li>
      </ul>
    `
  },
  {
    html: `
      <h2>Run it locally</h2>
      <pre><code>just install
just slides
just curl-dry-run 03-tool-result-roundtrip
just rust-demo mini-copilot-cli
just check</code></pre>
      <p class="callout">Live model calls are optional; dry-run mode keeps the workshop deterministic.</p>
    `
  },
  {
    className: "title-slide",
    html: `
      <p class="eyebrow">Takeaway</p>
      <h2>Agents are loops, tools are contracts, hooks are control.</h2>
      <p class="subtitle">Once the mechanism is clear, the implementation becomes ordinary software engineering.</p>
    `
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

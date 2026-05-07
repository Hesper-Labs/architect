// Demo project, sample data, and the initial canvas + spec the editor opens with.
// This is the "Pulse — Habit tracker" example a new user sees on first run.

const SAMPLE_PROJECTS = [
  {
    id: "p1",
    name: "Pulse — Habit tracker",
    desc: "iOS + web app, offline-first sync",
    updated: "2 hours ago",
    status: "live",
    tags: ["Mobile", "SwiftUI", "Supabase"],
    progress: 72,
  },
  {
    id: "p2",
    name: "Ledger Studio",
    desc: "Finance dashboard for indie founders",
    updated: "Yesterday",
    status: "review",
    tags: ["SaaS", "Next.js", "Postgres"],
    progress: 48,
  },
  {
    id: "p3",
    name: "Cartograph",
    desc: "Real-time multiplayer map editor",
    updated: "3 days ago",
    status: "draft",
    tags: ["Realtime", "WebSocket", "Redis"],
    progress: 24,
  },
  {
    id: "p4",
    name: "Quill — AI writing",
    desc: "Collaborative document AI assistant",
    updated: "Last week",
    status: "live",
    tags: ["AI", "Next.js", "OpenAI"],
    progress: 91,
  },
  {
    id: "p5",
    name: "Tessera CMS",
    desc: "Headless CMS for design systems",
    updated: "Last week",
    status: "draft",
    tags: ["CMS", "GraphQL", "TypeScript"],
    progress: 12,
  },
];

const SAMPLE_TEMPLATES = [
  {
    id: "t1",
    name: "SaaS web app",
    desc: "Next.js + Postgres + auth — the classic stack.",
    tags: ["Next.js", "Auth", "Postgres"],
    category: "Web",
  },
  {
    id: "t2",
    name: "Mobile-first social",
    desc: "React Native + Supabase realtime + push.",
    tags: ["RN", "Realtime"],
    category: "Mobile",
  },
  {
    id: "t3",
    name: "Internal dashboard",
    desc: "Read-heavy admin panel with role-based access.",
    tags: ["Admin", "RBAC"],
    category: "Web",
  },
  {
    id: "t4",
    name: "AI agent app",
    desc: "Tool-calling chat interface with vector store.",
    tags: ["AI", "RAG", "Vectors"],
    category: "AI",
  },
  {
    id: "t5",
    name: "Marketplace",
    desc: "Two-sided market with payments and reviews.",
    tags: ["Stripe", "Search"],
    category: "Web",
  },
  {
    id: "t6",
    name: "API microservice",
    desc: "Stateless service with queue + worker.",
    tags: ["Go", "Queue"],
    category: "Backend",
  },
  {
    id: "t7",
    name: "Browser extension",
    desc: "MV3 extension with content + background scripts.",
    tags: ["Extension", "MV3"],
    category: "Tools",
  },
  {
    id: "t8",
    name: "CLI tool",
    desc: "Cross-platform CLI with config + plugins.",
    tags: ["CLI", "Node"],
    category: "Tools",
  },
];

// Initial canvas nodes for the editor — system architecture for "Pulse"
const INITIAL_NODES = [
  {
    id: "n1",
    kind: "user",
    type: "user",
    x: 60,
    y: 80,
    label: "iOS Client",
    sub: "SwiftUI · iOS 17+",
  },
  {
    id: "n2",
    kind: "user",
    type: "user",
    x: 60,
    y: 220,
    label: "Web Client",
    sub: "Next.js 14 · App Router",
  },
  {
    id: "n3",
    kind: "svc",
    type: "api",
    x: 320,
    y: 150,
    label: "API Gateway",
    sub: "Edge · Cloudflare Workers",
  },
  {
    id: "n4",
    kind: "svc",
    type: "fn",
    x: 560,
    y: 60,
    label: "Auth Service",
    sub: "JWT · OAuth providers",
  },
  {
    id: "n5",
    kind: "svc",
    type: "fn",
    x: 560,
    y: 180,
    label: "Habits Service",
    sub: "Streaks · reminders",
  },
  {
    id: "n6",
    kind: "svc",
    type: "fn",
    x: 560,
    y: 300,
    label: "Sync Engine",
    sub: "CRDT · offline merge",
  },
  {
    id: "n7",
    kind: "db",
    type: "db",
    x: 820,
    y: 130,
    label: "Postgres",
    sub: "users · habits · logs",
  },
  {
    id: "n8",
    kind: "db",
    type: "cloud",
    type2: "cache",
    x: 820,
    y: 260,
    label: "Redis",
    sub: "sessions · rate-limit",
  },
  {
    id: "n9",
    kind: "queue",
    type: "queue",
    x: 820,
    y: 390,
    label: "Job Queue",
    sub: "reminders · digests",
  },
  { id: "n10", kind: "ext", type: "cloud", x: 320, y: 360, label: "Push Notif", sub: "APNs · FCM" },
];

const INITIAL_EDGES = [
  { id: "e1", from: "n1", to: "n3" },
  { id: "e2", from: "n2", to: "n3" },
  { id: "e3", from: "n3", to: "n4" },
  { id: "e4", from: "n3", to: "n5" },
  { id: "e5", from: "n3", to: "n6" },
  { id: "e6", from: "n5", to: "n7" },
  { id: "e7", from: "n4", to: "n8" },
  { id: "e8", from: "n6", to: "n7" },
  { id: "e9", from: "n5", to: "n9" },
  { id: "e10", from: "n9", to: "n10" },
];

// Spec form initial values
const INITIAL_SPEC = {
  overview: {
    name: "Pulse",
    tagline: "A habit tracker that respects your time.",
    description:
      "Pulse is an offline-first habit tracker for iOS and web. It tracks daily streaks, surfaces gentle nudges, and syncs across devices using a CRDT-based engine. The product is single-player at launch with optional shared accountability circles in v2.",
    goals:
      "Ship a polished v1 in 8 weeks with 3 core habit types, native iOS app, and PWA web app sharing a single API.",
  },
  stack: {
    frontend: ["SwiftUI", "Next.js 14", "TypeScript", "Tailwind"],
    backend: ["Cloudflare Workers", "Hono", "tRPC"],
    data: ["Postgres", "Redis", "Drizzle ORM"],
    infra: ["Cloudflare", "Fly.io", "GitHub Actions"],
  },
  features: [
    { id: "f1", title: "Daily habit tracking", priority: "P0", note: "Check-in, skip, undo" },
    {
      id: "f2",
      title: "Streak visualization",
      priority: "P0",
      note: "Calendar heatmap + best streak",
    },
    { id: "f3", title: "Smart reminders", priority: "P1", note: "Time-of-day + location triggers" },
    { id: "f4", title: "Shared circles", priority: "P2", note: "Post-launch · v2" },
  ],
  models: [
    { id: "m1", name: "User", fields: "id, email, name, timezone, created_at" },
    { id: "m2", name: "Habit", fields: "id, user_id, title, cadence, target, color, archived" },
    { id: "m3", name: "Log", fields: "id, habit_id, date, status, note" },
    { id: "m4", name: "Reminder", fields: "id, habit_id, time, days_of_week, channel" },
  ],
  endpoints: [
    { id: "a1", method: "GET", path: "/v1/habits" },
    { id: "a2", method: "POST", path: "/v1/habits" },
    { id: "a3", method: "PUT", path: "/v1/habits/:id" },
    { id: "a4", method: "DELETE", path: "/v1/habits/:id" },
    { id: "a5", method: "POST", path: "/v1/habits/:id/check-in" },
    { id: "a6", method: "GET", path: "/v1/sync" },
  ],
  stories: [
    {
      id: "s1",
      text: "As a user, I can create a habit with a title and daily cadence in under 10 seconds.",
    },
    {
      id: "s2",
      text: "As a user, I can mark a habit done with a single tap from the home screen.",
    },
    { id: "s3", text: "As a user, I see my streak update immediately even when offline." },
  ],
  constraints: {
    musts: ["Offline-first", "Sub-100ms check-in latency", "WCAG 2.1 AA"],
    nonGoals: ["Social feed", "Gamification w/ points or badges", "Native Android (post-v1)"],
  },
  conventions: {
    style: "Functional components, no classes. Server state via tRPC + React Query. No Redux.",
    naming: "kebab-case for files, PascalCase for components, snake_case for DB columns.",
    testing: "Vitest for unit, Playwright for E2E. Target 70% coverage on services.",
  },
  deploy: {
    envs: ["dev", "staging", "production"],
    notes: "Preview deploys per PR via Cloudflare Pages. Migrations gated behind staging.",
  },
  handoff: {
    adrs: [
      {
        id: "ADR-001",
        title: "Use Cloudflare Workers for the API gateway",
        status: "accepted",
        date: 1714867200000,
        deciders: "Lead engineer",
        context:
          "The gateway sits in front of three small services and serves both the web and iOS clients. It needs to be globally low-latency and cheap to run for a solo founder.",
        decision:
          "Run the gateway on Cloudflare Workers with Hono. tRPC handles typed RPC for both clients.",
        consequences:
          "Positive: ~30 ms cold starts globally, generous free tier, no ops surface. Negative: 50 ms CPU limit forces async work into queues; smaller library ecosystem than Node.",
        alternatives: "Hono on Fly.io, plain Express on Vercel functions, AWS Lambda + API Gateway",
      },
      {
        id: "ADR-002",
        title: "Adopt CRDT-based offline-first sync",
        status: "proposed",
        date: 1715040000000,
        deciders: "Lead engineer",
        context:
          "Habit check-ins must work offline (subway, flights). Multi-device editing of the same habit needs conflict resolution.",
        decision:
          "Use a CRDT (Yjs) for habit + log state. Server is authoritative for ordering but accepts CRDT updates from any client.",
        consequences:
          "Positive: predictable conflict resolution, true offline UX. Negative: 2–3 weeks of build, vector-clock complexity, Yjs payload size on the wire.",
        alternatives: "Last-write-wins with vector clocks, Replicache, custom op-log",
      },
    ],
    risks: [
      {
        id: "R-01",
        title: "Sync engine race conditions across devices",
        likelihood: 4,
        impact: 5,
        owner: "Lead engineer",
        status: "mitigating",
        mit: "Property-based tests for conflict resolution. Production canaries on internal devices.",
      },
      {
        id: "R-02",
        title: "Push notification fatigue → uninstalls",
        likelihood: 4,
        impact: 4,
        owner: "Product",
        status: "mitigating",
        mit: "Smart timing trained on first-week patterns. Hard cap of one push per day. User-controlled quiet hours.",
      },
      {
        id: "R-03",
        title: "App Store rejection on health-data privacy",
        likelihood: 2,
        impact: 5,
        owner: "Lead engineer",
        status: "monitoring",
        mit: "All habit data is local-first by default. HealthKit opt-in only. Privacy nutrition label drafted.",
      },
    ],
  },
};

export { SAMPLE_PROJECTS, SAMPLE_TEMPLATES, INITIAL_NODES, INITIAL_EDGES, INITIAL_SPEC };

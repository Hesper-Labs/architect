// Full template presets — each generates a complete spec + canvas when picked

const TEMPLATE_PRESETS = {
  t1: {
    // SaaS web app
    spec: {
      overview: {
        name: "Acme SaaS",
        tagline: "Modern multi-tenant SaaS starter.",
        description:
          "A multi-tenant SaaS app with authentication, billing, team management, and a dashboard. Built on the classic Next.js + Postgres stack with Stripe billing and email transactional flows.",
        goals:
          "Ship a production-ready B2B SaaS in 6 weeks: auth, billing, teams, RBAC, and 3 core domain screens.",
      },
      stack: {
        frontend: ["Next.js 14", "TypeScript", "Tailwind", "shadcn/ui"],
        backend: ["Next.js API routes", "tRPC", "Auth.js"],
        data: ["Postgres", "Drizzle ORM", "Redis"],
        infra: ["Vercel", "Neon", "Stripe", "Resend"],
      },
      features: [
        {
          id: "f1",
          title: "Email + OAuth sign-in",
          priority: "P0",
          note: "Magic link, Google, GitHub",
        },
        { id: "f2", title: "Team workspaces", priority: "P0", note: "Invite, RBAC, switcher" },
        {
          id: "f3",
          title: "Stripe subscriptions",
          priority: "P0",
          note: "Free, Pro, Team tiers; webhooks",
        },
        {
          id: "f4",
          title: "Settings dashboard",
          priority: "P1",
          note: "Profile, billing, members, API keys",
        },
        { id: "f5", title: "Audit log", priority: "P2", note: "Per-workspace actions feed" },
      ],
      models: [
        { id: "m1", name: "User", fields: "id, email, name, image, created_at" },
        { id: "m2", name: "Workspace", fields: "id, name, slug, plan, created_at" },
        { id: "m3", name: "Membership", fields: "id, user_id, workspace_id, role" },
        {
          id: "m4",
          name: "Subscription",
          fields: "id, workspace_id, stripe_id, status, plan, period_end",
        },
      ],
      endpoints: [
        { id: "a1", method: "GET", path: "/api/workspaces" },
        { id: "a2", method: "POST", path: "/api/workspaces" },
        { id: "a3", method: "POST", path: "/api/workspaces/:id/invites" },
        { id: "a4", method: "POST", path: "/api/billing/checkout" },
        { id: "a5", method: "POST", path: "/api/billing/webhook" },
      ],
      stories: [
        { id: "s1", text: "As a new user, I sign up with email or Google in under 30 seconds." },
        { id: "s2", text: "As an owner, I invite teammates by email with a chosen role." },
        {
          id: "s3",
          text: "As an admin, I upgrade my workspace and Stripe applies the new plan instantly.",
        },
      ],
      constraints: {
        musts: ["GDPR data export", "SOC2-friendly audit log", "Sub-200ms API p95"],
        nonGoals: ["Self-hosting", "Mobile native", "Custom SSO/SAML at v1"],
      },
      conventions: {
        style:
          "Server components by default. Client components opt-in. Zod for runtime validation.",
        naming: "kebab-case files, PascalCase components, snake_case DB columns.",
        testing: "Vitest unit, Playwright E2E. Integration tests gate Stripe webhook handlers.",
      },
      deploy: {
        envs: ["dev", "preview", "production"],
        notes: "Vercel for app, Neon for DB. Migrations run via GitHub Action on main.",
      },
    },
    nodes: [
      { id: "n1", type: "user", x: 60, y: 100, label: "Browser", sub: "Next.js client" },
      {
        id: "n2",
        type: "api",
        x: 320,
        y: 100,
        label: "Next.js App",
        sub: "Server components + RSC",
      },
      { id: "n3", type: "fn", x: 580, y: 40, label: "Auth.js", sub: "OAuth, magic link" },
      { id: "n4", type: "fn", x: 580, y: 160, label: "tRPC API", sub: "Workspace, billing" },
      { id: "n5", type: "db", x: 840, y: 100, label: "Postgres", sub: "users, workspaces" },
      { id: "n6", type: "cloud", x: 580, y: 280, label: "Stripe", sub: "subscriptions" },
      { id: "n7", type: "cloud", x: 320, y: 280, label: "Resend", sub: "transactional email" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2", label: "https" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n2", to: "n4" },
      { id: "e4", from: "n3", to: "n5" },
      { id: "e5", from: "n4", to: "n5" },
      { id: "e6", from: "n4", to: "n6", label: "webhook" },
      { id: "e7", from: "n2", to: "n7" },
    ],
  },

  t2: {
    // Mobile-first social
    spec: {
      overview: {
        name: "Tribe",
        tagline: "Mobile-first social app with realtime feed.",
        description:
          "A mobile-first social app with realtime activity feed, push notifications, and friend graph. Optimized for low latency and offline-first interactions.",
        goals: "TestFlight in 4 weeks with feed, posting, comments, push, and offline drafts.",
      },
      stack: {
        frontend: ["React Native", "Expo", "TypeScript", "Tamagui"],
        backend: ["Supabase Edge Functions", "Postgres RLS"],
        data: ["Postgres", "Supabase Realtime"],
        infra: ["Expo EAS", "Supabase", "OneSignal"],
      },
      features: [
        {
          id: "f1",
          title: "Realtime feed",
          priority: "P0",
          note: "Live updates via Supabase channels",
        },
        { id: "f2", title: "Post + comment", priority: "P0", note: "Text, image, mentions" },
        {
          id: "f3",
          title: "Push notifications",
          priority: "P0",
          note: "Mentions, replies, follows",
        },
        { id: "f4", title: "Friend graph", priority: "P1", note: "Follow / mutual" },
        { id: "f5", title: "Offline drafts", priority: "P2", note: "MMKV storage, retry queue" },
      ],
      models: [
        { id: "m1", name: "User", fields: "id, handle, display_name, avatar_url, created_at" },
        { id: "m2", name: "Post", fields: "id, author_id, body, media_url, created_at" },
        { id: "m3", name: "Comment", fields: "id, post_id, author_id, body, created_at" },
        { id: "m4", name: "Follow", fields: "follower_id, followee_id, created_at" },
      ],
      endpoints: [
        { id: "a1", method: "GET", path: "/v1/feed" },
        { id: "a2", method: "POST", path: "/v1/posts" },
        { id: "a3", method: "POST", path: "/v1/posts/:id/comments" },
        { id: "a4", method: "POST", path: "/v1/follows" },
        { id: "a5", method: "POST", path: "/v1/push/register" },
      ],
      stories: [
        { id: "s1", text: "As a user, I see new posts appear in real time without refreshing." },
        { id: "s2", text: "As a user, I post a photo with caption in under 5 seconds." },
        { id: "s3", text: "As a user, I receive a push notification when someone replies to me." },
      ],
      constraints: {
        musts: ["Sub-1s feed update latency", "Works on iOS 16+ and Android 9+", "<50MB app size"],
        nonGoals: ["Web client at v1", "Video posts", "DMs"],
      },
      conventions: {
        style: "Functional components, hooks-only. Zustand for client state.",
        naming: "PascalCase screens, camelCase hooks, snake_case DB columns.",
        testing: "Detox for E2E, Vitest for unit. Realtime channels mocked in CI.",
      },
      deploy: {
        envs: ["dev", "preview", "production"],
        notes: "EAS builds per branch. Supabase migrations via SQL files in repo.",
      },
    },
    nodes: [
      { id: "n1", type: "user", x: 60, y: 80, label: "iOS App", sub: "React Native" },
      { id: "n2", type: "user", x: 60, y: 220, label: "Android App", sub: "React Native" },
      { id: "n3", type: "api", x: 340, y: 150, label: "Supabase API", sub: "PostgREST + RLS" },
      { id: "n4", type: "fn", x: 600, y: 60, label: "Edge Functions", sub: "feed, push" },
      { id: "n5", type: "db", x: 600, y: 200, label: "Postgres", sub: "RLS-secured" },
      { id: "n6", type: "queue", x: 600, y: 340, label: "Realtime", sub: "channels" },
      { id: "n7", type: "cloud", x: 860, y: 150, label: "OneSignal", sub: "push" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n3" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
      { id: "e4", from: "n3", to: "n5" },
      { id: "e5", from: "n5", to: "n6" },
      { id: "e6", from: "n4", to: "n7" },
    ],
  },

  t4: {
    // AI agent app
    spec: {
      overview: {
        name: "Lattice",
        tagline: "AI agent with tool-calling and RAG.",
        description:
          "A chat-based AI agent that calls tools (search, code, files) and grounds answers in a vector store. Built around streaming responses and durable conversation history.",
        goals:
          "Ship a single-tenant agent app with 5 tools, RAG over user documents, and a clean chat UI in 5 weeks.",
      },
      stack: {
        frontend: ["Next.js 14", "TypeScript", "Tailwind", "shadcn/ui"],
        backend: ["Next.js API routes", "AI SDK", "LangChain"],
        data: ["Postgres", "pgvector", "Redis"],
        infra: ["Vercel", "Neon", "Anthropic API"],
      },
      features: [
        { id: "f1", title: "Streaming chat", priority: "P0", note: "SSE, mid-stream cancellation" },
        {
          id: "f2",
          title: "Tool calling",
          priority: "P0",
          note: "search, fetch, code, files, calendar",
        },
        {
          id: "f3",
          title: "RAG over documents",
          priority: "P0",
          note: "PDF/MD upload, pgvector retrieval",
        },
        {
          id: "f4",
          title: "Conversation history",
          priority: "P1",
          note: "Branching, search, export",
        },
        {
          id: "f5",
          title: "Usage analytics",
          priority: "P2",
          note: "Tokens, latency, tool hit rate",
        },
      ],
      models: [
        { id: "m1", name: "User", fields: "id, email, name, created_at" },
        { id: "m2", name: "Conversation", fields: "id, user_id, title, model, created_at" },
        {
          id: "m3",
          name: "Message",
          fields: "id, conversation_id, role, content, tool_calls, created_at",
        },
        { id: "m4", name: "Document", fields: "id, user_id, name, uri, chunks_count" },
        { id: "m5", name: "Embedding", fields: "id, document_id, chunk, vector, position" },
      ],
      endpoints: [
        { id: "a1", method: "POST", path: "/api/chat" },
        { id: "a2", method: "GET", path: "/api/conversations" },
        { id: "a3", method: "POST", path: "/api/documents" },
        { id: "a4", method: "POST", path: "/api/documents/:id/embed" },
      ],
      stories: [
        { id: "s1", text: "As a user, I send a message and see tokens stream in within 800ms." },
        {
          id: "s2",
          text: "As a user, I upload a PDF and ask questions grounded in that document.",
        },
        { id: "s3", text: "As a user, I see which tool the agent invoked and inspect its output." },
      ],
      constraints: {
        musts: ["Token streaming", "Cancellable requests", "Per-user rate limits"],
        nonGoals: ["Voice input", "Image generation", "Agent autonomy without confirmation"],
      },
      conventions: {
        style: "Server-side streaming via Next.js Route Handlers + AI SDK.",
        naming: "Tool functions in /tools as zod-schema'd named exports.",
        testing: "Vitest for tools, Playwright for chat E2E. Mock LLM in CI.",
      },
      deploy: {
        envs: ["dev", "preview", "production"],
        notes: "Vercel + Neon + Anthropic. pgvector index rebuilt nightly.",
      },
    },
    nodes: [
      { id: "n1", type: "user", x: 60, y: 130, label: "Web Client", sub: "Next.js streaming UI" },
      { id: "n2", type: "api", x: 320, y: 130, label: "Chat API", sub: "Route Handler" },
      { id: "n3", type: "fn", x: 580, y: 40, label: "Agent Loop", sub: "tool-calling" },
      { id: "n4", type: "cloud", x: 840, y: 40, label: "Anthropic", sub: "Claude" },
      { id: "n5", type: "fn", x: 580, y: 180, label: "RAG", sub: "pgvector retrieval" },
      { id: "n6", type: "db", x: 840, y: 180, label: "Postgres", sub: "+pgvector" },
      { id: "n7", type: "fn", x: 580, y: 320, label: "Tools", sub: "search · fetch · code" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2", label: "SSE" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
      { id: "e4", from: "n3", to: "n5" },
      { id: "e5", from: "n5", to: "n6" },
      { id: "e6", from: "n3", to: "n7" },
    ],
  },
};

export { TEMPLATE_PRESETS };

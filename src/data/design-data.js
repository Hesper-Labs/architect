// Design layer — tokens, component inventory, asset library

const DESIGN_TOKENS = {
  color: [
    { name: "primary", value: "#f59e0b", role: "Primary brand · CTAs" },
    { name: "primary-ink", value: "#fbbf24", role: "Hover · active" },
    { name: "surface-0", value: "#0c0a09", role: "App background" },
    { name: "surface-1", value: "#1c1917", role: "Card surface" },
    { name: "surface-2", value: "#292524", role: "Raised surface" },
    { name: "ink-0", value: "#fafaf9", role: "Primary text" },
    { name: "ink-2", value: "#a8a29e", role: "Tertiary text" },
    { name: "success", value: "#22c55e", role: "Confirmations" },
    { name: "warning", value: "#f59e0b", role: "Caution" },
    { name: "danger", value: "#fb7185", role: "Destructive" },
  ],
  type: [
    { name: "display", value: "Instrument Serif · 32/40 · 400", sample: "Track your habits" },
    { name: "h1", value: "Inter · 24/32 · 600", sample: "Daily streaks" },
    { name: "h2", value: "Inter · 18/24 · 600", sample: "This week" },
    { name: "body", value: "Inter · 14/22 · 400", sample: "5-minute morning routine" },
    { name: "caption", value: "Inter · 12/16 · 500", sample: "5 days ago" },
    { name: "mono", value: "JetBrains Mono · 13/20 · 400", sample: "habit_id: hbt_4f8a" },
  ],
  spacing: [
    { name: "0", value: "0px" },
    { name: "1", value: "4px" },
    { name: "2", value: "8px" },
    { name: "3", value: "12px" },
    { name: "4", value: "16px" },
    { name: "5", value: "24px" },
    { name: "6", value: "32px" },
    { name: "7", value: "48px" },
    { name: "8", value: "64px" },
  ],
  radius: [
    { name: "xs", value: "4px" },
    { name: "sm", value: "6px" },
    { name: "md", value: "10px" },
    { name: "lg", value: "14px" },
    { name: "xl", value: "20px" },
    { name: "full", value: "999px" },
  ],
  shadow: [
    { name: "sm", value: "0 1px 2px rgba(0,0,0,.4)" },
    { name: "md", value: "0 8px 24px -6px rgba(0,0,0,.5)" },
    { name: "lg", value: "0 24px 60px -12px rgba(0,0,0,.7)" },
  ],
};

const COMPONENT_INVENTORY = [
  {
    category: "Layout",
    components: [
      { name: "AppShell", variants: ["default"], states: ["default"], used: 1 },
      {
        name: "Sidebar",
        variants: ["expanded", "collapsed"],
        states: ["default", "hover"],
        used: 1,
      },
      { name: "TopBar", variants: ["default"], states: ["default", "scrolled"], used: 1 },
    ],
  },
  {
    category: "Navigation",
    components: [
      {
        name: "Tabs",
        variants: ["pills", "underline"],
        states: ["default", "active", "hover"],
        used: 4,
      },
      { name: "Breadcrumb", variants: ["default"], states: ["default"], used: 2 },
      {
        name: "Menu",
        variants: ["dropdown", "context"],
        states: ["default", "hover", "disabled"],
        used: 6,
      },
    ],
  },
  {
    category: "Forms",
    components: [
      {
        name: "Input",
        variants: ["text", "number", "mono"],
        states: ["default", "focus", "filled", "disabled", "error"],
        used: 24,
      },
      {
        name: "Textarea",
        variants: ["default"],
        states: ["default", "focus", "disabled"],
        used: 8,
      },
      {
        name: "Select",
        variants: ["default", "searchable"],
        states: ["default", "open", "disabled"],
        used: 12,
      },
      {
        name: "Toggle",
        variants: ["default", "large"],
        states: ["off", "on", "disabled"],
        used: 6,
      },
      {
        name: "Checkbox",
        variants: ["default"],
        states: ["off", "on", "indeterminate", "disabled"],
        used: 9,
      },
    ],
  },
  {
    category: "Data display",
    components: [
      {
        name: "Card",
        variants: ["default", "raised", "outlined"],
        states: ["default", "hover", "selected"],
        used: 18,
      },
      { name: "Badge", variants: ["solid", "soft", "outline"], states: ["default"], used: 22 },
      { name: "Avatar", variants: ["initials", "image"], states: ["default"], used: 8 },
      { name: "List", variants: ["divided", "cards"], states: ["default"], used: 5 },
      { name: "Table", variants: ["default", "compact"], states: ["default", "sorting"], used: 3 },
    ],
  },
  {
    category: "Feedback",
    components: [
      {
        name: "Toast",
        variants: ["info", "success", "error"],
        states: ["default", "entering", "leaving"],
        used: 4,
      },
      {
        name: "Modal",
        variants: ["default", "xl"],
        states: ["closed", "entering", "open"],
        used: 5,
      },
      { name: "EmptyState", variants: ["default"], states: ["default"], used: 3 },
      { name: "Skeleton", variants: ["text", "card"], states: ["loading"], used: 7 },
    ],
  },
  {
    category: "Buttons",
    components: [
      {
        name: "Button",
        variants: ["primary", "secondary", "ghost", "danger"],
        states: ["default", "hover", "active", "disabled", "loading"],
        used: 32,
      },
      {
        name: "IconButton",
        variants: ["default", "accent"],
        states: ["default", "hover", "disabled"],
        used: 18,
      },
      { name: "Chip", variants: ["default", "on"], states: ["default", "hover"], used: 14 },
    ],
  },
];

const ASSETS = {
  logos: [
    { name: "Mark", type: "svg", size: "32×32", note: "Primary mark, 1-color" },
    { name: "Wordmark", type: "svg", size: "120×24", note: "Light + dark variants" },
    { name: "Favicon", type: "ico", size: "32×32", note: "Browser tab" },
  ],
  icons: [
    { name: "lucide", type: "set", size: "20+ icons", note: "Primary icon set · 16/20/24px" },
  ],
  illustrations: [
    { name: "Empty habit list", type: "svg", size: "240×180", note: "Onboarding illustration" },
    { name: "Streak celebration", type: "svg", size: "240×180", note: "Milestone reached" },
  ],
  images: [{ name: "Onboarding bg", type: "png", size: "1600×1000", note: "Hero gradient" }],
};

const BREAKPOINTS = [
  { name: "mobile", min: "0px", max: "639px", cols: 4, gutter: "16px" },
  { name: "tablet", min: "640px", max: "1023px", cols: 8, gutter: "20px" },
  { name: "desktop", min: "1024px", max: "1279px", cols: 12, gutter: "24px" },
  { name: "wide", min: "1280px", max: "—", cols: 12, gutter: "32px" },
];

export { DESIGN_TOKENS, COMPONENT_INVENTORY, ASSETS, BREAKPOINTS };

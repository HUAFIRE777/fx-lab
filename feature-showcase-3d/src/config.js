/* huafire3d fx-lab — original implementation */
/* Feature matrix content: edit titles/descriptions/widgets here, the page rebuilds itself. */

export const CONFIG = {
  /* bento column spans (desktop, 12-col grid). Mobile collapses to one column. */
  features: [
    {
      id: "multiplayer",
      span: 7,
      tag: "01 · COLLABORATE",
      title: "Realtime multiplayer",
      desc: "Cursors, comments, and merge conflicts resolved live. It feels like everyone is sitting at the same desk — <b>even when nobody is.</b>",
      widget: "orbiters",
    },
    {
      id: "edge",
      span: 5,
      tag: "02 · DEPLOY",
      title: "Global edge network",
      desc: "Deploys replicate to <b>34 regions in seconds.</b> Your users never wait on geography again.",
      widget: "particles",
    },
    {
      id: "analytics",
      span: 4,
      tag: "03 · MEASURE",
      title: "Analytics that explain",
      desc: "Every chart links back to the event that caused it. <b>No more guessing</b> what moved the number.",
      widget: "wave",
    },
    {
      id: "automation",
      span: 4,
      tag: "04 · AUTOMATE",
      title: "Automation rules",
      desc: "If this, then ship it. Route work, ping owners, <b>cut releases while you sleep.</b>",
      widget: "knot",
    },
    {
      id: "monitoring",
      span: 4,
      tag: "05 · OBSERVE",
      title: "Monitoring built in",
      desc: "Errors, latency, and uptime on the <b>same page</b> as the code that caused them.",
      widget: "radar",
    },
    {
      id: "security",
      span: 12,
      wide: true,
      tag: "06 · TRUST",
      title: "Security without the ticket queue",
      desc: "Compliance controls your security team can verify themselves — no chasing, no spreadsheets, no quarter-end panic.",
      checks: [
        "SSO & SCIM provisioning out of the box",
        "Immutable audit logs, exportable anytime",
        "SOC 2 Type II audited, reports on request",
      ],
      widget: "morph",
    },
  ],
};

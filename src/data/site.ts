export const SITE = {
  role: "Senior DevOps/SRE Engineer",
  handle: "SR0.OPERATOR",
  email: "sr0.operator@example.com",
  github: "https://github.com/sr0-operator",
  linkedin: "https://www.linkedin.com/in/sr0-operator",
  location: "47.3769N 08.5417E",
  tagline:
    "Turns unmanaged chaos into enforceable SLOs. Builds platforms that fail gracefully and wake nobody.",
};

export type Role = {
  title: string;
  company: string;
  period: string;
  stack: string[];
  points: string[];
};

export const EXPERIENCE: Role[] = [
  {
    title: "Senior Site Reliability Engineer",
    company: "Northbridge Systems",
    period: "2022 — PRESENT",
    stack: ["Kubernetes", "Terraform", "Prometheus", "Go", "AWS"],
    points: [
      "Owns the error budget for a 12-region platform processing 14k req/s; SLO 99.95% met 9 consecutive quarters.",
      "Cut median page-build time 41% by replacing ad-hoc Jenkins pipelines with Argo Workflows on CI runners.",
      "Wrote the on-call runbook and rotated primary incident commander for 28 months, MTTA down 3.4x.",
    ],
  },
  {
    title: "DevOps Engineer",
    company: "Relayforge Labs",
    period: "2019 — 2022",
    stack: ["Docker", "Consul", "Grafana", "GitHub Actions", "Vault"],
    points: [
      "Designed the golden-path platform: one CLI, one API, repeatable infra for 40+ microservices.",
      "Introduced policy-as-code (OPA) gates; reduced prod misconfig incidents to near zero.",
      "Moved secrets out of env files into Vault with agent-side injection and audit trails.",
    ],
  },
  {
    title: "Platform Engineer",
    company: "Cinder & Coal (acq. 2019)",
    period: "2017 — 2019",
    stack: ["AWS", "Ansible", "Python", "Postgres", "ELK"],
    points: [
      "Provisioned and hardened a SOC2-aligned network from empty account to green audit in 11 months.",
      "Built the first real staging environment; yeeted 80% of 'works on my machine' bugs.",
      "Automated database backup/restore drills including quarterly tape-to-object restore tests.",
    ],
  },
];

export type SkillGroup = { name: string; tags: string[] };

export const SKILLS: SkillGroup[] = [
  { name: "ORCHESTRATION", tags: ["Kubernetes", "Helm", "Kustomize", "OpenShift", "Nomad", "AWS ECS"] },
  { name: "INFRASTRUCTURE", tags: ["Terraform", "OpenTofu", "Pulumi", "Ansible", "CloudFormation"] },
  { name: "OBSERVABILITY", tags: ["Prometheus", "Grafana", "OpenTelemetry", "Loki", "Sentry", "Datadog"] },
  { name: "CI/CD", tags: ["GitHub Actions", "Argo CD", "Argo Workflows", "Tekton", "CircleCI", "Jenkins"] },
  { name: "CLOUD", tags: ["AWS", "GCP", "Azure", "VPC", "IAM", "Cost Allocation"] },
  { name: "PRACTICES", tags: ["SLOs", "Error Budgets", "On-Call", "Chaos Engineering", "Blameless RCAs", "Runbooks"] },
];

export type Project = {
  name: string;
  summary: string;
  stack: string[];
  status: string;
};

export const PROJECTS: Project[] = [
  {
    name: "quantum-scaler",
    summary: "Kubernetes HPA refinement that turns p99 latency + SLO burn into scale decisions; validated in staging for 5 weeks without a single pod churn spike.",
    stack: ["Go", "Kubernetes", "Prometheus", "Vertical Pod Autoscaler"],
    status: "IN PROD — 2 CLUSTERS",
  },
  {
    name: "chaos-forge",
    summary: "Scheduled chaos drill toolkit: kills a random pod/replica every Tuesday at 03:00 UTC and pages only the responsible on-call engineer.",
    stack: ["Litmus", "Argo Workflows", "SLACK webhooks", "Terraform"],
    status: "RUNNING — 9 MONTHS",
  },
  {
    name: "budget-burn",
    summary: "Error budget dashboard with predicted burn-to-expiry and auto-generated incident candidates before the pager decides for you.",
    stack: ["Prometheus Rules", "Go", "Grafana", "S3"],
    status: "INTERNAL TOOL",
  },
  {
    name: "infra-monorepo",
    summary: "One repo, one plan: 100% of Terraform modules, DRY policies, and drift detection in a single review flow.",
    stack: ["OpenTofu", "OPA", "Atlantis", "GitHub Actions"],
    status: "1.2K COMMITS / 4 REGIONS",
  },
];

export const METRICS = {
  slo: "99.95",
  window: "30 DAY ROLLING",
  uptimeNow: "99.982",
  p99: "128ms",
  p95: "74ms",
  reqRate: "14.2k /s",
  errorBudgetRemaining: "0.041",
  burnUnit: "% / 30d",
  series: [28, 30, 27, 31, 29, 33, 30, 28, 31, 34, 30, 29, 32, 36, 31, 30, 33, 29, 28, 30, 31, 30, 32, 34, 30, 29, 31, 33, 30, 32],
};

export const CONTACT = {
  email: "sr0.operator@example.com",
  github: "https://github.com/sr0-operator",
  linkedin: "https://www.linkedin.com/in/sr0-operator",
  availability: "OPEN TO PLATFORM-LEAD & PRINCIPAL SRE ROLES — REMOTE OK",
};
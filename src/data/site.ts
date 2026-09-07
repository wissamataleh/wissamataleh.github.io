export const SITE = {
  name: "Wissam Ataleh",
  handle: "WISSAM ATALEH",
  role: "Senior DevOps & Site Reliability Engineer",
  email: "wissam_ataleh@outlook.com",
  phone: "+962 79 549 9608",
  github: "https://github.com/wissamataleh",
  linkedin: "https://www.linkedin.com/in/wissamataleh",
  location: "Amman, Jordan",
  tagline:
    "8+ years architecting, automating, and scaling production-grade Kubernetes infrastructure across AWS, Azure, public cloud, and enterprise on-premises. CKA & Terraform-certified. Deep in GPU-enabled AI/ML platform engineering, zero-trust security, and high-throughput telemetry across hybrid architectures.",
  stats: [
    { label: "EXPERIENCE", value: "8+ YRS" },
    { label: "PROD CLUSTERS", value: "20+" },
    { label: "CERTIFICATIONS", value: "CKA · TERRAFORM" },
    { label: "BASED IN", value: "AMMAN, JORDAN" },
  ],
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
    title: "Senior Site Reliability Engineer II",
    company: "Careem",
    period: "Sep 2024 — May 2026 · Amman, Jordan",
    stack: ["AWS", "EKS", "Kubernetes", "Go", "Terraform", "ArgoCD", "GitHub Actions"],
    points: [
      "Architected and deployed the \"Placement Operator\", a custom Go Kubernetes controller automating pod placement and PDB-aware workload rotation across 14 clusters and hundreds of services — with zero downtime.",
      "Optimized multi-cluster AWS environments using Terraform (IaC) to lower compute costs while keeping Rides, Food, and Pay verticals highly available.",
      "Defined SLI/SLO metrics, led critical incident management, and established post-mortem processes that significantly reduced MTTR.",
      "Standardized multi-cluster deployments using GitHub Actions and ArgoCD, shifting deploys to a self-service model for engineering teams.",
    ],
  },
  {
    title: "Senior DevOps Engineer",
    company: "BeyondAI (Beyond Limits)",
    period: "Oct 2021 — Sep 2024 · Glendale, CA / Remote",
    stack: ["AWS", "EKS", "AKS", "Kubernetes", "NVIDIA GPU", "Terraform", "HashiCorp Vault", "Prometheus", "Kubeflow"],
    points: [
      "Provisioned and administrated production Kubernetes clusters across private on-premises and hybrid clouds, including NVIDIA GPU nodes for deep-learning training and real-time inference.",
      "Spearheaded MLOps infrastructure with Kubeflow, MLflow, and KServe to build scalable model-serving platforms and automated feature stores.",
      "Launched hardware-isolated confidential-compute environments using Intel SGX, Gramine, and Kubernetes; enforced RBAC, network policy segmentation, and Vault secrets.",
      "Implemented end-to-end observability with Prometheus, Grafana, and Loki plus custom alerting.",
    ],
  },
  {
    title: "DevOps Engineer",
    company: "Jordan Open Source Association",
    period: "Sep 2019 — Oct 2021 · Amman, Jordan",
    stack: ["Kubernetes", "DigitalOcean", "Keycloak", "ArgoCD", "Mailu", "Nuxt.js", "Strapi"],
    points: [
      "Designed and deployed a self-managed, high-availability Kubernetes cloud hosting internal tools, mail servers, SSO identity, and CI/CD platforms.",
      "Led cross-functional developer teams to build and launch core digital platforms, including the organization's main web application and digital safety portals.",
    ],
  },
];

export const CERTIFICATIONS = [
  { name: "HashiCorp Certified: Terraform Associate", issuer: "IBM Professional Certification", year: "2026" },
  { name: "CKA: Certified Kubernetes Administrator", issuer: "The Linux Foundation", year: "2024" },
];

export const EDUCATION = [
  { degree: "Master of Science in Computer Engineering", school: "German Jordanian University", period: "2017 – 2019", location: "Amman, Jordan" },
  { degree: "Bachelor of Science in Mechatronics Engineering", school: "Al-Balqa Applied University", period: "2008 – 2013", location: "Amman, Jordan" },
];

export type SkillGroup = { name: string; tags: string[] };

export const SKILLS: SkillGroup[] = [
  { name: "CLOUD & ON-PREMISE", tags: ["AWS", "Kubernetes", "AWS EKS", "Azure AKS", "Bare-Metal K8s", "DigitalOcean", "Rancher"] },
  { name: "INFRASTRUCTURE AS CODE", tags: ["Terraform", "Ansible", "Helm", "Kustomize"] },
  { name: "OBSERVABILITY & TELEMETRY", tags: ["Prometheus", "Grafana", "OpenTelemetry", "Loki", "ELK Stack", "Dynatrace"] },
  { name: "SECURITY & GOVERNANCE", tags: ["HashiCorp Vault", "Keycloak", "RBAC", "Trivy", "SonarQube", "Kyverno", "Network Policies", "SOC 2"] },
  { name: "CI/CD & GITOPS", tags: ["GitHub Actions", "GitLab CI", "Jenkins", "ArgoCD", "FluxCD"] },
  { name: "DEVELOPMENT & SCRIPTING", tags: ["Go", "Python", "Bash", "JavaScript"] },
  { name: "AUTO-SCALING & MLOPS", tags: ["KEDA", "Kubeflow", "MLflow", "KServe"] },
  { name: "AI TOOLING & METHODOLOGIES", tags: ["Applied AI Integration", "LLMs", "LM Studio", "Ollama", "SLO/SLI", "Incident Management", "Cost Optimization"] },
];

export type Project = {
  name: string;
  summary: string;
  stack: string[];
  status: string;
};

export const PROJECTS: Project[] = [
  {
    name: "Placement Operator",
    summary: "Production-grade Go Kubernetes controller automating declarative pod placement, node-pool consolidation, and PDB-aware workload rotation across 14 production EKS clusters. Enables blue/green bulk migrations and graceful node draining with zero downtime.",
    stack: ["Go", "controller-runtime", "Kubernetes", "AWS EKS"],
    status: "IN PROD — CAREEM",
  },
  {
    name: "HashiCorp Vault Secrets Platform",
    summary: "Highly-available Vault across 3 AWS availability zones using DynamoDB/S3 backends and AWS KMS auto-unsealing, with AD SAML + Kubernetes Service Account auth. Eliminated static secrets and established full auditability across prod and non-prod.",
    stack: ["HashiCorp Vault", "Terraform", "AWS KMS", "SAML", "Kubernetes"],
    status: "BEYONDAI",
  },
  {
    name: "Multi-Environment GitOps (ArgoCD)",
    summary: "Replaced hardcoded Jenkins deployment scripts with declarative ArgoCD pipelines across Dev, QA, UAT, and Prod. Automated sync, diff tracking, single-click rollbacks, and eliminated configuration drift.",
    stack: ["ArgoCD", "GitOps", "Kubernetes", "Git"],
    status: "BEYONDAI",
  },
  {
    name: "MLOps Platform on EKS",
    summary: "Cloud-native platform for data scientists to build, train, and deploy models at scale, integrating Kubeflow and MLflow with standardized CI/CD for experimentation and automated artifact tracking.",
    stack: ["AWS EKS", "Kubeflow", "MLflow", "KServe"],
    status: "BEYONDAI",
  },
  {
    name: "Confidential Compute (Intel SGX)",
    summary: "Encrypted memory enclaves using Intel SGX chipsets, Gramine, and Kubernetes across Azure and private on-premises, enabling secure processing of AI algorithms, sensitive client data, and PII.",
    stack: ["Intel SGX", "Gramine", "Kubernetes", "Azure"],
    status: "BEYONDAI",
  },
  {
    name: "JOSA Cloud Initiative",
    summary: "Self-managed, open-source DigitalOcean Kubernetes cloud hosting Keycloak SSO, Mailu mail, Nextcloud, Jitsi, Monica CRM, and security tools — all delivered via ArgoCD and CircleCI.",
    stack: ["Kubernetes", "DigitalOcean", "Keycloak", "ArgoCD", "CircleCI"],
    status: "JOSA",
  },
  {
    name: "josa.ngo Web Platform",
    summary: "High-performance, secure digital platform built on Nuxt.js 3 (SSG/SSR) and a Strapi headless CMS, running in Docker on Kubernetes with zero-downtime automated delivery.",
    stack: ["Nuxt.js 3", "Strapi", "Docker", "Kubernetes"],
    status: "JOSA",
  },
];

export const IMPACT = {
  stats: [
    { label: "PROD CLUSTERS", value: "20+" },
    { label: "UPTIME", value: "99.99%" },
    { label: "SERVICES AUTOMATED", value: "100+" },
    { label: "MIGRATION DOWNTIME", value: "0" },
    { label: "STATIC SECRETS", value: "0" },
  ],
  points: [
    "Placement operator pushes pod placement into a Go controller — PDB-aware rotation across 14 EKS clusters and hundreds of services, zero downtime.",
    "Zero-downtime cluster upgrades and single-click rollbacks after replacing Jenkins pipelines with ArgoCD GitOps.",
    "Consolidated fragmented node pools to cut compute cost and resource waste while improving SLIs for resource-intensive workloads.",
    "Fully auditable Vault platform removed static secrets from prod and non-prod, meeting strict compliance requirements for global clients.",
  ],
};

export const CONTACT = {
  email: "wissam_ataleh@outlook.com",
  phone: "+962 79 549 9608",
  github: "https://github.com/wissamataleh",
  linkedin: "https://www.linkedin.com/in/wissamataleh",
  cv: "/WISSAM-ATALEH-DEVOPS-SRE-CV.pdf",
  availability:
    "OPEN TO SENIOR SRE / DEVOPS / PLATFORM-LEAD ROLES — AMMAN-BASED, REMOTE OK",
};
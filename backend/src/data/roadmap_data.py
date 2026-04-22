"""Static fallback roadmap data for 10 common job titles × 3 levels."""

STATIC_ROADMAPS: dict[str, dict[str, dict]] = {
    "Software Engineer": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Python basics", "Variables & data types", "Control flow"], "resources": ["Python.org docs", "freeCodeCamp Python course"]},
                {"week": 2, "topics": ["Functions", "Modules", "File I/O"], "resources": ["Real Python", "W3Schools Python"]},
                {"week": 3, "topics": ["Data structures: lists, dicts, sets"], "resources": ["CS50P Harvard", "Python Crash Course book"]},
                {"week": 4, "topics": ["OOP fundamentals", "Classes & objects"], "resources": ["Corey Schafer OOP playlist", "Python docs"]},
                {"week": 5, "topics": ["Git basics", "GitHub workflow"], "resources": ["Pro Git book", "GitHub Skills"]},
                {"week": 6, "topics": ["HTML & CSS basics", "Responsive design"], "resources": ["MDN Web Docs", "The Odin Project"]},
                {"week": 7, "topics": ["JavaScript fundamentals", "DOM manipulation"], "resources": ["javascript.info", "Eloquent JavaScript"]},
                {"week": 8, "topics": ["REST APIs", "HTTP basics", "Postman"], "resources": ["REST API Tutorial", "Postman Learning Center"]},
                {"week": 9, "topics": ["SQL basics", "PostgreSQL intro"], "resources": ["SQLBolt", "PostgreSQL Tutorial"]},
                {"week": 10, "topics": ["Build a full-stack CRUD app"], "resources": ["Full Stack Open", "The Odin Project"]},
                {"week": 11, "topics": ["Testing basics: unit tests, pytest"], "resources": ["pytest docs", "Real Python testing guide"]},
                {"week": 12, "topics": ["Deploy to cloud", "CI/CD basics"], "resources": ["Heroku Getting Started", "GitHub Actions docs"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Data structures & algorithms", "Big-O notation"], "resources": ["NeetCode.io", "CTCI book"]},
                {"week": 2, "topics": ["Design patterns: Singleton, Factory, Observer"], "resources": ["Refactoring Guru", "Head First Design Patterns"]},
                {"week": 3, "topics": ["System design fundamentals", "Scalability"], "resources": ["System Design Primer GitHub", "ByteByteGo"]},
                {"week": 4, "topics": ["Docker", "Containerization"], "resources": ["Docker Getting Started", "TechWorld with Nana Docker"]},
                {"week": 5, "topics": ["React.js / Next.js", "State management"], "resources": ["React docs", "Next.js docs"]},
                {"week": 6, "topics": ["FastAPI / Node.js backend", "Auth patterns"], "resources": ["FastAPI docs", "JWT.io"]},
                {"week": 7, "topics": ["PostgreSQL advanced", "Indexing"], "resources": ["Use The Index, Luke", "PostgreSQL docs"]},
                {"week": 8, "topics": ["Redis caching", "Message queues"], "resources": ["Redis University", "RabbitMQ Tutorials"]},
                {"week": 9, "topics": ["AWS fundamentals", "EC2, S3, RDS"], "resources": ["AWS Free Tier", "A Cloud Guru"]},
                {"week": 10, "topics": ["CI/CD pipelines", "GitHub Actions"], "resources": ["GitHub Actions docs", "DevOps Roadmap"]},
                {"week": 11, "topics": ["Code reviews", "Agile/Scrum"], "resources": ["Google Engineering Practices", "Scrum Guide"]},
                {"week": 12, "topics": ["Build & deploy a production-grade project"], "resources": ["Portfolio project ideas", "dev.to"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Distributed systems", "CAP theorem", "Consistency models"], "resources": ["Designing Data-Intensive Apps", "MIT 6.824"]},
                {"week": 2, "topics": ["Microservices architecture", "Service mesh"], "resources": ["Sam Newman Microservices", "Istio docs"]},
                {"week": 3, "topics": ["Kubernetes", "Helm charts", "Operators"], "resources": ["k8s docs", "CKAD prep"]},
                {"week": 4, "topics": ["Event-driven architecture", "Kafka"], "resources": ["Confluent Kafka docs", "Event-Driven Microservices book"]},
                {"week": 5, "topics": ["Advanced SQL", "Query optimization", "Sharding"], "resources": ["High Performance MySQL", "use-the-index-luke.com"]},
                {"week": 6, "topics": ["Observability", "Grafana, Prometheus, Jaeger"], "resources": ["OpenTelemetry docs", "Grafana Labs tutorials"]},
                {"week": 7, "topics": ["Security", "OWASP Top 10", "OAuth2 / OIDC"], "resources": ["OWASP Cheat Sheet", "Auth0 docs"]},
                {"week": 8, "topics": ["Infrastructure as Code", "Terraform"], "resources": ["Terraform Up and Running", "HashiCorp Learn"]},
                {"week": 9, "topics": ["Performance engineering", "Profiling", "Load testing"], "resources": ["Flame Graphs", "Locust docs"]},
                {"week": 10, "topics": ["Staff-level skills: technical vision", "Architecture review"], "resources": ["Staff Engineer book", "LeadDev talks"]},
                {"week": 11, "topics": ["Open source contribution", "RFC writing"], "resources": ["First Timers Only", "GitHub Explore"]},
                {"week": 12, "topics": ["Lead a full system design from scratch"], "resources": ["ByteByteGo", "Excalidraw for diagramming"]},
            ]
        },
    },
    "Data Scientist": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Python for data: NumPy, Pandas"], "resources": ["Kaggle Python course", "pandas docs"]},
                {"week": 2, "topics": ["Data cleaning & EDA"], "resources": ["Kaggle courses", "Towards Data Science"]},
                {"week": 3, "topics": ["Statistics basics: mean, variance, distributions"], "resources": ["StatQuest YouTube", "Khan Academy Stats"]},
                {"week": 4, "topics": ["Visualisation: Matplotlib, Seaborn"], "resources": ["Seaborn docs", "Python Graph Gallery"]},
                {"week": 5, "topics": ["ML fundamentals: supervised vs unsupervised"], "resources": ["Google ML Crash Course", "fast.ai intro"]},
                {"week": 6, "topics": ["Regression & classification models"], "resources": ["Scikit-learn docs", "Hands-On ML book"]},
                {"week": 7, "topics": ["Model evaluation: accuracy, precision, recall, F1"], "resources": ["Scikit-learn metrics docs", "StatQuest"]},
                {"week": 8, "topics": ["SQL for data scientists"], "resources": ["Mode SQL Tutorial", "W3Schools SQL"]},
                {"week": 9, "topics": ["Feature engineering basics"], "resources": ["Feature Engineering for ML book", "Kaggle"]},
                {"week": 10, "topics": ["Jupyter Notebooks best practices"], "resources": ["Jupyter docs", "Real Python"]},
                {"week": 11, "topics": ["Your first Kaggle competition"], "resources": ["Kaggle competitions", "Kaggle forums"]},
                {"week": 12, "topics": ["Build a portfolio project"], "resources": ["Towards Data Science", "datascienceportfol.io"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Advanced Pandas: groupby, merge, pivot"], "resources": ["Pandas cookbook", "Real Python"]},
                {"week": 2, "topics": ["Probability theory", "Bayesian thinking"], "resources": ["Think Bayes book", "3Blue1Brown stats"]},
                {"week": 3, "topics": ["Neural networks fundamentals", "Backpropagation"], "resources": ["3Blue1Brown NN series", "fast.ai"]},
                {"week": 4, "topics": ["PyTorch / TensorFlow basics"], "resources": ["PyTorch tutorials", "TensorFlow playground"]},
                {"week": 5, "topics": ["NLP basics: tokenization, embeddings"], "resources": ["Hugging Face course", "NLTK book"]},
                {"week": 6, "topics": ["Computer Vision basics: CNNs"], "resources": ["CS231n Stanford", "fast.ai vision"]},
                {"week": 7, "topics": ["Time series analysis"], "resources": ["Prophet docs", "statsmodels.org"]},
                {"week": 8, "topics": ["MLOps basics: model versioning, experiment tracking"], "resources": ["MLflow docs", "Weights & Biases"]},
                {"week": 9, "topics": ["Cloud ML: AWS SageMaker / GCP Vertex AI"], "resources": ["AWS SageMaker docs", "Google Vertex AI quickstart"]},
                {"week": 10, "topics": ["A/B testing & causal inference"], "resources": ["Trustworthy Online Experiments book", "Stats YouTube"]},
                {"week": 11, "topics": ["Storytelling with data", "Tableau / Power BI"], "resources": ["Storytelling with Data book", "Tableau Public"]},
                {"week": 12, "topics": ["End-to-end ML project with deployment"], "resources": ["Made With ML", "Gradio docs"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Deep learning: transformers architecture"], "resources": ["Attention Is All You Need paper", "Andrej Karpathy lectures"]},
                {"week": 2, "topics": ["LLMs: fine-tuning, RLHF, LoRA"], "resources": ["Hugging Face PEFT", "DeepLearning.AI courses"]},
                {"week": 3, "topics": ["Distributed training", "Multi-GPU setups"], "resources": ["PyTorch Distributed docs", "DeepSpeed"]},
                {"week": 4, "topics": ["Causal ML", "Uplift modeling"], "resources": ["The Book of Why", "EconML docs"]},
                {"week": 5, "topics": ["Advanced MLOps: CI/CD for ML", "Kubeflow"], "resources": ["Kubeflow docs", "Evidently AI"]},
                {"week": 6, "topics": ["Data engineering pipelines", "Spark"], "resources": ["Spark docs", "dbt docs"]},
                {"week": 7, "topics": ["Research methodology", "Paper reading"], "resources": ["Papers With Code", "Arxiv Sanity"]},
                {"week": 8, "topics": ["Responsible AI", "Fairness & bias mitigation"], "resources": ["AI Fairness 360", "Google PAIR"]},
                {"week": 9, "topics": ["Real-time ML", "Feature stores"], "resources": ["Feast docs", "Tecton.ai blog"]},
                {"week": 10, "topics": ["Contribute to open-source ML project"], "resources": ["Hugging Face GitHub", "scikit-learn contributing guide"]},
                {"week": 11, "topics": ["Technical leadership in data science"], "resources": ["Becoming a Data Head book", "LeadDev talks"]},
                {"week": 12, "topics": ["Publish a research blog or Kaggle notebook"], "resources": ["Towards Data Science", "Kaggle notebooks"]},
            ]
        },
    },
    "Frontend Developer": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["HTML5 structure", "Semantic elements"], "resources": ["MDN HTML Guide", "The Odin Project HTML"]},
                {"week": 2, "topics": ["CSS fundamentals", "Box model", "Flexbox"], "resources": ["CSS-Tricks", "Flexbox Froggy"]},
                {"week": 3, "topics": ["CSS Grid", "Responsive design", "Media queries"], "resources": ["Grid Garden", "MDN CSS Grid"]},
                {"week": 4, "topics": ["JavaScript: variables, control flow, functions"], "resources": ["javascript.info", "Eloquent JS"]},
                {"week": 5, "topics": ["DOM manipulation", "Events"], "resources": ["javascript.info DOM", "MDN Web Docs"]},
                {"week": 6, "topics": ["ES6+: arrow functions, destructuring, promises"], "resources": ["javascript.info", "You Don't Know JS"]},
                {"week": 7, "topics": ["Fetch API", "REST API integration"], "resources": ["MDN Fetch API", "JSONPlaceholder practice"]},
                {"week": 8, "topics": ["React fundamentals: JSX, components, props"], "resources": ["React.dev tutorial", "Scrimba React"]},
                {"week": 9, "topics": ["React state & hooks: useState, useEffect"], "resources": ["React docs", "Jack Herrington YouTube"]},
                {"week": 10, "topics": ["Git, GitHub, project structure"], "resources": ["Pro Git", "GitHub Skills"]},
                {"week": 11, "topics": ["Build a portfolio site from scratch"], "resources": ["Frontend Mentor", "Dribbble inspiration"]},
                {"week": 12, "topics": ["Deploy to Vercel / Netlify"], "resources": ["Vercel docs", "Netlify docs"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["TypeScript fundamentals", "Types & interfaces"], "resources": ["TypeScript docs", "Matt Pocock tutorials"]},
                {"week": 2, "topics": ["Next.js: SSR, SSG, App Router"], "resources": ["Next.js docs", "Jack Herrington Next.js series"]},
                {"week": 3, "topics": ["State management: Zustand / Redux Toolkit"], "resources": ["Zustand docs", "Redux docs"]},
                {"week": 4, "topics": ["React Query / SWR for data fetching"], "resources": ["TanStack Query docs", "SWR docs"]},
                {"week": 5, "topics": ["TailwindCSS", "Design systems"], "resources": ["Tailwind docs", "shadcn/ui"]},
                {"week": 6, "topics": ["Testing: Vitest, Testing Library"], "resources": ["Vitest docs", "Testing Library docs"]},
                {"week": 7, "topics": ["Web performance: Core Web Vitals", "Lighthouse"], "resources": ["web.dev", "Chrome DevTools"]},
                {"week": 8, "topics": ["Accessibility: WCAG", "ARIA attributes"], "resources": ["a11y Project", "WebAIM"]},
                {"week": 9, "topics": ["GraphQL basics", "Apollo Client"], "resources": ["GraphQL.org", "Apollo docs"]},
                {"week": 10, "topics": ["Animations: Framer Motion / GSAP"], "resources": ["Framer Motion docs", "GSAP docs"]},
                {"week": 11, "topics": ["Monorepos: Turborepo / Nx"], "resources": ["Turborepo docs", "Nx docs"]},
                {"week": 12, "topics": ["Ship a production Next.js app"], "resources": ["Vercel", "Planetscale or Supabase"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["React internals: reconciliation, Fiber"], "resources": ["React source code", "Jser.io blog"]},
                {"week": 2, "topics": ["Micro-frontends architecture"], "resources": ["Module Federation docs", "micro-frontends.org"]},
                {"week": 3, "topics": ["Web performance deep dive: RAIL model"], "resources": ["web.dev performance", "Alex Russell talks"]},
                {"week": 4, "topics": ["WebAssembly basics"], "resources": ["WebAssembly.org", "Lin Clark blog"]},
                {"week": 5, "topics": ["Edge computing", "Cloudflare Workers"], "resources": ["Cloudflare Workers docs", "Vercel Edge"]},
                {"week": 6, "topics": ["Browser rendering pipeline", "Paint, Layout, Composite"], "resources": ["Inside Look at Browser", "Chrome DevTools blog"]},
                {"week": 7, "topics": ["Design systems at scale", "Storybook"], "resources": ["Storybook docs", "Radix UI", "CVA"]},
                {"week": 8, "topics": ["Open source UI library contribution"], "resources": ["shadcn/ui", "React Aria"]},
                {"week": 9, "topics": ["Developer tooling: custom Babel, ESLint plugins"], "resources": ["Babel plugin handbook", "ESLint docs"]},
                {"week": 10, "topics": ["PWA & offline-first", "Service Workers"], "resources": ["web.dev PWA", "Workbox docs"]},
                {"week": 11, "topics": ["Tech talks & writing", "Share expertise"], "resources": ["dev.to", "Smashing Magazine"]},
                {"week": 12, "topics": ["Lead frontend architecture for a large project"], "resources": ["Frontend Architecture book", "thoughtworks.com"]},
            ]
        },
    },
    "Backend Developer": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Python or Node.js basics"], "resources": ["Python.org", "nodejs.dev"]},
                {"week": 2, "topics": ["HTTP fundamentals", "REST principles"], "resources": ["MDN HTTP", "restfulapi.net"]},
                {"week": 3, "topics": ["FastAPI or Express.js basics"], "resources": ["FastAPI docs", "Express.js docs"]},
                {"week": 4, "topics": ["SQL basics", "CRUD operations"], "resources": ["SQLBolt", "PostgreSQL tutorial"]},
                {"week": 5, "topics": ["JSON, request validation, error handling"], "resources": ["FastAPI docs", "Joi.dev"]},
                {"week": 6, "topics": ["Authentication basics: JWT, sessions"], "resources": ["JWT.io", "Auth0 blog"]},
                {"week": 7, "topics": ["Git & version control"], "resources": ["Pro Git", "Atlassian Git"]},
                {"week": 8, "topics": ["Docker basics", "Containerize an app"], "resources": ["Docker Getting Started", "TechWorld Nana"]},
                {"week": 9, "topics": ["Environment variables", ".env management"], "resources": ["12-factor app", "dotenv docs"]},
                {"week": 10, "topics": ["REST API design: status codes, versioning"], "resources": ["Stripe API docs (example)", "Google API design guide"]},
                {"week": 11, "topics": ["Automated testing: pytest / Jest"], "resources": ["pytest docs", "Jest docs"]},
                {"week": 12, "topics": ["Deploy an API to Railway or Render"], "resources": ["Railway docs", "Render docs"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["PostgreSQL advanced: indexes, joins, CTEs"], "resources": ["Use The Index Luke", "Postgres docs"]},
                {"week": 2, "topics": ["ORMs: SQLAlchemy / Prisma async patterns"], "resources": ["SQLAlchemy docs", "Prisma docs"]},
                {"week": 3, "topics": ["Redis: caching, sessions, pub/sub"], "resources": ["Redis University", "Redis docs"]},
                {"week": 4, "topics": ["Message queues: Celery + Redis or BullMQ"], "resources": ["Celery docs", "BullMQ docs"]},
                {"week": 5, "topics": ["API security: rate limiting, OWASP Top 10"], "resources": ["OWASP cheat sheet", "slowapi docs"]},
                {"week": 6, "topics": ["gRPC & Protocol Buffers"], "resources": ["gRPC docs", "Protobuf docs"]},
                {"week": 7, "topics": ["WebSockets real-time"], "resources": ["WebSocket MDN", "socket.io docs"]},
                {"week": 8, "topics": ["AWS: EC2, RDS, S3, Lambda"], "resources": ["AWS Free Tier", "A Cloud Guru"]},
                {"week": 9, "topics": ["Logging & monitoring: structlog, Prometheus"], "resources": ["structlog docs", "Prometheus quickstart"]},
                {"week": 10, "topics": ["Database migrations: Alembic / Flyway"], "resources": ["Alembic docs", "Flyway docs"]},
                {"week": 11, "topics": ["CI/CD: GitHub Actions, automated deploys"], "resources": ["GitHub Actions docs", "DevOps roadmap"]},
                {"week": 12, "topics": ["Build a production-grade REST API"], "resources": ["FastAPI best practices", "roadmap.sh backend"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Distributed systems theory: consensus, Raft"], "resources": ["DDIA book", "Raft visualization"]},
                {"week": 2, "topics": ["Event sourcing & CQRS pattern"], "resources": ["Martin Fowler blog", "Eventstoredb docs"]},
                {"week": 3, "topics": ["Kafka event streaming"], "resources": ["Confluent Kafka docs", "Kafka The Definitive Guide"]},
                {"week": 4, "topics": ["Microservices: service mesh, Istio"], "resources": ["Sam Newman book", "Istio docs"]},
                {"week": 5, "topics": ["Multi-region deployment, disaster recovery"], "resources": ["AWS Global Infrastructure", "Cloudflare blog"]},
                {"week": 6, "topics": ["Database internals: B-trees, LSM trees"], "resources": ["DDIA book", "CMU DB YouTube"]},
                {"week": 7, "topics": ["Zero-downtime deployments: blue-green, canary"], "resources": ["Martin Fowler patterns", "Argo Rollouts docs"]},
                {"week": 8, "topics": ["Performance profiling: py-spy, clinic.js"], "resources": ["py-spy docs", "Speedscope.app"]},
                {"week": 9, "topics": ["SRE practices: SLOs, SLAs, error budgets"], "resources": ["Google SRE Book", "SRE Workbook"]},
                {"week": 10, "topics": ["Security: penetration testing basics"], "resources": ["HackTheBox", "OWASP Top 10"]},
                {"week": 11, "topics": ["Open source backend contribution"], "resources": ["FastAPI GitHub", "first-timers-only"]},
                {"week": 12, "topics": ["Architect a new system from requirements"], "resources": ["ByteByteGo", "System Design Interview book"]},
            ]
        },
    },
    "DevOps Engineer": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Linux basics", "Shell scripting"], "resources": ["Linux Command Line book", "OverTheWire Bandit"]},
                {"week": 2, "topics": ["Networking fundamentals", "DNS, TCP/IP, HTTP"], "resources": ["Computer Networks course", "Julia Evans networking zines"]},
                {"week": 3, "topics": ["Git & branching strategies"], "resources": ["Pro Git", "Atlassian Gitflow"]},
                {"week": 4, "topics": ["Docker basics", "Images, containers, volumes"], "resources": ["Docker Getting Started", "TechWorld Nana"]},
                {"week": 5, "topics": ["YAML & JSON configuration"], "resources": ["YAML tutorial", "JSON Schema"]},
                {"week": 6, "topics": ["CI/CD concepts", "GitHub Actions basics"], "resources": ["GitHub Actions docs", "DevOps Roadmap"]},
                {"week": 7, "topics": ["Cloud fundamentals: AWS/GCP/Azure free tier"], "resources": ["AWS Cloud Practitioner Essentials", "GCP Training"]},
                {"week": 8, "topics": ["Nginx basics", "Reverse proxy setup"], "resources": ["Nginx beginner guide", "DigitalOcean tutorials"]},
                {"week": 9, "topics": ["Environment management: .env, secrets"], "resources": ["12-factor app", "Vault intro"]},
                {"week": 10, "topics": ["Monitoring basics: uptime, logs"], "resources": ["UptimeRobot", "Papertrail"]},
                {"week": 11, "topics": ["Deploy a containerized app end-to-end"], "resources": ["DigitalOcean App Platform", "Railway"]},
                {"week": 12, "topics": ["Write a runbook for your deployment"], "resources": ["Atlassian runbook template", "PagerDuty blog"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Kubernetes fundamentals", "Pods, Deployments, Services"], "resources": ["k8s docs", "KodeKloud"]},
                {"week": 2, "topics": ["Helm: package management for k8s"], "resources": ["Helm docs", "ArtifactHub"]},
                {"week": 3, "topics": ["Terraform: infrastructure as code"], "resources": ["Terraform Up and Running", "HashiCorp Learn"]},
                {"week": 4, "topics": ["Ansible: configuration management"], "resources": ["Ansible docs", "Jeff Geerling courses"]},
                {"week": 5, "topics": ["Prometheus & Grafana monitoring stack"], "resources": ["Prometheus docs", "Grafana Labs"]},
                {"week": 6, "topics": ["Log aggregation: ELK Stack / Loki"], "resources": ["Elastic docs", "Loki docs"]},
                {"week": 7, "topics": ["Advanced GitHub Actions: matrix, reusable workflows"], "resources": ["GitHub Actions docs", "ActionsHero"]},
                {"week": 8, "topics": ["AWS: EKS, RDS, ECR, ALB"], "resources": ["AWS Well-Architected Framework", "A Cloud Guru"]},
                {"week": 9, "topics": ["Service mesh: Istio / Linkerd"], "resources": ["Istio docs", "Linkerd docs"]},
                {"week": 10, "topics": ["Secrets management: Vault, AWS Secrets Manager"], "resources": ["Vault docs", "AWS Secrets Manager docs"]},
                {"week": 11, "topics": ["Cost optimisation: spot instances, right-sizing"], "resources": ["AWS Cost Explorer", "CAST AI blog"]},
                {"week": 12, "topics": ["Set up full observability stack for a project"], "resources": ["OpenTelemetry docs", "Grafana tutorials"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Platform engineering", "Internal developer platforms"], "resources": ["Backstage.io", "Platform Engineering book"]},
                {"week": 2, "topics": ["GitOps: ArgoCD, Flux"], "resources": ["ArgoCD docs", "Flux docs"]},
                {"week": 3, "topics": ["Multi-cluster Kubernetes management"], "resources": ["Cluster API", "Admiral docs"]},
                {"week": 4, "topics": ["eBPF for networking & observability"], "resources": ["Cilium docs", "eBPF.io"]},
                {"week": 5, "topics": ["Chaos engineering: Chaos Monkey, LitmusChaos"], "resources": ["Chaos Engineering book", "LitmusChaos docs"]},
                {"week": 6, "topics": ["FinOps: cloud cost engineering at scale"], "resources": ["FinOps Foundation", "Infracost"]},
                {"week": 7, "topics": ["Zero Trust security architecture"], "resources": ["NIST Zero Trust guide", "Cloudflare Zero Trust"]},
                {"week": 8, "topics": ["SRE: error budgets, toil reduction"], "resources": ["Google SRE Book", "SLO Book"]},
                {"week": 9, "topics": ["Kubernetes operators: custom CRDs"], "resources": ["Operator SDK", "k8s operator pattern docs"]},
                {"week": 10, "topics": ["Data platform DevOps: Spark on k8s"], "resources": ["Spark on k8s docs", "Delta Lake"]},
                {"week": 11, "topics": ["Contribute to CNCF ecosystem"], "resources": ["CNCF Landscape", "first-timers-only"]},
                {"week": 12, "topics": ["Design & present a production architecture"], "resources": ["AWS Architecture Center", "Excalidraw"]},
            ]
        },
    },
    "Machine Learning Engineer": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Python basics", "NumPy, Pandas"], "resources": ["Kaggle Python course", "NumPy docs"]},
                {"week": 2, "topics": ["Statistics: distributions, hypothesis tests"], "resources": ["StatQuest", "Khan Academy Stats"]},
                {"week": 3, "topics": ["Scikit-learn: regression, classification"], "resources": ["Scikit-learn docs", "Hands-On ML book"]},
                {"week": 4, "topics": ["Model evaluation: cross-validation, ROC"], "resources": ["Scikit-learn metrics", "StatQuest"]},
                {"week": 5, "topics": ["Feature engineering & preprocessing"], "resources": ["Feature Engineering for ML", "Kaggle"]},
                {"week": 6, "topics": ["Neural networks: perceptron, backprop"], "resources": ["3Blue1Brown NN series", "fast.ai"]},
                {"week": 7, "topics": ["PyTorch basics: tensors, autograd"], "resources": ["PyTorch tutorials", "Deep Learning with PyTorch book"]},
                {"week": 8, "topics": ["SQL for ML pipelines"], "resources": ["Mode SQL tutorial", "W3Schools"]},
                {"week": 9, "topics": ["Experiment tracking: MLflow basics"], "resources": ["MLflow docs", "DagsHub"]},
                {"week": 10, "topics": ["Build a simple ML web app with Gradio"], "resources": ["Gradio docs", "HuggingFace Spaces"]},
                {"week": 11, "topics": ["Kaggle competition entry"], "resources": ["Kaggle competitions", "Kaggle courses"]},
                {"week": 12, "topics": ["E2E project: train, evaluate, and serve a model"], "resources": ["Made With ML", "FastAPI + sklearn"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Deep learning: CNNs, RNNs, attention"], "resources": ["fast.ai part 2", "CS231n Stanford"]},
                {"week": 2, "topics": ["Transformers & BERT architecture"], "resources": ["Hugging Face course", "Illustrated Transformer"]},
                {"week": 3, "topics": ["NLP: tokenization, embeddings, fine-tuning"], "resources": ["Hugging Face NLP course", "spaCy docs"]},
                {"week": 4, "topics": ["Computer vision: detection, segmentation"], "resources": ["Roboflow blog", "ultralytics YOLO docs"]},
                {"week": 5, "topics": ["MLOps: model registry, CI/CD for ML"], "resources": ["MLflow docs", "DVC docs"]},
                {"week": 6, "topics": ["Model serving: FastAPI + Triton Inference Server"], "resources": ["Triton docs", "BentoML docs"]},
                {"week": 7, "topics": ["Hyperparameter tuning: Optuna, Ray Tune"], "resources": ["Optuna docs", "Ray Tune docs"]},
                {"week": 8, "topics": ["Distributed training: DDP with PyTorch"], "resources": ["PyTorch DDP tutorial", "Lightning AI"]},
                {"week": 9, "topics": ["Feature stores: Feast"], "resources": ["Feast docs", "Tecton blog"]},
                {"week": 10, "topics": ["Cloud ML: AWS SageMaker / Vertex AI"], "resources": ["SageMaker Studio", "Vertex AI docs"]},
                {"week": 11, "topics": ["Model monitoring: drift detection"], "resources": ["Evidently AI", "Arize AI blog"]},
                {"week": 12, "topics": ["Ship an ML product used by real users"], "resources": ["HuggingFace Spaces", "Streamlit sharing"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["LLM fine-tuning: LoRA, QLoRA, RLHF"], "resources": ["HuggingFace PEFT", "Axolotl"]},
                {"week": 2, "topics": ["RAG systems at scale"], "resources": ["LlamaIndex docs", "LangChain docs"]},
                {"week": 3, "topics": ["Reinforcement learning: PPO, DQN"], "resources": ["Spinning Up RL (OpenAI)", "Stable Baselines3"]},
                {"week": 4, "topics": ["Quantization & model compression"], "resources": ["bitsandbytes docs", "GPTQ paper"]},
                {"week": 5, "topics": ["Efficient inference: vLLM, TensorRT"], "resources": ["vLLM docs", "TensorRT docs"]},
                {"week": 6, "topics": ["ML research: reading & implementing papers"], "resources": ["Papers With Code", "Yannic Kilcher YouTube"]},
                {"week": 7, "topics": ["Multimodal models: vision-language"], "resources": ["LLaVA paper", "Flamingo paper"]},
                {"week": 8, "topics": ["Responsible AI: fairness, interpretability"], "resources": ["SHAP docs", "AI Fairness 360"]},
                {"week": 9, "topics": ["Production ML at scale: 10M+ requests"], "resources": ["Uber ML platform blog", "Airbnb ML blog"]},
                {"week": 10, "topics": ["Publish a research blog post or paper"], "resources": ["Arxiv", "Towards Data Science"]},
                {"week": 11, "topics": ["ML system design interviews"], "resources": ["Chip Huyen ML Interviews book", "ML System Design course"]},
                {"week": 12, "topics": ["Lead an ML platform team initiative"], "resources": ["LeadDev ML talks", "StaffEng"]},
            ]
        },
    },
    "Product Manager": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["PM fundamentals", "Product lifecycle"], "resources": ["Inspired by Marty Cagan", "Product School YouTube"]},
                {"week": 2, "topics": ["User research: interviews, surveys"], "resources": ["Nielsen Norman Group", "Just Enough Research book"]},
                {"week": 3, "topics": ["Defining problems: Jobs-to-be-Done"], "resources": ["Competing Against Luck book", "JTBD toolkit"]},
                {"week": 4, "topics": ["Writing PRDs & user stories"], "resources": ["Atlassian PRD template", "ProductPlan blog"]},
                {"week": 5, "topics": ["Prioritisation: MoSCoW, RICE"], "resources": ["Productboard blog", "Intercom on Product Management"]},
                {"week": 6, "topics": ["Metrics: KPIs, OKRs, north star metric"], "resources": ["Amplitude blog", "Measure What Matters book"]},
                {"week": 7, "topics": ["Agile & Scrum for PMs"], "resources": ["Scrum Guide", "Atlassian Agile Coach"]},
                {"week": 8, "topics": ["Wireframing with Figma basics"], "resources": ["Figma Learn", "Figma YouTube"]},
                {"week": 9, "topics": ["SQL basics for PMs"], "resources": ["Mode SQL tutorial", "Metabase blog"]},
                {"week": 10, "topics": ["Stakeholder management & communication"], "resources": ["Crucial Conversations book", "lenny.news"]},
                {"week": 11, "topics": ["Competitive analysis & market research"], "resources": ["Product Coalition", "CB Insights"]},
                {"week": 12, "topics": ["Build a product case study"], "resources": ["ProductHunt", "Reforge articles"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Product strategy: vision, bets, roadmap"], "resources": ["Good Strategy Bad Strategy book", "Reforge Product Strategy"]},
                {"week": 2, "topics": ["Product analytics: funnels, cohorts"], "resources": ["Amplitude Academy", "Mixpanel blog"]},
                {"week": 3, "topics": ["A/B testing for PMs"], "resources": ["Trustworthy Online Experiments", "Optimizely blog"]},
                {"week": 4, "topics": ["Pricing & monetisation strategies"], "resources": ["Monetizing Innovation book", "Stripe blog"]},
                {"week": 5, "topics": ["Growth loops & viral mechanics"], "resources": ["Reforge Growth", "Andrew Chen blog"]},
                {"week": 6, "topics": ["Working with engineering: tech debt, APIs"], "resources": ["The Phoenix Project", "Staff Engineer book"]},
                {"week": 7, "topics": ["Design thinking & UX collaboration"], "resources": ["IDEO Design Thinking", "Nielsen Norman UX"]},
                {"week": 8, "topics": ["Go-to-market for new features"], "resources": ["Crossing the Chasm", "Product-Led Growth book"]},
                {"week": 9, "topics": ["Discovery vs delivery balance"], "resources": ["Continuous Discovery Habits book", "Teresa Torres talks"]},
                {"week": 10, "topics": ["API products & developer experience"], "resources": ["Stripe API docs", "Twilio blog"]},
                {"week": 11, "topics": ["Platform vs point solution strategy"], "resources": ["Andreessen Horowitz blog", "Sequoia PM talks"]},
                {"week": 12, "topics": ["Present a full product strategy to stakeholders"], "resources": ["Lenny Rachitsky newsletter", "Mind the Product"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["CPO-level strategy", "Portfolio thinking"], "resources": ["Escaping the Build Trap", "Inspired book"]},
                {"week": 2, "topics": ["Company-level OKR design"], "resources": ["Measure What Matters", "Google re:Work"]},
                {"week": 3, "topics": ["ML/AI product thinking"], "resources": ["AI Product Institute", "Chip Huyen blog"]},
                {"week": 4, "topics": ["Regulatory & compliance for products (GDPR, AI Act)"], "resources": ["IAPP resources", "EU AI Act summary"]},
                {"week": 5, "topics": ["Building & managing PM teams"], "resources": ["High Output Management", "Become an Effective Software Engineering Manager"]},
                {"week": 6, "topics": ["M&A: product integration strategy"], "resources": ["HBR M&A articles", "Sequoia build vs buy"]},
                {"week": 7, "topics": ["Network effects at scale"], "resources": ["The Cold Start Problem book", "NFX.com"]},
                {"week": 8, "topics": ["Enterprise product: procurement, security"], "resources": ["Winning in Enterprise by Aaron Levie", "OpenView partners blog"]},
                {"week": 9, "topics": ["Platform ecosystem strategy"], "resources": ["Platform Revolution book", "a16z marketplace blog"]},
                {"week": 10, "topics": ["Thought leadership: speaking & writing"], "resources": ["Mind the Product", "Lenny's Podcast"]},
                {"week": 11, "topics": ["Coach a junior PM team"], "resources": ["Manager Tools podcast", "Radical Candor book"]},
                {"week": 12, "topics": ["Write a product vision doc for a 3-year horizon"], "resources": ["Amazon Working Backwards", "Shape Up"]},
            ]
        },
    },
    "UX Designer": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["UX fundamentals", "Design thinking process"], "resources": ["IDEO Design Thinking", "Interaction Design Foundation"]},
                {"week": 2, "topics": ["User research: interviews, personas"], "resources": ["Nielsen Norman Group", "Just Enough Research"]},
                {"week": 3, "topics": ["Information architecture", "Card sorting"], "resources": ["IA Institute", "OptimalSort"]},
                {"week": 4, "topics": ["Wireframing basics with Figma"], "resources": ["Figma Learn", "Figma YouTube channel"]},
                {"week": 5, "topics": ["Usability testing basics"], "resources": ["Nielsen Usability Heuristics", "Maze.co"]},
                {"week": 6, "topics": ["Visual design: typography, colour theory"], "resources": ["Refactoring UI book", "Canva Design School"]},
                {"week": 7, "topics": ["Prototyping in Figma"], "resources": ["Figma prototyping docs", "DesignCourse YouTube"]},
                {"week": 8, "topics": ["Accessibility: WCAG basics"], "resources": ["WebAIM", "a11y Project"]},
                {"week": 9, "topics": ["Design handoff to developers"], "resources": ["Zeplin docs", "Figma Dev Mode"]},
                {"week": 10, "topics": ["Build a case study for portfolio"], "resources": ["UX Portfolio examples", "Bestfolios"]},
                {"week": 11, "topics": ["Design critique skills"], "resources": ["Design Buddy", "Google Design review talks"]},
                {"week": 12, "topics": ["Redesign an existing app and present outcomes"], "resources": ["UX Challenges", "Daily UI"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Research synthesis: affinity mapping, themes"], "resources": ["Miro templates", "NNG research synthesis"]},
                {"week": 2, "topics": ["Service blueprinting", "Journey mapping"], "resources": ["NNG Journey Maps", "Miro service blueprint"]},
                {"week": 3, "topics": ["Figma advanced: auto-layout, components"], "resources": ["Figma advanced tutorials", "DesignCode"]},
                {"week": 4, "topics": ["Design systems: tokens, components, documentation"], "resources": ["Storybook docs", "Material Design guidelines"]},
                {"week": 5, "topics": ["Quantitative UX: metrics, analytics"], "resources": ["Google HEART framework", "Hotjar blog"]},
                {"week": 6, "topics": ["Motion design: micro-interactions, Principle"], "resources": ["Principle tutorials", "UX in Motion"]},
                {"week": 7, "topics": ["Accessibility audit & remediation"], "resources": ["axe DevTools", "WCAG 2.1 checklist"]},
                {"week": 8, "topics": ["Voice & conversational UI design"], "resources": ["Google Assistant design", "Voiceflow"]},
                {"week": 9, "topics": ["Eye-tracking & biometric research"], "resources": ["Nielsen Eye Tracking book", "Tobii research"]},
                {"week": 10, "topics": ["Stakeholder presentation skills"], "resources": ["Duarte Presentation Secrets", "Storytelling with Data"]},
                {"week": 11, "topics": ["Mobile design patterns: iOS HIG, Material"], "resources": ["Apple HIG", "Material Design 3"]},
                {"week": 12, "topics": ["Lead a full UX project end-to-end"], "resources": ["UX Project Checklist", "Cooper Alan book"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Strategic UX", "Design as competitive advantage"], "resources": ["Design of Everyday Things", "IDEO TED talks"]},
                {"week": 2, "topics": ["DesignOps at scale"], "resources": ["DesignOps Summit talks", "InVision DesignOps guide"]},
                {"week": 3, "topics": ["AI UX design patterns"], "resources": ["Google PAIR guidebook", "Nielsen AI UX"]},
                {"week": 4, "topics": ["Cross-platform design: web, mobile, wearable"], "resources": ["Apple HIG", "Wear OS guidelines"]},
                {"week": 5, "topics": ["3D & spatial design (AR/VR/XR)"], "resources": ["Apple Vision Pro HIG", "Meta Horizon OS guidelines"]},
                {"week": 6, "topics": ["Ethics in design", "Dark patterns"], "resources": ["Deceptive Design", "Ethical Design Handbook"]},
                {"week": 7, "topics": ["Research repository & knowledge management"], "resources": ["Dovetail", "Notion for research"]},
                {"week": 8, "topics": ["Design leadership: building & managing teams"], "resources": ["Org Design for Design Orgs book", "FinderForum"]},
                {"week": 9, "topics": ["Business acumen for design leaders"], "resources": ["Business thinking for designers", "IDEO CoLab"]},
                {"week": 10, "topics": ["Measuring ROI of design"], "resources": ["InVision design value report", "McKinsey design index"]},
                {"week": 11, "topics": ["Publish original UX research or articles"], "resources": ["UX Collective", "A List Apart"]},
                {"week": 12, "topics": ["Define design strategy for a new product line"], "resources": ["Marty Cagan talks", "SVA Design Research"]},
            ]
        },
    },
    "Cybersecurity Analyst": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Networking fundamentals", "OSI model, TCP/IP"], "resources": ["Professor Messer CompTIA A+", "TryHackMe Pre-Security"]},
                {"week": 2, "topics": ["Linux command line", "File permissions"], "resources": ["OverTheWire Bandit", "Linux Command Line book"]},
                {"week": 3, "topics": ["Security fundamentals: CIA triad, threats"], "resources": ["CompTIA Security+ study guide", "Cybersecurity Essentials (Cisco)"]},
                {"week": 4, "topics": ["Cryptography basics: symmetric, asymmetric, hashing"], "resources": ["Khan Academy Cryptography", "Crypto 101"]},
                {"week": 5, "topics": ["OWASP Top 10", "Common vulnerabilities"], "resources": ["OWASP.org", "Web Security Academy (PortSwigger)"]},
                {"week": 6, "topics": ["Firewalls, IDS/IPS, network security"], "resources": ["Cisco Networking Academy", "Professor Messer"]},
                {"week": 7, "topics": ["Security operations basics: SIEM, logs"], "resources": ["Splunk Free Training", "TryHackMe SOC1 path"]},
                {"week": 8, "topics": ["Malware analysis basics: types, infection vectors"], "resources": ["MalwareTech blog", "any.run sandbox"]},
                {"week": 9, "topics": ["Incident response lifecycle"], "resources": ["NIST IR guide", "SANS IR process"]},
                {"week": 10, "topics": ["Python scripting for security automation"], "resources": ["Automate the Boring Stuff", "Black Hat Python book"]},
                {"week": 11, "topics": ["CompTIA Security+ practice exams"], "resources": ["Jason Dion Udemy", "ExamCompass"]},
                {"week": 12, "topics": ["Capture The Flag: TryHackMe beginner rooms"], "resources": ["TryHackMe", "CTFtime.org"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["Penetration testing methodology", "PTES standard"], "resources": ["PTES.org", "Georgia Weidman book"]},
                {"week": 2, "topics": ["Metasploit Framework", "Exploitation basics"], "resources": ["Offensive Security Metasploit Unleashed", "HackTheBox"]},
                {"week": 3, "topics": ["Web app pentesting: SQLi, XSS, CSRF"], "resources": ["Web Security Academy", "DVWA"]},
                {"week": 4, "topics": ["Active Directory attacks: Bloodhound, Mimikatz"], "resources": ["TCM Security courses", "HackTheBox Pro Labs"]},
                {"week": 5, "topics": ["Network traffic analysis: Wireshark, Zeek"], "resources": ["Wireshark docs", "Malware Traffic Analysis"]},
                {"week": 6, "topics": ["Threat intelligence: MITRE ATT&CK"], "resources": ["MITRE ATT&CK Navigator", "CISA advisories"]},
                {"week": 7, "topics": ["Cloud security: AWS IAM, security groups"], "resources": ["AWS Security Specialty prep", "CloudGoat vulnerable by design"]},
                {"week": 8, "topics": ["SIEM: Splunk queries, detection rules"], "resources": ["Splunk Training", "DetectionLab"]},
                {"week": 9, "topics": ["Secure code review: SAST tools"], "resources": ["Semgrep docs", "OWASP Code Review guide"]},
                {"week": 10, "topics": ["Red vs Blue team exercises"], "resources": ["TCM Security", "Atomic Red Team"]},
                {"week": 11, "topics": ["CEH or eJPT certification prep"], "resources": ["eLearnSecurity", "EC-Council study guide"]},
                {"week": 12, "topics": ["Full pentest report on a VulnHub machine"], "resources": ["VulnHub", "HackTheBox"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Exploit development: buffer overflow, shellcoding"], "resources": ["Corelan exploit writing series", "SecurityTube"]},
                {"week": 2, "topics": ["Reverse engineering: x86 ASM, Ghidra, IDA"], "resources": ["Ghidra docs", "Malware Unicorn workshops"]},
                {"week": 3, "topics": ["Advanced Active Directory: DCSync, Golden Ticket"], "resources": ["Impacket docs", "HackTheBox Pro Labs"]},
                {"week": 4, "topics": ["Red team operations: C2 frameworks, OPSEC"], "resources": ["Cobalt Strike docs", "OSCP study guide"]},
                {"week": 5, "topics": ["Threat hunting: hypothesis-driven investigation"], "resources": ["SANS threat hunting course", "ThreatHunter Playbook"]},
                {"week": 6, "topics": ["Zero-day research & responsible disclosure"], "resources": ["Project Zero blog", "HackerOne resources"]},
                {"week": 7, "topics": ["Malware development (for red team)"], "resources": ["VX Underground", "Sektor7 courses"]},
                {"week": 8, "topics": ["ICS/OT security: SCADA vulnerabilities"], "resources": ["Idaho National Lab ICS training", "CISA ICS-CERT"]},
                {"week": 9, "topics": ["Bug bounty: HackerOne, Bugcrowd programs"], "resources": ["Hacker101", "LiveOverflow YouTube"]},
                {"week": 10, "topics": ["OSCP certification exam prep"], "resources": ["Offensive Security PEN-200", "TJ Null OSCP prep list"]},
                {"week": 11, "topics": ["Build a custom detection rule set"], "resources": ["Sigma rules", "Elastic detection-rules GitHub"]},
                {"week": 12, "topics": ["Publish a CVE or vulnerability research writeup"], "resources": ["Exploit-DB", "Full Disclosure mailing list"]},
            ]
        },
    },
    "Cloud Architect": {
        "beginner": {
            "weeks": [
                {"week": 1, "topics": ["Cloud concepts: IaaS, PaaS, SaaS"], "resources": ["AWS Cloud Practitioner Essentials", "Google Cloud Fundamentals"]},
                {"week": 2, "topics": ["Networking: VPC, subnets, routing"], "resources": ["AWS Networking Fundamentals", "DigitalOcean networking"]},
                {"week": 3, "topics": ["Compute: EC2, GCE, Azure VMs"], "resources": ["AWS EC2 Getting Started", "GCP Compute Engine docs"]},
                {"week": 4, "topics": ["Storage: S3, GCS, Blob, object vs block"], "resources": ["AWS S3 docs", "GCP Storage overview"]},
                {"week": 5, "topics": ["IAM: roles, policies, least privilege"], "resources": ["AWS IAM docs", "Google IAM best practices"]},
                {"week": 6, "topics": ["Databases: RDS, Cloud SQL, Cosmos DB"], "resources": ["AWS RDS Getting Started", "Azure SQL docs"]},
                {"week": 7, "topics": ["Serverless: Lambda, Cloud Functions"], "resources": ["AWS Lambda docs", "GCP Cloud Functions tutorial"]},
                {"week": 8, "topics": ["CDN & DNS: CloudFront, Route53"], "resources": ["AWS CDN docs", "Cloudflare learning center"]},
                {"week": 9, "topics": ["Monitoring: CloudWatch, Stackdriver"], "resources": ["AWS CloudWatch docs", "GCP Monitoring docs"]},
                {"week": 10, "topics": ["Cost management basics: billing alerts"], "resources": ["AWS Cost Explorer", "GCP Budget alerts"]},
                {"week": 11, "topics": ["AWS Cloud Practitioner certification prep"], "resources": ["Andrew Brown freeCodeCamp course", "Tutorials Dojo practice"]},
                {"week": 12, "topics": ["Deploy a 3-tier architecture on AWS"], "resources": ["AWS Architecture Center", "DigitalOcean tutorials"]},
            ]
        },
        "intermediate": {
            "weeks": [
                {"week": 1, "topics": ["High availability: multi-AZ, load balancers"], "resources": ["AWS Well-Architected Framework", "GCP architecture guide"]},
                {"week": 2, "topics": ["Infrastructure as Code: Terraform"], "resources": ["Terraform Up and Running", "HashiCorp Learn"]},
                {"week": 3, "topics": ["Containers on cloud: ECS, GKE, AKS"], "resources": ["AWS ECS docs", "GKE quickstart"]},
                {"week": 4, "topics": ["CI/CD pipelines: CodePipeline, Cloud Build"], "resources": ["AWS CodePipeline docs", "GCP Cloud Build docs"]},
                {"week": 5, "topics": ["Security: AWS WAF, Shield, Security Hub"], "resources": ["AWS Security Center", "CIS Benchmarks"]},
                {"week": 6, "topics": ["Observability stack: Prometheus, Grafana on cloud"], "resources": ["AWS Managed Grafana", "GCP Operations Suite"]},
                {"week": 7, "topics": ["Event-driven architecture: SNS, SQS, Pub/Sub"], "resources": ["AWS SNS/SQS docs", "GCP Pub/Sub docs"]},
                {"week": 8, "topics": ["Disaster recovery: RTO, RPO, backup strategies"], "resources": ["AWS Disaster Recovery whitepaper", "GCP DR planning guide"]},
                {"week": 9, "topics": ["Data warehousing: Redshift, BigQuery, Synapse"], "resources": ["BigQuery docs", "Redshift getting started"]},
                {"week": 10, "topics": ["FinOps: savings plans, reserved instances"], "resources": ["AWS Cost Optimisation", "FinOps Foundation"]},
                {"week": 11, "topics": ["AWS Solutions Architect Associate exam prep"], "resources": ["Stephane Maarek Udemy", "Tutorials Dojo SAA-C03"]},
                {"week": 12, "topics": ["Architect a multi-region, fault-tolerant system"], "resources": ["AWS Architecture Blog", "Google Cloud Architecture Center"]},
            ]
        },
        "advanced": {
            "weeks": [
                {"week": 1, "topics": ["Multi-cloud strategy & governance"], "resources": ["Gartner multi-cloud research", "Anthos / Azure Arc"]},
                {"week": 2, "topics": ["FinOps at enterprise scale"], "resources": ["FinOps Foundation FOCUS spec", "Infracost enterprise"]},
                {"week": 3, "topics": ["Zero Trust network architecture on cloud"], "resources": ["BeyondCorp whitepaper", "Cloudflare Zero Trust"]},
                {"week": 4, "topics": ["Kubernetes on cloud: EKS, GKE advanced tuning"], "resources": ["EKS Workshop", "GKE advanced networking"]},
                {"week": 5, "topics": ["Data mesh architecture on cloud"], "resources": ["Data Mesh book by Zhamak", "AWS Data Mesh patterns"]},
                {"week": 6, "topics": ["Cloud-native AI/ML platform design"], "resources": ["AWS SageMaker Studio", "Vertex AI platform docs"]},
                {"week": 7, "topics": ["SRE on cloud: SLOs, error budgets, chaos"], "resources": ["Google SRE book", "AWS Resilience Hub"]},
                {"week": 8, "topics": ["Compliance frameworks: SOC2, ISO 27001, HIPAA on cloud"], "resources": ["AWS Compliance Programs", "GCP Compliance resources"]},
                {"week": 9, "topics": ["Edge computing: AWS Outposts, GCP Distributed Cloud"], "resources": ["AWS Outposts docs", "Google Distributed Cloud"]},
                {"week": 10, "topics": ["AWS Solutions Architect Professional exam prep"], "resources": ["Stephane Maarek SAP-C02", "whizlabs practice"]},
                {"week": 11, "topics": ["Thought leadership: write architecture blog posts"], "resources": ["AWS Architecture Blog", "The Pragmatic Engineer"]},
                {"week": 12, "topics": ["Design & present enterprise cloud strategy"], "resources": ["AWS CAF framework", "Google Cloud Adoption Framework"]},
            ]
        },
    },
}

JOB_TITLES = list(STATIC_ROADMAPS.keys())
LEVELS = ["beginner", "intermediate", "advanced"]


def get_static_roadmap(role: str, level: str) -> dict | None:
    """Return static roadmap data for a given role and level, or None if not found."""
    role_data = STATIC_ROADMAPS.get(role)
    if not role_data:
        return None
    return role_data.get(level.lower())

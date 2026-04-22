"""
Static fallback interview questions organised by:
  Role → Round Type → Questions

Also includes heuristic scoring and coaching tips.
"""
import random

# ── Role → Round Types mapping ────────────────────────────────────────────────

ROLE_ROUND_TYPES: dict[str, list[str]] = {
    "Software Engineer":       ["Coding & DS/Algo", "System Design", "Behavioral", "HR"],
    "Data Scientist":           ["Statistics & ML", "Coding & Data", "Case Study", "Behavioral"],
    "Frontend Developer":       ["JavaScript & UI", "CSS & Design", "React & Frameworks", "Behavioral"],
    "Backend Developer":        ["Coding & APIs", "System Design", "Database", "Behavioral"],
    "DevOps Engineer":          ["Infrastructure & Cloud", "CI/CD & Automation", "Security & Monitoring", "Behavioral"],
    "Machine Learning Engineer":["ML Theory & Math", "Coding & Modelling", "MLOps & Systems", "Behavioral"],
    "Product Manager":          ["Product Sense", "Analytical", "Execution", "Behavioral"],
    "UX Designer":              ["Portfolio & Process", "Design Challenge", "Research & Strategy", "Behavioral"],
    "Cybersecurity Analyst":    ["Technical Security", "Threat Analysis", "Incident Response", "Behavioral"],
    "Cloud Architect":          ["Cloud Fundamentals", "Architecture Design", "Security & Cost", "Behavioral"],
}

# ── Role × Round Type question bank ──────────────────────────────────────────

ROLE_QUESTIONS: dict[str, dict[str, list[dict]]] = {

    # ───────────── Software Engineer ─────────────
    "Software Engineer": {
        "Coding & DS/Algo": [
            {"text": "Implement a function to find the two numbers in an array that sum to a target.", "category": "Arrays"},
            {"text": "Explain and implement a binary search algorithm. What is its time complexity?", "category": "Search"},
            {"text": "How would you detect a cycle in a linked list?", "category": "Linked Lists"},
            {"text": "Implement a stack that supports push, pop, and getMin in O(1) time.", "category": "Stacks"},
            {"text": "What is dynamic programming? Solve the coin change problem.", "category": "DP"},
            {"text": "How do you traverse a binary tree in-order, pre-order, and post-order?", "category": "Trees"},
            {"text": "Explain the difference between BFS and DFS and when to use each.", "category": "Graphs"},
            {"text": "Implement a function to check if a string is a valid palindrome.", "category": "Strings"},
            {"text": "What is quicksort? What is its average vs worst-case complexity?", "category": "Sorting"},
            {"text": "How would you find the longest common subsequence of two strings?", "category": "DP"},
        ],
        "System Design": [
            {"text": "Design a URL shortener like bit.ly. Walk through the architecture.", "category": "Web"},
            {"text": "How would you design a distributed cache system?", "category": "Caching"},
            {"text": "Design a notification service that handles 10 million users.", "category": "Messaging"},
            {"text": "How would you architect a scalable file upload service?", "category": "Storage"},
            {"text": "Design a real-time leaderboard for a gaming platform.", "category": "Real-time"},
            {"text": "How would you design an API rate limiter?", "category": "Security"},
            {"text": "Walk me through designing a search autocomplete system.", "category": "Search"},
            {"text": "How would you design a job scheduler for background tasks?", "category": "Queue"},
            {"text": "Design a system to detect duplicate transactions in real time.", "category": "Finance"},
            {"text": "How would you design a multi-tenant SaaS platform?", "category": "Architecture"},
        ],
        "Behavioral": [
            {"text": "Tell me about a time you debugged a particularly difficult production issue.", "category": "Problem Solving"},
            {"text": "Describe a situation where you had to push back on a feature request.", "category": "Communication"},
            {"text": "Tell me about a time you improved the performance of a slow system.", "category": "Impact"},
            {"text": "How do you handle technical debt in your day-to-day work?", "category": "Engineering Culture"},
            {"text": "Tell me about a time you mentored a junior developer.", "category": "Leadership"},
            {"text": "Describe the most complex piece of code you have written.", "category": "Technical Depth"},
            {"text": "How do you stay current with new programming languages and tools?", "category": "Learning"},
            {"text": "Tell me about a time a project you worked on failed. What did you learn?", "category": "Growth"},
        ],
        "HR": [
            {"text": "Why are you looking for a new role?", "category": "Motivation"},
            {"text": "Where do you see yourself in 3 years?", "category": "Career Goals"},
            {"text": "What is your preferred working style — remote, hybrid, or in-office?", "category": "Logistics"},
            {"text": "How do you handle working in a fast-paced, ambiguous environment?", "category": "Adaptability"},
            {"text": "What are your salary expectations?", "category": "Compensation"},
            {"text": "Do you have experience working in Agile or Scrum teams?", "category": "Process"},
            {"text": "What does a healthy engineering culture look like to you?", "category": "Culture"},
            {"text": "How quickly can you start if selected?", "category": "Availability"},
        ],
    },

    # ───────────── Data Scientist ─────────────
    "Data Scientist": {
        "Statistics & ML": [
            {"text": "Explain the bias-variance trade-off and how it impacts model selection.", "category": "ML Theory"},
            {"text": "What is the difference between L1 and L2 regularisation?", "category": "Regularisation"},
            {"text": "How does gradient descent work? Explain learning rate selection.", "category": "Optimisation"},
            {"text": "What is cross-validation and why do we use it?", "category": "Evaluation"},
            {"text": "Explain precision, recall, F1, and AUC-ROC. When do you prioritise each?", "category": "Metrics"},
            {"text": "What is the central limit theorem and why does it matter in statistics?", "category": "Statistics"},
            {"text": "Explain what a p-value is. How do you interpret a p-value of 0.03?", "category": "Hypothesis Testing"},
            {"text": "What is the difference between bagging and boosting?", "category": "Ensembles"},
            {"text": "Explain how a random forest works and its key hyperparameters.", "category": "Trees"},
            {"text": "What is principal component analysis (PCA) and when do you use it?", "category": "Dimensionality"},
        ],
        "Coding & Data": [
            {"text": "Write a Pandas query to find the top 5 customers by total spend.", "category": "Pandas"},
            {"text": "How would you handle missing values in a dataset? Demonstrate with code.", "category": "Data Cleaning"},
            {"text": "Write a SQL query to find the second highest salary in a table.", "category": "SQL"},
            {"text": "Implement k-means clustering from scratch in Python.", "category": "Algorithms"},
            {"text": "How do you detect and handle outliers in a numerical feature?", "category": "Feature Engineering"},
            {"text": "Write code to compute a confusion matrix without using sklearn.", "category": "Evaluation"},
            {"text": "How would you encode categorical variables for a machine learning model?", "category": "Preprocessing"},
            {"text": "Implement a simple linear regression using gradient descent.", "category": "ML Coding"},
            {"text": "Write a function to split a dataset into train, validation, and test sets.", "category": "Data Splitting"},
            {"text": "How would you compute the Pearson correlation between two columns?", "category": "Statistics"},
        ],
        "Case Study": [
            {"text": "How would you build a churn prediction model for a subscription product?", "category": "Product ML"},
            {"text": "A model has high accuracy but terrible recall. What do you do?", "category": "Debugging"},
            {"text": "How would you design an A/B test for a new recommendation algorithm?", "category": "Experimentation"},
            {"text": "Walk me through building a demand forecasting system for e-commerce.", "category": "Forecasting"},
            {"text": "How would you detect anomalies in server metrics in real time?", "category": "Anomaly Detection"},
            {"text": "Our click-through rate dropped 15% last week. How do you investigate?", "category": "RCA"},
            {"text": "How would you approach building a fraud detection ML system?", "category": "Fraud"},
            {"text": "Design a recommendation system for a streaming platform.", "category": "RecSys"},
        ],
        "Behavioral": [
            {"text": "Tell me about a model you built that had significant business impact.", "category": "Impact"},
            {"text": "Describe a time your model was wrong. How did you discover and fix it?", "category": "Debugging"},
            {"text": "How do you communicate complex statistical findings to non-technical stakeholders?", "category": "Communication"},
            {"text": "Tell me about a time you had to work with messy, incomplete data.", "category": "Data Quality"},
            {"text": "How do you prioritise which ML projects to pursue?", "category": "Prioritisation"},
            {"text": "Describe a situation where you challenged a business hypothesis with data.", "category": "Analytical Thinking"},
            {"text": "Tell me about a time you learned a new ML technique and applied it.", "category": "Learning"},
            {"text": "How do you ensure reproducibility in your ML experiments?", "category": "Best Practices"},
        ],
    },

    # ───────────── Frontend Developer ─────────────
    "Frontend Developer": {
        "JavaScript & UI": [
            {"text": "Explain the JavaScript event loop and call stack.", "category": "JS Internals"},
            {"text": "What is the difference between `==` and `===` in JavaScript?", "category": "JS Basics"},
            {"text": "Explain closures in JavaScript with an example.", "category": "JS Concepts"},
            {"text": "What is the difference between `let`, `const`, and `var`?", "category": "JS Basics"},
            {"text": "Explain Promises and async/await. How do they differ?", "category": "Async"},
            {"text": "What is the difference between `null` and `undefined`?", "category": "JS Basics"},
            {"text": "How does the `this` keyword work in different contexts?", "category": "JS Concepts"},
            {"text": "What is debouncing and throttling? Implement one from scratch.", "category": "Performance"},
            {"text": "Explain prototype chain and prototypal inheritance.", "category": "OOP"},
            {"text": "How do you handle cross-browser compatibility issues?", "category": "Compatibility"},
        ],
        "CSS & Design": [
            {"text": "Explain the CSS box model and how padding, border, and margin interact.", "category": "CSS Basics"},
            {"text": "What is the difference between Flexbox and CSS Grid? When do you use each?", "category": "Layout"},
            {"text": "How do you achieve responsive design without a CSS framework?", "category": "Responsive"},
            {"text": "What are CSS custom properties (variables) and how do you use them?", "category": "CSS Modern"},
            {"text": "Explain specificity in CSS. How does it determine which styles apply?", "category": "CSS Rules"},
            {"text": "What is the difference between `position: relative`, `absolute`, `fixed`, and `sticky`?", "category": "Positioning"},
            {"text": "How do you optimise CSS for performance?", "category": "Performance"},
            {"text": "Explain BEM methodology and why it is useful.", "category": "Architecture"},
            {"text": "How do you implement a dark mode using CSS?", "category": "Theming"},
            {"text": "What are CSS animations vs transitions? Give use cases for each.", "category": "Animation"},
        ],
        "React & Frameworks": [
            {"text": "Explain the React reconciliation algorithm and the virtual DOM.", "category": "React Internals"},
            {"text": "What are React hooks? Explain `useState`, `useEffect`, and `useCallback`.", "category": "Hooks"},
            {"text": "How do you prevent unnecessary re-renders in React?", "category": "Performance"},
            {"text": "What is the difference between controlled and uncontrolled components?", "category": "Forms"},
            {"text": "Explain the Context API vs prop drilling. When do you use state management?", "category": "State"},
            {"text": "What is server-side rendering in Next.js and when does it help?", "category": "Next.js"},
            {"text": "How does React handle forms and validation best practices?", "category": "Forms"},
            {"text": "What is code splitting and how do you implement it in React?", "category": "Performance"},
            {"text": "Explain the difference between `useEffect` and `useLayoutEffect`.", "category": "Hooks"},
            {"text": "How would you implement infinite scroll in React?", "category": "UI Patterns"},
        ],
        "Behavioral": [
            {"text": "Tell me about the most complex UI component you have built.", "category": "Technical Depth"},
            {"text": "Describe a time you improved page performance significantly.", "category": "Impact"},
            {"text": "How do you collaborate with UX designers during development?", "category": "Collaboration"},
            {"text": "Tell me about a time you caught an accessibility issue and fixed it.", "category": "A11y"},
            {"text": "How do you stay updated with the fast-moving frontend ecosystem?", "category": "Learning"},
            {"text": "Describe a situation where you had to refactor a large codebase.", "category": "Refactoring"},
            {"text": "How do you handle browser compatibility bugs?", "category": "Problem Solving"},
            {"text": "Tell me about a time you received feedback on your UI that surprised you.", "category": "Growth"},
        ],
    },

    # ───────────── Backend Developer ─────────────
    "Backend Developer": {
        "Coding & APIs": [
            {"text": "Design a RESTful API for a blog platform. What endpoints do you create?", "category": "API Design"},
            {"text": "How do you implement pagination in a REST API efficiently?", "category": "Performance"},
            {"text": "Explain the difference between authentication and authorisation.", "category": "Security"},
            {"text": "How does JWT work? What are its advantages and limitations?", "category": "Auth"},
            {"text": "What HTTP status codes do you use for different error scenarios?", "category": "HTTP"},
            {"text": "How do you handle idempotency in API endpoints?", "category": "API Design"},
            {"text": "Write a middleware to rate-limit API requests per user.", "category": "Security"},
            {"text": "Explain GraphQL vs REST. When would you choose one over the other?", "category": "API"},
            {"text": "How do you version a REST API without breaking existing clients?", "category": "Versioning"},
            {"text": "Describe your approach to API documentation.", "category": "Best Practices"},
        ],
        "System Design": [
            {"text": "How would you design a backend for a multi-tenant SaaS product?", "category": "Architecture"},
            {"text": "Design a distributed job queue system.", "category": "Queue"},
            {"text": "How would you implement WebSocket-based real-time updates?", "category": "Real-time"},
            {"text": "Design a payment processing system with idempotency guarantees.", "category": "Finance"},
            {"text": "How would you handle 1 million concurrent API requests?", "category": "Scalability"},
            {"text": "Describe your strategy for zero-downtime deployments.", "category": "Deployment"},
            {"text": "How would you architect a microservices communication layer?", "category": "Microservices"},
            {"text": "Design a search feature with full-text and filter capabilities.", "category": "Search"},
        ],
        "Database": [
            {"text": "Explain the difference between inner join, left join, and outer join.", "category": "SQL"},
            {"text": "What is database normalisation? Explain with an example.", "category": "Design"},
            {"text": "How do indexes work and what are their trade-offs?", "category": "Performance"},
            {"text": "What is an N+1 query problem and how do you avoid it?", "category": "ORM"},
            {"text": "Explain ACID properties with a real-world example.", "category": "Transactions"},
            {"text": "When would you use a NoSQL database over PostgreSQL?", "category": "Database Choice"},
            {"text": "How do you design a database schema for a multi-currency e-commerce platform?", "category": "Schema Design"},
            {"text": "What is a database migration strategy for a live production system?", "category": "Operations"},
        ],
        "Behavioral": [
            {"text": "Tell me about the most challenging API you have designed.", "category": "Technical Depth"},
            {"text": "Describe a time you improved the response time of a slow endpoint.", "category": "Performance"},
            {"text": "How do you approach securing a backend against common attacks?", "category": "Security"},
            {"text": "Tell me about a time a database migration went wrong.", "category": "Operations"},
            {"text": "How do you balance feature development with API stability?", "category": "Trade-offs"},
            {"text": "Describe a time you had to scale a system under time pressure.", "category": "Scalability"},
            {"text": "How do you document APIs for frontend teams?", "category": "Collaboration"},
            {"text": "Tell me about a time you introduced a new backend pattern or library.", "category": "Impact"},
        ],
    },

    # ───────────── DevOps Engineer ─────────────
    "DevOps Engineer": {
        "Infrastructure & Cloud": [
            {"text": "Explain the difference between IaaS, PaaS, and SaaS with examples.", "category": "Cloud Basics"},
            {"text": "How does Kubernetes manage container scheduling and health?", "category": "Kubernetes"},
            {"text": "What is Infrastructure as Code and why is it important?", "category": "IaC"},
            {"text": "Explain VPC, subnets, security groups, and NAT gateways.", "category": "Networking"},
            {"text": "How do you manage secrets securely in a cloud environment?", "category": "Security"},
            {"text": "What is the difference between a load balancer and an API gateway?", "category": "Networking"},
            {"text": "How do you ensure high availability for a cloud-hosted application?", "category": "Reliability"},
            {"text": "Explain the concept of auto-scaling. What triggers it?", "category": "Scalability"},
            {"text": "What are the key differences between AWS, GCP, and Azure?", "category": "Cloud Providers"},
            {"text": "How do you manage state in Terraform?", "category": "IaC"},
        ],
        "CI/CD & Automation": [
            {"text": "Walk me through a CI/CD pipeline you have built from scratch.", "category": "CI/CD"},
            {"text": "How do you implement blue-green deployment?", "category": "Deployment"},
            {"text": "What is a canary deployment and when do you use it?", "category": "Deployment"},
            {"text": "How do you handle failed deployments automatically?", "category": "Rollback"},
            {"text": "Write a GitHub Actions workflow that tests, builds, and deploys a Docker image.", "category": "Automation"},
            {"text": "How do you manage environment-specific configuration in pipelines?", "category": "Configuration"},
            {"text": "Explain GitOps and how ArgoCD or Flux implements it.", "category": "GitOps"},
            {"text": "What is a Makefile and when is it useful in a DevOps context?", "category": "Tooling"},
        ],
        "Security & Monitoring": [
            {"text": "How do you monitor a Kubernetes cluster in production?", "category": "Monitoring"},
            {"text": "Explain the ELK stack. How do you use it for log analysis?", "category": "Logging"},
            {"text": "What is an SLO, SLI, and SLA? Give a concrete example.", "category": "SRE"},
            {"text": "How do you detect and respond to a security incident in a cloud environment?", "category": "Incident Response"},
            {"text": "What is the principle of least privilege and how do you enforce it?", "category": "Security"},
            {"text": "How do you conduct a post-mortem after a production outage?", "category": "SRE"},
            {"text": "Explain how you set up alerting rules in Prometheus and Grafana.", "category": "Alerting"},
            {"text": "What are CIS benchmarks and how do you apply them?", "category": "Compliance"},
        ],
        "Behavioral": [
            {"text": "Tell me about the most complex infrastructure problem you solved.", "category": "Technical Depth"},
            {"text": "Describe a production outage you handled. What was your process?", "category": "Incident Response"},
            {"text": "How have you improved developer experience with tooling or automation?", "category": "Impact"},
            {"text": "Tell me about a time you reduced cloud costs significantly.", "category": "FinOps"},
            {"text": "How do you encourage a security-first culture in a development team?", "category": "Culture"},
            {"text": "Describe a time you had to migrate a live system with zero downtime.", "category": "Migration"},
            {"text": "How do you handle on-call rotations and alert fatigue?", "category": "Operations"},
            {"text": "Tell me about a time you automated a manual process and its impact.", "category": "Automation"},
        ],
    },

    # ───────────── Machine Learning Engineer ─────────────
    "Machine Learning Engineer": {
        "ML Theory & Math": [
            {"text": "Explain the transformer architecture. What problems did it solve over RNNs?", "category": "DL Architecture"},
            {"text": "What is the vanishing gradient problem and how do you address it?", "category": "Training"},
            {"text": "Explain attention mechanisms in neural networks.", "category": "Attention"},
            {"text": "What is the difference between fine-tuning and training from scratch?", "category": "Transfer Learning"},
            {"text": "Explain batch normalisation and why it helps training.", "category": "Techniques"},
            {"text": "What is dropout and how does it reduce overfitting?", "category": "Regularisation"},
            {"text": "How do embeddings work? Explain word2vec at a conceptual level.", "category": "Embeddings"},
            {"text": "What is the difference between a generative and discriminative model?", "category": "ML Theory"},
            {"text": "Explain how RLHF (Reinforcement Learning from Human Feedback) works.", "category": "LLMs"},
            {"text": "What are the trade-offs between model accuracy and inference latency?", "category": "Production"},
        ],
        "Coding & Modelling": [
            {"text": "Implement a basic neural network forward pass from scratch in NumPy.", "category": "Coding"},
            {"text": "Write code to fine-tune a HuggingFace model on a custom dataset.", "category": "NLP"},
            {"text": "How do you implement early stopping during model training?", "category": "Training"},
            {"text": "Write a data loader for image classification using PyTorch.", "category": "Vision"},
            {"text": "Implement cross-entropy loss from scratch.", "category": "Loss Functions"},
            {"text": "How do you handle class imbalance in a binary classification task?", "category": "Data"},
            {"text": "Write code to evaluate a model on a held-out test set and plot a confusion matrix.", "category": "Evaluation"},
            {"text": "How do you implement batched inference efficiently for a large model?", "category": "Production"},
            {"text": "Write a custom PyTorch Dataset class for tabular data.", "category": "Coding"},
            {"text": "Implement top-k accuracy for a multi-class classification problem.", "category": "Metrics"},
        ],
        "MLOps & Systems": [
            {"text": "How do you version datasets and models in an ML pipeline?", "category": "MLOps"},
            {"text": "Describe how you would monitor a model in production for drift.", "category": "Monitoring"},
            {"text": "What is a feature store and why is it important at scale?", "category": "Feature Engineering"},
            {"text": "How do you build a reproducible ML training pipeline?", "category": "MLOps"},
            {"text": "Explain the difference between online and batch inference serving.", "category": "Serving"},
            {"text": "How do you reduce the size of a large model for production deployment?", "category": "Optimisation"},
            {"text": "What is A/B testing in the context of ML model rollout?", "category": "Experimentation"},
            {"text": "How would you set up an automated retraining pipeline?", "category": "Automation"},
        ],
        "Behavioral": [
            {"text": "Tell me about an ML model you built that had real-world business impact.", "category": "Impact"},
            {"text": "Describe a time your model failed in production. How did you diagnose it?", "category": "Debugging"},
            {"text": "How do you communicate model limitations to non-technical stakeholders?", "category": "Communication"},
            {"text": "Tell me about a time you identified and resolved data quality issues.", "category": "Data Quality"},
            {"text": "How do you decide when a model is good enough to deploy?", "category": "Decision Making"},
            {"text": "Describe a time you reduced training cost or time significantly.", "category": "Efficiency"},
            {"text": "How do you keep up with the rapid pace of ML research?", "category": "Learning"},
            {"text": "Tell me about a collaboration with a data scientist or product manager.", "category": "Collaboration"},
        ],
    },

    # ───────────── Product Manager ─────────────
    "Product Manager": {
        "Product Sense": [
            {"text": "How would you improve Google Maps for blind users?", "category": "Product Design"},
            {"text": "Design a product for managing work-life balance for remote workers.", "category": "Product Design"},
            {"text": "How would you monetise WhatsApp without degrading user experience?", "category": "Monetisation"},
            {"text": "Walk me through how you would launch a new feature for Instagram.", "category": "GTM"},
            {"text": "How would you redesign the Airbnb host onboarding experience?", "category": "UX Thinking"},
            {"text": "What metrics would you track for a new ride-sharing product?", "category": "Metrics"},
            {"text": "How would you prioritise a backlog with 50 feature requests?", "category": "Prioritisation"},
            {"text": "Design a product to help elderly users adopt digital payments.", "category": "Inclusion"},
            {"text": "How would you define success for a new AI assistant feature?", "category": "Metrics"},
            {"text": "Walk me through your favourite product and what you would improve.", "category": "Product Taste"},
        ],
        "Analytical": [
            {"text": "Our DAU dropped 20% overnight. How do you investigate?", "category": "Root Cause Analysis"},
            {"text": "How do you design and analyse an A/B test for a checkout flow?", "category": "Experimentation"},
            {"text": "How would you measure the success of a recommendation system?", "category": "Metrics"},
            {"text": "Retention dropped from 60% to 45%. What do you do?", "category": "Retention"},
            {"text": "How do you size the market for a new B2B SaaS product?", "category": "Market Sizing"},
            {"text": "Walk me through calculating the LTV of a subscription customer.", "category": "Finance"},
            {"text": "How do you use cohort analysis to understand user behaviour?", "category": "Analytics"},
            {"text": "What is a north star metric? Define one for Spotify.", "category": "Metrics"},
        ],
        "Execution": [
            {"text": "How do you write a product requirements document?", "category": "Documentation"},
            {"text": "How do you work with engineering to manage scope during a sprint?", "category": "Agile"},
            {"text": "Describe your process from idea to shipped feature.", "category": "Process"},
            {"text": "How do you handle a missed deadline on a critical feature?", "category": "Project Management"},
            {"text": "How do you balance technical debt requests from engineers vs new features?", "category": "Trade-offs"},
            {"text": "How do you gather and validate customer requirements?", "category": "Discovery"},
            {"text": "Tell me about a time you had to say no to a stakeholder request.", "category": "Stakeholder Management"},
            {"text": "How do you build a product roadmap aligned with company strategy?", "category": "Roadmap"},
        ],
        "Behavioral": [
            {"text": "Tell me about a product you launched. What would you do differently?", "category": "Reflection"},
            {"text": "Describe a time you made a data-driven decision that was initially unpopular.", "category": "Influence"},
            {"text": "How have you handled conflicting feedback from different stakeholders?", "category": "Conflict"},
            {"text": "Tell me about a failed product or feature. What did you learn?", "category": "Growth"},
            {"text": "How do you build trust with the engineering team?", "category": "Collaboration"},
            {"text": "Describe a time you advocated strongly for users against business pressure.", "category": "User Empathy"},
            {"text": "How do you keep your team aligned and motivated during ambiguity?", "category": "Leadership"},
            {"text": "Tell me about your proudest product achievement.", "category": "Achievement"},
        ],
    },

    # ───────────── UX Designer ─────────────
    "UX Designer": {
        "Portfolio & Process": [
            {"text": "Walk me through your design process on a project in your portfolio.", "category": "Process"},
            {"text": "How do you determine when a design problem is solved?", "category": "Evaluation"},
            {"text": "Talk me through a project where user research changed your design direction.", "category": "Research Impact"},
            {"text": "How do you present design decisions to non-design stakeholders?", "category": "Communication"},
            {"text": "What tools do you use and why? (Figma, Sketch, etc.)", "category": "Tools"},
            {"text": "How do you handle critical feedback on your designs?", "category": "Growth"},
            {"text": "Describe a project where constraints made you more creative.", "category": "Constraints"},
            {"text": "How do you document and handoff designs to developers?", "category": "Handoff"},
        ],
        "Design Challenge": [
            {"text": "Redesign the checkout flow of a major e-commerce site to reduce drop-off.", "category": "E-commerce"},
            {"text": "Design a mobile onboarding experience for a fintech app.", "category": "Onboarding"},
            {"text": "How would you design a dashboard for hospital patient monitoring?", "category": "Healthcare"},
            {"text": "Design the empty state for a task management app.", "category": "Micro-UX"},
            {"text": "How would you design for a user who has never used a smartphone before?", "category": "Accessibility"},
            {"text": "Redesign Google Calendar for college students.", "category": "Redesign"},
            {"text": "Design a dark mode system for a complex enterprise product.", "category": "Design Systems"},
            {"text": "How would you design a personalisation feature that doesn't feel creepy?", "category": "AI UX"},
        ],
        "Research & Strategy": [
            {"text": "How do you choose between qualitative and quantitative research methods?", "category": "Research Methods"},
            {"text": "Walk me through how you conduct a usability test from planning to insights.", "category": "Usability Testing"},
            {"text": "How do you synthesise findings from 20 user interviews?", "category": "Synthesis"},
            {"text": "What is a Jobs-to-be-Done framework and how have you applied it?", "category": "Frameworks"},
            {"text": "How do you define the success metrics for a UX improvement?", "category": "Metrics"},
            {"text": "How do you advocate for UX investment to a CEO focused on revenue?", "category": "Influence"},
            {"text": "How do you design for accessibility from the start of a project?", "category": "Accessibility"},
            {"text": "How do you align UX research with product roadmap priorities?", "category": "Strategy"},
        ],
        "Behavioral": [
            {"text": "Tell me about a time your design was rejected. How did you respond?", "category": "Resilience"},
            {"text": "Describe a time you had to persuade an engineer to change an implementation.", "category": "Collaboration"},
            {"text": "How have you contributed to a design system at scale?", "category": "Systems"},
            {"text": "Tell me about a time user data surprised you and changed your approach.", "category": "Data-driven"},
            {"text": "How do you manage competing design priorities across multiple projects?", "category": "Organisation"},
            {"text": "Describe a time you improved a product metric through a design change.", "category": "Impact"},
            {"text": "Tell me about a time you championed accessibility in a product.", "category": "Advocacy"},
            {"text": "How do you stay current with design trends and emerging tools?", "category": "Learning"},
        ],
    },

    # ───────────── Cybersecurity Analyst ─────────────
    "Cybersecurity Analyst": {
        "Technical Security": [
            {"text": "Explain the difference between symmetric and asymmetric encryption. Give examples.", "category": "Cryptography"},
            {"text": "What is SQL injection? How do you prevent it at multiple layers?", "category": "Web Security"},
            {"text": "Explain XSS and CSRF attacks. How are they different?", "category": "Web Security"},
            {"text": "What is the OWASP Top 10? Name and explain 3 items.", "category": "AppSec"},
            {"text": "Explain the OSI model. At which layers do common attacks occur?", "category": "Networking"},
            {"text": "What is a man-in-the-middle attack and how do you defend against it?", "category": "Network Security"},
            {"text": "How does TLS work? What does a certificate chain validate?", "category": "Cryptography"},
            {"text": "What is privilege escalation and how would you detect it?", "category": "Endpoint Security"},
            {"text": "Explain buffer overflow attacks and how modern systems prevent them.", "category": "Exploit"},
            {"text": "What is a zero-day vulnerability? How do organisations manage risk?", "category": "Vulnerability"},
        ],
        "Threat Analysis": [
            {"text": "Walk me through the MITRE ATT&CK framework. How do you use it?", "category": "Threat Intelligence"},
            {"text": "How do you perform threat modelling for a new web application?", "category": "Threat Modelling"},
            {"text": "What is the cyber kill chain? How does it help defenders?", "category": "Framework"},
            {"text": "How would you detect a phishing campaign targeting your organisation?", "category": "Phishing"},
            {"text": "Explain indicators of compromise (IOCs) and how you operationalise them.", "category": "Threat Intel"},
            {"text": "How do you assess the risk of a newly disclosed CVE?", "category": "Vulnerability Management"},
            {"text": "What is lateral movement and how would you detect it in network logs?", "category": "Detection"},
            {"text": "How do you differentiate a false positive from a real threat in SIEM alerts?", "category": "SOC"},
        ],
        "Incident Response": [
            {"text": "Walk me through the incident response lifecycle.", "category": "IR Process"},
            {"text": "A server is generating unusual outbound traffic at 3am. What do you do?", "category": "Scenario"},
            {"text": "How do you contain a ransomware attack in progress?", "category": "Scenario"},
            {"text": "What forensic evidence do you collect when investigating a compromised host?", "category": "Forensics"},
            {"text": "How do you conduct a post-mortem after a security incident?", "category": "Post-incident"},
            {"text": "What is chain of custody and why does it matter in investigations?", "category": "Forensics"},
            {"text": "How do you communicate a data breach to executive leadership?", "category": "Communication"},
            {"text": "What is your process for creating and testing an IR playbook?", "category": "Preparation"},
        ],
        "Behavioral": [
            {"text": "Tell me about the most complex security incident you handled.", "category": "Experience"},
            {"text": "How do you keep up with the constantly evolving threat landscape?", "category": "Learning"},
            {"text": "Describe a time you found a critical vulnerability before it was exploited.", "category": "Impact"},
            {"text": "How do you build a security-aware culture across a non-technical organisation?", "category": "Culture"},
            {"text": "Tell me about a time you had to make a security trade-off decision.", "category": "Trade-offs"},
            {"text": "How do you communicate risk to a board that doesn't understand cybersecurity?", "category": "Communication"},
            {"text": "Describe a time you disagreed with a security policy. What did you do?", "category": "Independence"},
            {"text": "How do you manage alert fatigue in a SOC environment?", "category": "Operations"},
        ],
    },

    # ───────────── Cloud Architect ─────────────
    "Cloud Architect": {
        "Cloud Fundamentals": [
            {"text": "What is the shared responsibility model in cloud security?", "category": "Security"},
            {"text": "Explain the difference between vertical and horizontal scaling.", "category": "Scalability"},
            {"text": "What is a VPC and how do you segment it for a 3-tier application?", "category": "Networking"},
            {"text": "How does IAM work in AWS? Explain roles, policies, and principals.", "category": "IAM"},
            {"text": "What is the difference between object, block, and file storage?", "category": "Storage"},
            {"text": "Explain the difference between stateful and stateless applications.", "category": "Architecture"},
            {"text": "What is a CDN and how does it improve performance?", "category": "Networking"},
            {"text": "How do spot/preemptible instances work and when do you use them?", "category": "Cost"},
            {"text": "Explain the concept of eventual consistency in cloud storage.", "category": "Data"},
            {"text": "What is a managed service vs self-hosted and when do you choose each?", "category": "Architecture"},
        ],
        "Architecture Design": [
            {"text": "Design a 3-tier web application architecture on AWS for 1M users.", "category": "Architecture"},
            {"text": "How would you architect a disaster recovery solution with RTO < 1hr?", "category": "DR"},
            {"text": "Design a data lake architecture on GCP for a retail company.", "category": "Data"},
            {"text": "How would you migrate a monolith to microservices on Kubernetes?", "category": "Migration"},
            {"text": "What patterns do you use for inter-service communication in the cloud?", "category": "Microservices"},
            {"text": "How would you architect a zero-trust network on AWS?", "category": "Security"},
            {"text": "Design a serverless event-driven pipeline for IoT data.", "category": "Serverless"},
            {"text": "How would you set up multi-region active-active replication?", "category": "Reliability"},
        ],
        "Security & Cost": [
            {"text": "How do you conduct a cloud cost review and identify savings?", "category": "FinOps"},
            {"text": "What is AWS GuardDuty and how does it detect threats?", "category": "Security"},
            {"text": "How do you enforce compliance (SOC2, HIPAA) in a cloud environment?", "category": "Compliance"},
            {"text": "Explain the principle of least privilege in a cloud IAM context.", "category": "IAM"},
            {"text": "How do you manage secrets and encrypt data at rest and in transit?", "category": "Cryptography"},
            {"text": "What is an AWS Service Control Policy and when do you use it?", "category": "Governance"},
            {"text": "How do you build a FinOps program from scratch at a startup?", "category": "FinOps"},
            {"text": "Describe a cloud security assessment you have conducted.", "category": "Security"},
        ],
        "Behavioral": [
            {"text": "Tell me about the most complex cloud architecture you have designed.", "category": "Technical Depth"},
            {"text": "Describe a major cloud cost reduction initiative you led.", "category": "FinOps Impact"},
            {"text": "How have you handled a major cloud outage affecting customers?", "category": "Incident Response"},
            {"text": "Tell me about a time you improved reliability through architecture changes.", "category": "Reliability"},
            {"text": "How do you align cloud architecture decisions with business objectives?", "category": "Strategy"},
            {"text": "Describe a time you had to convince leadership to adopt a new cloud service.", "category": "Influence"},
            {"text": "How do you stay current with the rapidly evolving cloud landscape?", "category": "Learning"},
            {"text": "Tell me about a cloud migration you led. What were the key challenges?", "category": "Migration"},
        ],
    },
}

# ── Generic fallback (for unknown roles/types) ────────────────────────────────

GENERIC_QUESTIONS: list[dict] = [
    {"text": "Tell me about yourself and your relevant experience.", "category": "Introduction"},
    {"text": "What attracted you to this role and company?", "category": "Motivation"},
    {"text": "Describe the most challenging project you have worked on.", "category": "Experience"},
    {"text": "How do you approach learning a completely new technology?", "category": "Learning"},
    {"text": "Tell me about a time you had to work under tight deadline pressure.", "category": "Time Management"},
    {"text": "How do you handle disagreements with teammates?", "category": "Conflict"},
    {"text": "Describe a time you took initiative beyond your job description.", "category": "Ownership"},
    {"text": "Where do you see yourself in 3 years?", "category": "Career Goals"},
]

# ── Fallback scoring ──────────────────────────────────────────────────────────

FEEDBACK_TEMPLATES = {
    "short": [
        "Your answer was very brief. Use specific examples and elaborate on key points to show depth.",
        "Consider expanding your response with concrete examples. A STAR format (Situation, Task, Action, Result) would strengthen it.",
        "Add more detail — interviewers want to know what you did, how, and what the outcome was.",
    ],
    "medium": [
        "Good answer with solid fundamentals. Quantify your impact with numbers or metrics where possible.",
        "You covered the core concepts well. A real-world example from your experience would make this more compelling.",
        "Solid response. Structuring it more clearly (approach → reasoning → outcome) would make it even stronger.",
    ],
    "long": [
        "Comprehensive answer. Stay focused — lead with your key point, then support with details.",
        "Great depth here. Consider delivering the same value more concisely to demonstrate clear thinking.",
        "Thorough response. Watch for rambling — interviewers appreciate structured, concise delivery.",
    ],
}


def static_score_answer(answer_text: str) -> dict:
    """Heuristic scoring by answer length. Returns same structure as LLM scorer."""
    words = len(answer_text.split())

    if words < 20:
        base = random.randint(45, 62)
        bucket = "short"
    elif words < 80:
        base = random.randint(65, 78)
        bucket = "medium"
    else:
        base = random.randint(72, 88)
        bucket = "long"

    score = min(100, max(10, base + random.randint(-5, 5)))

    def _dim(offset: int = 0) -> int:
        return min(10, max(1, round(score / 10) + offset + random.randint(-1, 1)))

    dimension_scores = {
        "technical_accuracy": _dim(0),
        "relevance": _dim(0),
        "clarity": _dim(-1),
        "completeness": _dim(-1 if bucket == "short" else 0),
        "conciseness": _dim(1 if bucket != "long" else -1),
        "confidence": _dim(0),
    }

    return {
        "score": score,
        "feedback": random.choice(FEEDBACK_TEMPLATES[bucket]),
        "dimension_scores": dimension_scores,
    }


# ── Coaching tips ─────────────────────────────────────────────────────────────

COACHING_TIPS = [
    "Use the STAR method (Situation, Task, Action, Result) for all behavioural answers.",
    "Quantify your impact — numbers like '30% faster' or '50k users served' are far more convincing.",
    "Pause for 2 seconds before answering. It shows confidence and gives you time to structure your thoughts.",
    "Research the company's tech stack and recent news before the interview to make your answers contextual.",
    "When asked about weaknesses or failures, show self-awareness and pivot quickly to what you learned.",
    "Prepare 3–5 strong stories from your experience that can be adapted to different question types.",
    "In system design, always ask clarifying questions before you start drawing — it shows senior thinking.",
    "End each answer with a brief summary. It signals clear communication and helps the interviewer follow.",
    "For technical questions, think aloud. The interviewer cares as much about your process as the answer.",
    "Prepare 3 thoughtful questions to ask the interviewer about the team, challenges, or roadmap.",
]


# ── Public helpers ─────────────────────────────────────────────────────────────

def get_static_questions(
    role: str | None,
    round_type: str | None,
    count: int = 8,
) -> list[dict]:
    """
    Return a shuffled selection of static questions.
    Falls back gracefully if role or round_type is unknown.
    """
    role_data = ROLE_QUESTIONS.get(role or "")
    if role_data:
        pool = role_data.get(round_type or "", [])
        if not pool:
            # Merge all round types for this role
            pool = [q for qs in role_data.values() for q in qs]
    else:
        pool = list(GENERIC_QUESTIONS)

    pool = list(pool)
    random.shuffle(pool)
    return pool[:count]


def get_role_round_types(role: str) -> list[str]:
    """Return the round types available for a given role."""
    return ROLE_ROUND_TYPES.get(role, ["Technical", "Behavioral", "HR"])


def get_static_coaching_tips(n: int = 5) -> list[str]:
    """Return a random selection of coaching tips."""
    return random.sample(COACHING_TIPS, min(n, len(COACHING_TIPS)))


ROLES = list(ROLE_QUESTIONS.keys())

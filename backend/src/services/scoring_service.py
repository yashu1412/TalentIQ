import re

ROLE_SKILLS = {
    "Software Engineer": {
        "must_have": [
            "python", "javascript", "git", "sql", "html", "css", "api", "rest",
            "data structures", "algorithms", "object oriented",
        ],
        "good_to_have": [
            "docker", "react", "fastapi", "node", "typescript", "testing",
            "postgresql", "redis", "linux", "bash", "json", "http",
            "unit testing", "debugging", "version control",
        ],
        "bonus": [
            "kubernetes", "ci/cd", "microservices", "graphql", "kafka",
            "aws", "gcp", "azure", "system design", "websocket",
        ],
        "soft_skills": ["communication", "agile", "problem solving", "teamwork"],
    },
    "Frontend Developer": {
        "must_have": [
            "html", "css", "javascript", "git",
        ],
        "good_to_have": [
            "react", "next.js", "typescript", "redux", "zustand",
            "tailwind", "vite", "api", "framer motion", "animation", "cross-browser", "optimization",
        ],
        "bonus": [
            "three.js", "webgl", "gsap", "react native",
            "storybook", "cypress", "playwright", "web components",
            "pwa", "webassembly", "seo", "accessibility", "webpack", "scss",
        ],
        "soft_skills": ["communication", "teamwork", "attention to detail"],
    },
    "Backend Developer": {
        "must_have": [
            "python", "sql", "api", "rest", "git", "linux",
            "database", "authentication",
        ],
        "good_to_have": [
            "docker", "fastapi", "node", "postgresql", "redis",
            "mongodb", "jwt", "orm", "express", "django",
            "celery", "message queue", "caching", "indexing",
        ],
        "bonus": [
            "kubernetes", "kafka", "graphql", "microservices",
            "grpc", "websocket", "elasticsearch", "aws",
            "rate limiting", "load balancing",
        ],
        "soft_skills": ["leadership", "problem solving", "system design"],
    },
    "Full Stack Developer": {
        "must_have": [
            "javascript", "html", "css", "sql", "git", "api", "rest",
        ],
        "good_to_have": [
            "react", "next.js", "node", "python", "typescript",
            "postgresql", "mongodb", "docker", "jwt", "redux",
            "express", "tailwind", "graphql",
        ],
        "bonus": [
            "kubernetes", "aws", "ci/cd", "websocket", "redis",
            "microservices", "kafka", "prisma",
        ],
        "soft_skills": ["communication", "agile", "problem solving"],
    },
    "Data Scientist": {
        "must_have": [
            "python", "pandas", "numpy", "sql", "statistics",
            "data analysis", "visualization",
        ],
        "good_to_have": [
            "scikit-learn", "tensorflow", "pytorch", "matplotlib",
            "jupyter", "seaborn", "plotly", "feature engineering",
            "regression", "classification", "clustering",
        ],
        "bonus": [
            "spark", "mlflow", "airflow", "deep learning",
            "nlp", "computer vision", "time series", "a/b testing",
        ],
        "soft_skills": ["communication", "storytelling", "critical thinking"],
    },
    "Machine Learning Engineer": {
        "must_have": [
            "python", "pytorch", "tensorflow", "scikit-learn", "sql",
            "linear algebra", "probability",
        ],
        "good_to_have": [
            "mlflow", "docker", "fastapi", "aws", "transformers",
            "hugging face", "model deployment", "feature store",
            "data pipeline", "vector database",
        ],
        "bonus": [
            "cuda", "onnx", "triton", "rlhf", "langchain",
            "ray", "dask", "quantization", "lora", "fine-tuning",
        ],
        "soft_skills": ["research", "communication", "experimentation"],
    },
    "DevOps Engineer": {
        "must_have": [
            "linux", "docker", "ci/cd", "git", "bash",
            "networking", "scripting",
        ],
        "good_to_have": [
            "kubernetes", "terraform", "ansible", "aws", "prometheus",
            "github actions", "jenkins", "nginx", "logging", "monitoring",
        ],
        "bonus": [
            "argocd", "helm", "istio", "grafana", "ebpf",
            "vault", "pulumi", "chaos engineering",
        ],
        "soft_skills": ["automation", "problem solving", "reliability"],
    },
    "Cloud Architect": {
        "must_have": [
            "aws", "cloud", "networking", "iam", "terraform",
            "security", "storage",
        ],
        "good_to_have": [
            "kubernetes", "docker", "ci/cd", "monitoring",
            "lambda", "s3", "vpc", "rds", "cloudwatch",
        ],
        "bonus": [
            "multi-cloud", "finops", "zero trust", "sre",
            "chaos engineering", "service mesh", "waf",
        ],
        "soft_skills": ["architecture", "communication", "cost optimization"],
    },
    "Cybersecurity Analyst": {
        "must_have": [
            "networking", "linux", "python", "security", "owasp",
            "vulnerability assessment",
        ],
        "good_to_have": [
            "siem", "penetration testing", "cryptography", "firewall",
            "incident response", "nmap", "burp suite", "kali linux",
        ],
        "bonus": [
            "metasploit", "wireshark", "splunk", "mitre att&ck",
            "reverse engineering", "malware analysis", "threat hunting",
        ],
        "soft_skills": ["analytical thinking", "communication", "attention to detail"],
    },
    "Product Manager": {
        "must_have": [
            "product", "agile", "sql", "analytics", "roadmap",
            "stakeholders", "user stories",
        ],
        "good_to_have": [
            "figma", "jira", "a/b testing", "okr", "user research",
            "confluence", "metrics", "kpi", "sprint", "backlog",
        ],
        "bonus": [
            "data science", "growth", "api", "stakeholder management",
            "go-to-market", "competitive analysis", "pricing",
        ],
        "soft_skills": ["leadership", "communication", "strategy", "empathy"],
    },
    "UX Designer": {
        "must_have": [
            "figma", "user research", "wireframing", "prototyping", "usability",
        ],
        "good_to_have": [
            "design systems", "accessibility", "html", "css", "sketch",
            "user testing", "information architecture", "heuristics",
        ],
        "bonus": [
            "motion design", "framer", "ux writing", "3d",
            "adobe xd", "lottie", "after effects",
        ],
        "soft_skills": ["empathy", "communication", "creativity", "storytelling"],
    },
    "Android Developer": {
        "must_have": [
            "kotlin", "android", "java", "xml", "git",
        ],
        "good_to_have": [
            "jetpack compose", "mvvm", "retrofit", "room", "coroutines",
            "hilt", "navigation component", "firebase", "rest api",
        ],
        "bonus": [
            "flutter", "kotlin multiplatform", "work manager",
            "custom views", "ndk", "play store publishing",
        ],
        "soft_skills": ["attention to detail", "problem solving"],
    },
    "iOS Developer": {
        "must_have": [
            "swift", "ios", "xcode", "uikit", "git",
        ],
        "good_to_have": [
            "swiftui", "combine", "coredata", "alamofire",
            "mvvm", "rest api", "firebase", "cocoapods",
        ],
        "bonus": [
            "flutter", "react native", "arkit", "metal",
            "app store publishing", "push notifications",
        ],
        "soft_skills": ["attention to detail", "problem solving"],
    },
    "Blockchain Developer": {
        "must_have": [
            "solidity", "ethereum", "smart contracts", "web3", "javascript",
        ],
        "good_to_have": [
            "hardhat", "truffle", "react", "ethers.js", "ipfs",
            "metamask", "defi", "erc20", "erc721",
        ],
        "bonus": [
            "rust", "solana", "polkadot", "zero knowledge",
            "layer2", "chainlink", "dao",
        ],
        "soft_skills": ["problem solving", "research"],
    },
    # Legacy snake_case keys — kept for backward compatibility
    "fullstack_developer": {
        "must_have": ["javascript", "react", "python", "node", "sql", "html", "css"],
        "good_to_have": ["docker", "aws", "typescript", "next.js", "postgresql", "mongodb"],
        "bonus": ["kubernetes", "graphql", "ci/cd", "redis", "websocket"],
        "soft_skills": ["communication", "agile"],
    },
    "frontend_developer": {
        "must_have": ["html", "css", "javascript"],
        "good_to_have": ["react", "next.js", "typescript", "redux", "zustand", "tailwind"],
        "bonus": ["three.js", "webgl", "framer motion", "gsap", "storybook"],
        "soft_skills": ["communication", "teamwork"],
    },
    "backend_developer": {
        "must_have": ["python", "sql", "api", "rest", "git"],
        "good_to_have": ["docker", "postgresql", "redis", "fastapi", "node", "jwt", "orm"],
        "bonus": ["kubernetes", "kafka", "graphql", "microservices", "elasticsearch"],
        "soft_skills": ["leadership", "problem solving"],
    },
}

EXPERIENCE_WEIGHTS = {
    "fresher": {"projects_weight": 0.9, "exp_weight": 0.1},
    "mid":     {"projects_weight": 0.6, "exp_weight": 0.4},
    "senior":  {"projects_weight": 0.4, "exp_weight": 0.6},
}

# ── Final component weights per experience level ──────────────────────────────
# Skills     : keyword matching against role skill list (must-have / nice-to-have / bonus)
# Experience : projects count + years (ratio controlled by EXPERIENCE_WEIGHTS above)
# Impact     : quantifiable metrics found in resume (%, xN, numbers)
# Formatting : presence of key resume sections
# Alignment  : overall role-keyword density (skipped for freshers)
FINAL_WEIGHTS = {
    "fresher": {
        "skills":      0.50,
        "experience":  0.30,
        "impact":      0.10,
        "formatting":  0.10,
        "alignment":   0.00,
    },
    "mid": {
        "skills":      0.40,
        "experience":  0.25,
        "impact":      0.15,
        "formatting":  0.10,
        "alignment":   0.10,
    },
    "senior": {
        "skills":      0.35,
        "experience":  0.30,
        "impact":      0.15,
        "formatting":  0.05,
        "alignment":   0.15,
    },
}

# 6 sections checked in formatting (each worth ~16.67 pts → 100 when all present)
FORMATTING_SECTIONS = [
    # (display_name, list_of_keywords_to_detect)
    ("Education",                  ["education"]),
    ("Projects",                   ["projects", "project"]),
    ("Skills",                     ["skills", "technical skills", "key skills"]),
    ("Certifications",             ["certification", "certifications", "certificate", "courses"]),
    ("Position of Responsibility", ["position of responsibility", "Position of Responsibility & Achievement", "leadership",
                                    "achievement", "achievements", "activities",
                                    "extracurricular", "extra-curricular", "volunteer"]),
    ("Experience",                 ["experience", "work experience", "internship", "internships"]),
]

def extract_skills(resume_text):
    resume_text = resume_text.lower()
    detected = set()

    for role in ROLE_SKILLS.values():
        for category in role.values():
            for skill in category:
                if skill in resume_text:
                    detected.add(skill)

    return list(detected)

def extract_metrics(resume_text: str) -> list:
    """
    Extract quantifiable achievements: percentages, X-multipliers,
    and K/M suffixed numbers (50K+, 5M, etc.) — not bare years or versions.
    """
    return re.findall(
        r'\d+(?:\.\d+)?%'         # 50%, 3.5%
        r'|\d+(?:\.\d+)?x\b'      # 10x, 2.5x
        r'|\d+[KkMmBb]\+?'        # 50K+, 5M, 2B
        r'|\d+\s*(?:percent|times)\b',  # 30 percent, 10 times
        resume_text,
    )

def count_projects(resume_text: str) -> int:
    """
    Count distinct projects by finding the Projects section and counting
    top-level bullet entries (lines starting with *, -, or \u2022 that are
    not sub-bullets / description lines).
    Falls back to counting '* <Title>' patterns anywhere if no section found.
    """
    text = resume_text
    lines = text.split("\n")

    # Find the Projects section boundaries
    in_projects = False
    project_count = 0
    SECTION_HEADERS = {
        "education", "experience", "work experience", "skills", "technical skills",
        "certifications", "position of responsibility", "achievements",
        "activities", "honors", "awards", "publications",
    }

    for line in lines:
        stripped = line.strip()
        lower = stripped.lower()

        # Detect Projects section start
        if lower in ("projects", "projects:", "personal projects", "academic projects"):
            in_projects = True
            continue

        # Detect another section starting (end of Projects)
        if in_projects and any(lower.startswith(h) for h in SECTION_HEADERS):
            break

        if in_projects:
            # Top-level bullet = starts with *, -, \u2022 and is NOT indented / sub-bullet
            is_top_bullet = (
                stripped.startswith(("*", "-", "\u2022"))
                and not line.startswith(("   ", "\t", "  -", "  *", "  \u25e6", "  \u2022"))
                and len(stripped) > 3
            )
            if is_top_bullet:
                project_count += 1

    # Fallback: if section detection missed, count top-level bullets under any
    # line containing "projects" within 3 lines above
    if project_count == 0:
        project_count = max(1, resume_text.lower().count("project") - 1)

    return project_count

def estimate_experience_years(resume_text):
    matches = re.findall(r'(\d+)\+?\s?(years|yrs)', resume_text.lower())
    return sum(int(m[0]) for m in matches) if matches else 0

def skill_score(skills: list, role: str) -> dict:
    """Return score + matched/missing breakdown per tier."""
    if role not in ROLE_SKILLS:
        role = "Software Engineer"  # fallback
    role_data = ROLE_SKILLS[role]

    TIER_WEIGHTS = {"must_have": 3, "good_to_have": 2, "bonus": 1}

    total_points  = 0
    earned_points = 0
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    tier_detail: dict = {}

    for tier, weight in TIER_WEIGHTS.items():
        required = role_data.get(tier, [])
        matched  = [s for s in required if s in skills]
        missing  = [s for s in required if s not in skills]

        total_points  += len(required) * weight
        earned_points += len(matched)  * weight
        matched_skills.extend(matched)
        missing_skills.extend(missing)

        tier_detail[tier] = {
            "matched": matched,
            "missing": missing,
            "score":   round((len(matched) / len(required) * 100) if required else 0, 1),
        }

    score = (earned_points / total_points * 100) if total_points else 0
    return {
        "score":          round(score, 2),
        "matched":        matched_skills,
        "missing":        missing_skills,
        "matched_count":  len(matched_skills),
        "total_required": sum(len(role_data.get(t, [])) for t in TIER_WEIGHTS),
        "tiers":          tier_detail,
    }

def experience_score(projects, years, level):
    if level not in EXPERIENCE_WEIGHTS:
        level = "fresher"  # fallback
    weights = EXPERIENCE_WEIGHTS[level]

    # 3+ projects = perfect project score (realistic bar for students/freshers)
    project_score = min(projects / 3, 1) * 100
    exp_score = min(years / 5, 1) * 100

    final = (
        project_score * weights["projects_weight"] +
        exp_score * weights["exp_weight"]
    )

    return final

def impact_score(metrics):
    count = len(metrics)
    return min(count / 5, 1) * 100

def formatting_score(resume_text: str) -> dict:
    """Check 6 resume sections; each contributes equally to 100 pts."""
    text = resume_text.lower()
    per_section = round(100 / len(FORMATTING_SECTIONS), 2)
    found: list[str]   = []
    missing: list[str] = []

    for name, keywords in FORMATTING_SECTIONS:
        if any(kw in text for kw in keywords):
            found.append(name)
        else:
            missing.append(name)

    score = round(len(found) * per_section, 2)
    return {
        "score":   min(score, 100.0),
        "found":   found,
        "missing": missing,
        "detail":  {name: (name in found) for name, _ in FORMATTING_SECTIONS},
    }

def role_alignment_score(resume_text, role):
    if role not in ROLE_SKILLS:
        role = "Software Engineer"
    role_keywords = sum((ROLE_SKILLS[role][cat] for cat in ROLE_SKILLS[role] if isinstance(ROLE_SKILLS[role][cat], list)), [])
    matches = sum(1 for kw in role_keywords if kw in resume_text.lower())

    return min(matches / len(role_keywords), 1) * 100 if role_keywords else 0

def extract_resume_data(text):
    """Simple heuristic parser to extract structured data without LLM."""
    lines = text.split('\n')
    sections = {}
    current_section = None
    
    headers = {
        "education": "education",
        "experience": "experience",
        "work experience": "experience",
        "skills": "skills",
        "projects": "projects"
    }
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        lower_line = line_clean.lower()
        # Detect headers
        matched_header = None
        for h, map_key in headers.items():
            if lower_line == h or (lower_line.startswith(h) and len(lower_line) < 25):
                matched_header = map_key
                break
                
        if matched_header:
            current_section = matched_header
            if current_section not in sections:
                sections[current_section] = []
            continue
            
        if current_section:
            sections[current_section].append(line_clean)
            
    parsed = {
        "skills": [],
        "experience": [],
        "education": [],
        "projects": []
    }
    
    # Parse Skills
    if "skills" in sections:
        for line in sections["skills"]:
            parts = re.split(r'[,|•:—-]', line)
            for p in parts:
                p = p.strip()
                if 1 < len(p) < 50:
                    parsed["skills"].append(p)
                    
    # Parse Experience
    if "experience" in sections:
        current_item = None
        for line in sections["experience"]:
            if line.startswith("•"):
                if current_item:
                    parsed["experience"].append(current_item)
                current_item = {
                    "company": line.lstrip("• ").strip(),
                    "role": "",
                    "duration": "",
                    "bullets": []
                }
            elif not current_item:
                current_item = {
                    "company": line.lstrip("•-◦ ").strip(),
                    "role": "",
                    "duration": "",
                    "bullets": []
                }
            else:
                is_bullet = line.startswith("◦") or line.startswith("-")
                clean_text = line.lstrip("◦- ").strip()
                
                if clean_text:
                    if is_bullet:
                        current_item["bullets"].append(clean_text)
                    elif not current_item["bullets"]:
                        # Append to role or duration
                        if re.search(r'\d{4}', clean_text) and len(clean_text) < 30:
                            current_item["duration"] = clean_text
                        else:
                            current_item["role"] += (" " + clean_text if current_item["role"] else clean_text)
                    else:
                        # Continuation of the last bullet
                        if current_item["bullets"]:
                            current_item["bullets"][-1] += " " + clean_text
                        else:
                            current_item["bullets"].append(clean_text)

        if current_item:
            parsed["experience"].append(current_item)
            
    # Parse Projects
    if "projects" in sections:
        current_item = None
        for line in sections["projects"]:
            if line.startswith("•"):
                if current_item:
                    # Clean up description
                    current_item["description"] = current_item["description"].strip()
                    parsed["projects"].append(current_item)
                current_item = {
                    "name": line.lstrip("• ").strip(),
                    "tech": [],
                    "description": ""
                }
            elif not current_item:
                current_item = {
                    "name": line.lstrip("•-◦ ").strip(),
                    "tech": [],
                    "description": ""
                }
            elif line.startswith("Tools:"):
                tech_str = line.replace("Tools:", "").strip()
                tech_str = re.sub(r'\[.*?\]', '', tech_str).strip() # Removes "[§] [Live Link]"
                current_item["tech"] = [t.strip() for t in tech_str.split(",") if t.strip()]
            else:
                lower_line = line.lower()
                if "live link" in lower_line or "[§]" in lower_line:
                    continue
                
                is_bullet = line.startswith("◦") or line.startswith("-")
                clean_text = line.lstrip("◦- ").strip()
                
                if not current_item["description"]:
                    if len(clean_text) < 30 and bool(re.search(r'\d{4}', clean_text)):
                         current_item["name"] += f" ({clean_text})"
                         continue
                         
                if clean_text:
                    if is_bullet:
                        current_item["description"] += "\n• " + clean_text
                    else:
                        # Continuation of the previous text
                        if current_item["description"]:
                             current_item["description"] += " " + clean_text
                        else:
                             current_item["description"] += clean_text
                        
        if current_item:
            current_item["description"] = current_item["description"].strip()
            parsed["projects"].append(current_item)

    # Parse Education — smart grouping by line type
    if "education" in sections:
        current_item = None

        def _is_date_line(ln: str) -> bool:
            """Lines that contain a 4-digit year and are short (date ranges)."""
            return bool(re.search(r'\b(19|20)\d{2}\b', ln)) and len(ln.strip()) < 65

        def _is_location_line(ln: str) -> bool:
            """Short 'City, Country' or 'City, State' patterns."""
            s = ln.strip()
            return (
                bool(re.match(r'^[A-Z][a-zA-Z\s\-]+,\s*[A-Z][a-zA-Z\s]+$', s))
                and len(s) < 50
            )

        def _is_degree_line(ln: str) -> bool:
            """Lines that contain recognisable qualification keywords."""
            degree_kws = [
                "b.tech", "m.tech", "b.e", "m.e", "b.sc", "m.sc", "b.com", "mba",
                "bachelor", "master", "ph.d", "diploma", "higher secondary",
                "secondary education", "cbse", "icse", "10th", "12th",
                "engineering", "science", "arts", "commerce",
            ]
            lower = ln.lower()
            return any(k in lower for k in degree_kws) and len(ln) < 140

        for line in sections["education"]:
            line = line.strip()
            if not line:
                continue
            if line.startswith(("•", "-", "◦")):
                continue  # skip bullet points inside education

            if _is_date_line(line):
                # Date line: start a new entry if current already has a year
                if current_item is None:
                    current_item = {"school": "", "degree": "", "year": line, "location": ""}
                elif current_item.get("year"):
                    parsed["education"].append(current_item)
                    current_item = {"school": "", "degree": "", "year": line, "location": ""}
                else:
                    current_item["year"] = line

            elif _is_location_line(line):
                if current_item is None:
                    current_item = {"school": "", "degree": "", "year": "", "location": line}
                else:
                    current_item["location"] = line

            elif _is_degree_line(line):
                if current_item is None:
                    current_item = {"school": "", "degree": line, "year": "", "location": ""}
                elif current_item.get("degree"):
                    current_item["degree"] += " " + line  # continuation
                else:
                    current_item["degree"] = line

            else:
                # Treat as institution / school name
                if current_item is None:
                    current_item = {"school": line, "degree": "", "year": "", "location": ""}
                elif current_item.get("school"):
                    # Already have a school → save current, start new entry
                    parsed["education"].append(current_item)
                    current_item = {"school": line, "degree": "", "year": "", "location": ""}
                else:
                    current_item["school"] = line

        if current_item:
            parsed["education"].append(current_item)

    return parsed

def calculate_ats_score(
    resume_text: str,
    role: str = "frontend_developer",
    level: str = "fresher",
) -> dict:
    """
    Score a resume against a target role and experience level.

    Fresher formula  : Skills 50% | Projects 30% | Impact 10% | Formatting 10%
    Mid formula      : Skills 40% | Experience 25% | Impact 15% | Formatting 10% | Alignment 10%
    Senior formula   : Skills 35% | Experience 30% | Impact 15% | Formatting 5%  | Alignment 15%
    """
    if not resume_text:
        return {
            "final_score": 0,
            "breakdown":   {"skills": 0, "experience": 0, "impact": 0, "formatting": 0, "alignment": 0},
            "skill_match": {"matched": [], "missing": [], "matched_count": 0, "total_required": 0, "tiers": {}},
            "section_check": {"found": [], "missing": [], "detail": {}},
            "extracted":   {"skills": [], "metrics": [], "projects_count": 0, "years_experience": 0},
            "weights_used": FINAL_WEIGHTS.get(level, FINAL_WEIGHTS["fresher"]),
        }

    if level not in FINAL_WEIGHTS:
        level = "fresher"

    weights = FINAL_WEIGHTS[level]

    # ── Extract raw signals ──────────────────────────────────────────────────
    detected_skills = extract_skills(resume_text)
    metrics         = extract_metrics(resume_text)
    projects        = count_projects(resume_text)
    years           = estimate_experience_years(resume_text)

    # ── Compute component scores ─────────────────────────────────────────────
    skill_result   = skill_score(detected_skills, role)          # dict
    e_score        = experience_score(projects, years, level)    # 0–100
    i_score        = impact_score(metrics)                       # 0–100
    fmt_result     = formatting_score(resume_text)               # dict
    r_score        = role_alignment_score(resume_text, role)     # 0–100

    s_val = skill_result["score"]
    f_val = fmt_result["score"]

    final_score = (
        weights["skills"]     * s_val  +
        weights["experience"] * e_score +
        weights["impact"]     * i_score +
        weights["formatting"] * f_val  +
        weights["alignment"]  * r_score
    )

    return {
        "final_score": round(final_score, 2),

        # ── Per-component scores (0–100 each) ──
        "breakdown": {
            "skills":     round(s_val,   2),
            "experience": round(e_score, 2),
            "impact":     round(i_score, 2),
            "formatting": round(f_val,   2),
            "alignment":  round(r_score, 2),
        },

        # ── Skill match/gap detail ──────────────────────────────────────────
        "skill_match": {
            "matched":        skill_result["matched"],
            "missing":        skill_result["missing"],
            "matched_count":  skill_result["matched_count"],
            "total_required": skill_result["total_required"],
            "tiers":          skill_result["tiers"],
        },

        # ── Section presence check ──────────────────────────────────────────
        "section_check": {
            "found":   fmt_result["found"],
            "missing": fmt_result["missing"],
            "detail":  fmt_result["detail"],
        },

        # ── Raw extracted signals ───────────────────────────────────────────
        "extracted": {
            "skills":           detected_skills,
            "metrics":          metrics,
            "projects_count":   projects,
            "years_experience": years,
        },

        # ── Which weights were applied ──────────────────────────────────────
        "weights_used": weights,
        "level":        level,
        "role":         role,
    }

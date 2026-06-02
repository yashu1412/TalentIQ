"""
ycombinator.py — Playwright-based bot for Y Combinator's job board (Work at a Startup).
"""
import asyncio
import os
import random
import traceback
from rich.console import Console
from src.autobot.core.browser import BrowserEngine
from src.autobot.core.ai_handler import AIHandler

console = Console()

def log_info(msg):  console.print(f"  [cyan][YC] ℹ {msg}[/cyan]")
def log_ok(msg):    console.print(f"  [green][YC] ✅ {msg}[/green]")
def log_err(msg, err=""): console.print(f"  [red][YC] ❌ {msg} {err}[/red]")
def log_warn(msg):  console.print(f"  [yellow][YC] ⚠️ {msg}[/yellow]")
def log_step(step, msg): console.print(f"\n[bold blue][YC] ▶ {step}:[/bold blue] {msg}")

YC_BASE  = "https://www.workatastartup.com"
YC_LOGIN = f"{YC_BASE}/login"
YC_JOBS  = f"{YC_BASE}/jobs"


class YCombinatorBot:
    PLATFORM = "YCombinator"

    def __init__(self, profile: dict, prefs: dict, dedup):
        self.profile = profile
        self.prefs   = prefs
        self.dedup   = dedup
        self.ai      = AIHandler(config=profile.get("ai", profile))
        self.browser_engine = BrowserEngine()
        self.session_count  = 0

        creds = profile.get("platforms", {}).get("ycombinator", {})
        self.email    = creds.get("email", "") or os.environ.get("YC_EMAIL", "") or profile.get("credentials", {}).get("yc_email", "")
        self.password = creds.get("password", "") or os.environ.get("YC_PASSWORD", "") or profile.get("credentials", {}).get("yc_password", "")

        platform_cfg = prefs.get("platforms", {}).get("ycombinator", {})
        self.max_per_session = int(platform_cfg.get("max_per_session", 10))
        self.max_jobs_per_kw = 1

    async def run_cycle(self, page, country_config: dict | None = None):
        keywords = self.prefs.get("keywords", ["Software Engineer"])

        console.print(f"\n[bold magenta]{'='*60}[/bold magenta]")
        console.print(f"[bold magenta]  🚀 [YC] SESSION — Work at a Startup  |  Roles: {len(keywords)}[/bold magenta]")
        console.print(f"[bold magenta]{'='*60}[/bold magenta]\n")

        log_step("1/2", "Login")
        try:
            await self._ensure_login(page)
        except Exception as e:
            log_err("Login failed — aborting YC session.", str(e))
            return

        log_step("2/2", "Search & Apply")
        total_applied = 0

        for kw_idx, keyword in enumerate(keywords, 1):
            if total_applied >= self.max_per_session:
                log_info(f"Reached session limit ({self.max_per_session}).")
                break

            console.print(f"\n[bold cyan]  🔑 Keyword [{kw_idx}/{len(keywords)}]: '{keyword}'[/bold cyan]")

            try:
                job_links = await self._collect_job_links(page, keyword)
                log_ok(f"Found {len(job_links)} YC job listings.")
            except Exception as e:
                log_err(f"Search failed for '{keyword}'", str(e))
                continue

            processed_this_kw = 0
            for idx, (job_id, job_url) in enumerate(job_links):
                if total_applied >= self.max_per_session:
                    break
                if processed_this_kw >= self.max_jobs_per_kw:
                    log_info(f"Reached keyword limit. Moving to next keyword.")
                    break
                if self.dedup.is_applied(job_id):
                    log_info(f"Already processed {job_id}, skipping.")
                    continue

                log_step(f"Job {idx+1}/{len(job_links)}", job_id)
                try:
                    await page.goto(job_url, wait_until="domcontentloaded", timeout=30000)
                    await asyncio.sleep(random.uniform(2, 4))

                    title, company, location = await self._extract_job_meta(page)
                    applied = await self._try_apply(page, job_id, title, company, location, job_url)

                    if applied:
                        total_applied += 1
                        self.session_count += 1
                        await asyncio.sleep(random.randint(10, 20))
                    else:
                        await asyncio.sleep(random.randint(3, 7))
                    processed_this_kw += 1
                except Exception as e:
                    log_err(f"Error on {job_url}", str(e))

        log_ok(f"Session complete — applied to {total_applied} YC startup jobs.")

    async def _ensure_login(self, page):
        await page.goto(YC_BASE, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        if await page.query_selector(".user-avatar, [data-test='user-menu'], a[href*='/profile']"):
            log_ok("Already logged in to Work at a Startup.")
            return

        log_info("Navigating to YC login…")
        await page.goto(YC_LOGIN, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        email_inp = await page.query_selector("input[type='email'], input[name='email']")
        pwd_inp   = await page.query_selector("input[type='password'], input[name='password']")

        if not email_inp or not pwd_inp:
            log_warn("YC login form not found — may need manual login.")
            await asyncio.sleep(15)
            return

        await email_inp.fill(self.email)
        await asyncio.sleep(random.uniform(0.5, 1))
        await pwd_inp.fill(self.password)
        await asyncio.sleep(random.uniform(0.5, 1))

        submit = await page.query_selector("button[type='submit'], button:has-text('Sign in'), button:has-text('Log in')")
        if submit:
            await submit.click()
        else:
            await pwd_inp.press("Enter")

        await asyncio.sleep(4)
        log_ok("YC login submitted.")

    async def _collect_job_links(self, page, keyword: str) -> list[tuple[str, str]]:
        kw_enc = keyword.replace(" ", "%20")
        url = f"{YC_JOBS}?q={kw_enc}&remote=true"

        log_info(f"Searching: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        results = []
        seen = set()

        anchors = await page.query_selector_all(
            "a[href*='/companies/'][href*='/jobs/'], a[href*='/jobs/']"
        )
        for a in anchors:
            try:
                href = await a.get_attribute("href") or ""
                if "/jobs/" not in href:
                    continue
                full_url = href if href.startswith("http") else f"{YC_BASE}{href}"
                slug = href.rstrip("/").replace("/companies/", "").replace("/jobs/", "_job_")
                job_id = f"yc_{slug.strip('/').replace('/', '_')}"
                if job_id not in seen:
                    seen.add(job_id)
                    results.append((job_id, full_url))
            except Exception:
                pass

        return results

    async def _extract_job_meta(self, page) -> tuple[str, str, str]:
        async def _txt(selectors):
            for s in selectors:
                try:
                    el = await page.query_selector(s)
                    if el:
                        t = (await el.inner_text()).strip()
                        if t:
                            return t
                except Exception:
                    pass
            return ""

        title   = await _txt(["h1", ".job-name", ".role-title"])
        company = await _txt(["h2 a", ".company-name a", ".company-name", ".startup-name"])
        loc     = await _txt([".job-location", "[class*='location']", ".remote-label"])
        return title or "Unknown Title", company or "Unknown Company", loc or "Remote"

    async def _try_apply(self, page, job_id: str, title: str, company: str, location: str, url: str) -> bool:
        resume_path = os.path.abspath(
            self.profile.get("cv", {}).get("cv_path", "active_resume.pdf")
        )

        apply_btn = None
        for sel in [
            "button:has-text('Apply')",
            "a:has-text('Apply')",
            "[data-test='apply-button']",
            "a.apply-btn",
            "button.apply-btn",
        ]:
            try:
                el = await page.wait_for_selector(sel, state="visible", timeout=3000)
                if el:
                    apply_btn = el
                    break
            except Exception:
                pass

        if not apply_btn:
            log_warn(f"No Apply button for {job_id} — saving as External.")
            self.dedup.mark_applied(job_id, self.PLATFORM, "External - Ready", {
                "company": company, "title": title, "location": {"raw": location},
                "external_url": url,
            })
            return False

        await apply_btn.click()
        await asyncio.sleep(2)

        success = await self._handle_apply_form(page, resume_path, company)
        status = "Submitted" if success else "Stuck - Manual Action Needed"
        self.dedup.mark_applied(job_id, self.PLATFORM, status, {
            "company": company, "title": title, "location": {"raw": location},
            "resume_used": resume_path if success else None, "external_url": url,
        })
        if success:
            log_ok(f"Applied to '{title}' at {company} ✅")
        else:
            log_warn(f"Stuck on '{title}' at {company}.")
        return success

    async def _handle_apply_form(self, page, resume_path: str, company: str) -> bool:
        for step in range(1, 8):
            log_info(f"Form step {step}…")
            await asyncio.sleep(2)

            try:
                fi = page.locator("input[type='file']")
                if await fi.count() > 0 and os.path.exists(resume_path):
                    await fi.first.set_input_files(resume_path)
                    await asyncio.sleep(1)
                    log_ok("Uploaded resume.")
            except Exception:
                pass

            try:
                textarea = await page.query_selector(
                    "textarea[placeholder*='interest'], textarea[placeholder*='why'], "
                    "textarea[placeholder*='about'], textarea"
                )
                if textarea:
                    name = self.profile.get("personal", {}).get("full_name", "Applicant")
                    role = self.profile.get("experience", {}).get("current_title", "developer")
                    yoe  = self.profile.get("experience", {}).get("years_of_experience", 1)
                    intro = (
                        f"Hi, I'm {name}, a {role} with {yoe} years of experience. "
                        f"I'm passionate about building impactful products and excited to contribute to {company}."
                    )
                    await textarea.fill(intro)
                    await asyncio.sleep(1)
            except Exception:
                pass

            for btn_sel in [
                "button:has-text('Submit')",
                "button:has-text('Apply')",
                "button:has-text('Send Application')",
                "button:has-text('Next')",
                "button[type='submit']",
            ]:
                try:
                    btn = await page.wait_for_selector(btn_sel, state="visible", timeout=2000)
                    if not btn:
                        continue
                    btn_text = (await btn.inner_text()).lower()
                    await btn.click(force=True)
                    await asyncio.sleep(2)
                    if "submit" in btn_text or "apply" in btn_text or "send" in btn_text:
                        return True
                    break
                except Exception:
                    pass

        return False

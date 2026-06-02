"""
naukri.py — Playwright-based bot for Naukri.com.
Searches jobs by keyword + location, applies via "Easy Apply" flow.
"""
import asyncio
import os
import random
import traceback
from rich.console import Console
from src.autobot.core.browser import BrowserEngine
from src.autobot.core.ai_handler import AIHandler

console = Console()

def log_info(msg):  console.print(f"  [cyan][NAUKRI] ℹ {msg}[/cyan]")
def log_ok(msg):    console.print(f"  [green][NAUKRI] ✅ {msg}[/green]")
def log_err(msg, err=""): console.print(f"  [red][NAUKRI] ❌ {msg} {err}[/red]")
def log_warn(msg):  console.print(f"  [yellow][NAUKRI] ⚠️ {msg}[/yellow]")
def log_step(step, msg): console.print(f"\n[bold blue][NAUKRI] ▶ {step}:[/bold blue] {msg}")

NAUKRI_BASE = "https://www.naukri.com"
LOGIN_URL   = f"{NAUKRI_BASE}/nlogin/login"


class NaukriBot:
    PLATFORM = "Naukri"

    def __init__(self, profile: dict, prefs: dict, dedup):
        self.profile = profile
        self.prefs   = prefs
        self.dedup   = dedup
        self.ai      = AIHandler(config=profile.get("ai", profile))
        self.browser_engine = BrowserEngine()
        self.session_count  = 0

        creds = profile.get("platforms", {}).get("naukri", {})
        self.email    = creds.get("email", "") or os.environ.get("NAUKRI_EMAIL", "") or profile.get("credentials", {}).get("naukri_email", "")
        self.password = creds.get("password", "") or os.environ.get("NAUKRI_PASSWORD", "") or profile.get("credentials", {}).get("naukri_password", "")
        self.use_sso  = not bool(self.password)

        platform_cfg = prefs.get("platforms", {}).get("naukri", {})
        self.max_per_session = int(platform_cfg.get("max_per_session", 15))
        self.max_jobs_per_kw = 1

    async def run_cycle(self, page, country_config: dict | None = None):
        country  = country_config["country"] if country_config else "India"
        keywords = self.prefs.get("keywords", ["Software Engineer"])

        console.print(f"\n[bold magenta]{'='*60}[/bold magenta]")
        console.print(f"[bold magenta]  🌍 [NAUKRI] SESSION: {country}  |  Roles: {len(keywords)}[/bold magenta]")
        console.print(f"[bold magenta]{'='*60}[/bold magenta]\n")

        log_step("1/2", "Login")
        try:
            await self._ensure_login(page)
        except Exception as e:
            log_err("Login failed — aborting Naukri session.", str(e))
            return

        log_step("2/2", "Search & Apply")
        total_applied = 0

        for kw_idx, keyword in enumerate(keywords, 1):
            if total_applied >= self.max_per_session:
                log_info(f"Reached session limit ({self.max_per_session}). Stopping.")
                break

            console.print(f"\n[bold cyan]  🔑 Keyword [{kw_idx}/{len(keywords)}]: '{keyword}' @ {country}[/bold cyan]")

            try:
                job_links = await self._collect_job_links(page, keyword, country)
                log_ok(f"Found {len(job_links)} job listings.")
            except Exception as e:
                log_err(f"Search failed for '{keyword}'", str(e))
                continue

            processed_this_kw = 0
            for idx, (job_id, job_url) in enumerate(job_links):
                if total_applied >= self.max_per_session:
                    break
                if processed_this_kw >= self.max_jobs_per_kw:
                    log_info(f"Reached keyword limit ({self.max_jobs_per_kw} processed). Next keyword.")
                    break
                if self.dedup.is_applied(job_id):
                    log_info(f"Already applied to {job_id}, skipping.")
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
                    log_err(f"Error on job {job_url}", str(e))

        log_ok(f"Session complete — applied to {total_applied} jobs on Naukri.")

    async def _ensure_login(self, page):
        await page.goto(NAUKRI_BASE, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        logged_in_selectors = [
            "a.nI-gNb-drawer__bars",
            ".nI-gNb-user-type",
            "[class*='loggedIn']",
            ".naukri-logo-login",
            "[class*='userInfo']",
        ]
        for sel in logged_in_selectors:
            if await page.query_selector(sel):
                log_ok("Already logged in to Naukri (session active).")
                return

        if self.use_sso:
            log_info("SSO mode — attempting Google login on Naukri…")
            await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)

            google_btn = None
            for sel in [
                "button:has-text('Sign in with Google')",
                "a:has-text('Sign in with Google')",
                "[data-logintype='google']",
                ".google-login",
            ]:
                try:
                    el = await page.wait_for_selector(sel, state="visible", timeout=3000)
                    if el:
                        google_btn = el
                        break
                except Exception:
                    pass

            if google_btn:
                log_info("Clicking Google Sign-in button…")
                await google_btn.click()
                log_warn("Waiting 30s for Google OAuth flow to complete…")
                await asyncio.sleep(30)
            else:
                log_warn("Google Sign-in button not found. Waiting 30s for manual login…")
                await asyncio.sleep(30)

            for sel in logged_in_selectors:
                if await page.query_selector(sel):
                    log_ok("Logged in to Naukri via Google SSO ✅")
                    return
            log_warn("Could not confirm Naukri login — proceeding anyway.")
            return

        log_info("Navigating to login page…")
        await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)

        email_inp = await page.query_selector("input[type='text'][placeholder*='mail'], input#usernameField")
        pwd_inp   = await page.query_selector("input[type='password'], input#passwordField")

        if not email_inp or not pwd_inp:
            log_warn("Login form not found — waiting 15s for manual login.")
            await asyncio.sleep(15)
            return

        await email_inp.fill(self.email)
        await asyncio.sleep(random.uniform(0.5, 1.2))
        await pwd_inp.fill(self.password)
        await asyncio.sleep(random.uniform(0.5, 1.2))

        submit = await page.query_selector("button[type='submit'], button.loginButton, button:has-text('Login')")
        if submit:
            await submit.click()
            await asyncio.sleep(4)
            log_ok("Login submitted.")
        else:
            log_warn("Submit button not found; attempting Enter key.")
            await pwd_inp.press("Enter")
            await asyncio.sleep(4)

    async def _collect_job_links(self, page, keyword: str, location: str) -> list[tuple[str, str]]:
        kw_enc  = keyword.replace(" ", "%20")
        loc_enc = location.replace(" ", "%20")
        url = f"{NAUKRI_BASE}/{kw_enc}-jobs-in-{loc_enc}?jobAge=7&sort=date"

        log_info(f"Searching: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        results = []
        anchors = await page.query_selector_all("a.title[href*='naukri.com'], a[title][href*='/job-listings-'], article a[href*='naukri.com']")
        seen = set()

        for a in anchors:
            try:
                href = await a.get_attribute("href") or ""
                if not href or "naukri.com" not in href:
                    continue
                slug = href.rstrip("/").split("/")[-1]
                job_id = f"naukri_{slug}"
                if job_id not in seen:
                    seen.add(job_id)
                    results.append((job_id, href if href.startswith("http") else f"{NAUKRI_BASE}{href}"))
            except Exception:
                pass

        return results

    async def _extract_job_meta(self, page) -> tuple[str, str, str]:
        async def _txt(selectors: list[str]) -> str:
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

        title   = await _txt(["h1.jd-header-title", "h1", ".jd-header-title"])
        company = await _txt([".jd-header-comp-name a", ".jd-header-comp-name", ".comp-name"])
        loc     = await _txt([".jd-header-loc span", ".jd-loc-txt", ".location"])
        return title or "Unknown Title", company or "Unknown Company", loc or ""

    async def _try_apply(self, page, job_id: str, title: str, company: str, location: str, url: str) -> bool:
        resume_path = os.path.abspath(
            self.profile.get("cv", {}).get("cv_path", "active_resume.pdf")
        )

        apply_btn = None
        for sel in [
            "button:has-text('Easy Apply')",
            "button:has-text('Apply')",
            "a:has-text('Easy Apply')",
            ".apply-button",
            "#apply-button",
        ]:
            try:
                el = await page.wait_for_selector(sel, state="visible", timeout=3000)
                if el:
                    apply_btn = el
                    break
            except Exception:
                pass

        if not apply_btn:
            log_warn(f"No Apply button found for {job_id} — saving as External.")
            self.dedup.mark_applied(job_id, self.PLATFORM, "External - Ready", {
                "company": company, "title": title, "location": {"raw": location},
                "external_url": url,
            })
            return False

        btn_text = (await apply_btn.inner_text()).lower()

        if "easy apply" in btn_text:
            await apply_btn.click()
            await asyncio.sleep(2)

            success = await self._handle_apply_modal(page, job_id, title, company, resume_path)
            status = "Submitted" if success else "Stuck - Manual Action Needed"
            self.dedup.mark_applied(job_id, self.PLATFORM, status, {
                "company": company, "title": title, "location": {"raw": location},
                "resume_used": resume_path, "external_url": url,
            })
            if success:
                log_ok(f"Applied to '{title}' at {company} ✅")
            else:
                log_warn(f"Application stuck for '{title}' at {company}.")
            return success
        else:
            self.dedup.mark_applied(job_id, self.PLATFORM, "External - Ready", {
                "company": company, "title": title, "location": {"raw": location},
                "external_url": url,
            })
            log_info(f"Saved external job: {title} @ {company}")
            return False

    async def _handle_apply_modal(self, page, job_id: str, title: str, company: str, resume_path: str) -> bool:
        for step in range(1, 10):
            log_info(f"Modal step {step}…")
            await asyncio.sleep(2)

            try:
                fi = page.locator("input[type='file']")
                if await fi.count() > 0 and os.path.exists(resume_path):
                    await fi.first.set_input_files(resume_path)
                    await asyncio.sleep(1)
                    log_ok(f"Uploaded resume: {os.path.basename(resume_path)}")
            except Exception:
                pass

            for btn_sel in [
                "button:has-text('Submit')",
                "button:has-text('Apply')",
                "button:has-text('Next')",
                "button.submit-btn",
                "button[type='submit']",
            ]:
                try:
                    btn = await page.wait_for_selector(btn_sel, state="visible", timeout=2000)
                    if not btn:
                        continue
                    btn_text = (await btn.inner_text()).lower()
                    await btn.click(force=True)
                    await asyncio.sleep(2)
                    if "submit" in btn_text or "apply" in btn_text:
                        log_ok("Application submitted!")
                        return True
                    break
                except Exception:
                    pass

        return False

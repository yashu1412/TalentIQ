import os
import json
import random
import asyncio
import time
import traceback
from rich.console import Console
from src.autobot.core.browser import BrowserEngine
from src.autobot.core.ai_handler import AIHandler

console = Console()

def log_info(msg): console.print(f"  [cyan]ℹ {msg}[/cyan]")
def log_ok(msg): console.print(f"  [green]✅ {msg}[/green]")
def log_err(msg, err=""): console.print(f"  [red]❌ {msg} {err}[/red]")
def log_warn(msg): console.print(f"  [yellow]⚠️ {msg}[/yellow]")
def log_step(step, msg): console.print(f"\n[bold blue]▶ {step}:[/bold blue] {msg}")

# Default answers config path (inside the autobot data dir)
_ANSWERS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "config", "answers.json"
)

class LinkedInBot:
    def __init__(self, profile, prefs, dedup):
        self.profile = profile
        self.prefs = prefs
        self.dedup = dedup
        self.browser_engine = BrowserEngine()
        self.ai = AIHandler(config=profile.get("ai", profile))
        
        try:
            with open(_ANSWERS_PATH, 'r') as f:
                self.answers = json.load(f)
        except Exception:
            self.answers = {"common_questions": {}}
            
        self.daily_count = 0
        self.session_count = 0
        self.current_description = ""

    async def run_cycle(self, page, country_config=None):
        country  = country_config['country'] if country_config else "Global"
        keywords = self.prefs.get('keywords', [])
        pages_per_search = 1

        console.print(f"\n[bold magenta]{'='*60}[/bold magenta]")
        console.print(f"[bold magenta]  🌍 SESSION: {country}  |  Roles: {len(keywords)}[/bold magenta]")
        console.print(f"[bold magenta]{'='*60}[/bold magenta]\n")

        log_step("1/2", "Login check")
        try:
            await self.ensure_login(page)
        except Exception as e:
            log_err("Login failed — stopping session.", str(e))
            return

        log_step("2/2", "Unified Search & Apply")
        total_applied = 0

        for kw_idx, keyword in enumerate(keywords, 1):
            console.print(f"\n[bold cyan]{'─'*60}[/bold cyan]")
            console.print(f"[bold cyan]  🔑 Keyword [{kw_idx}/{len(keywords)}]: '{keyword}'[/bold cyan]")
            console.print(f"[bold cyan]{'─'*60}[/bold cyan]")

            loc = country 
            
            easy_apply_only = self.prefs.get("platforms", {}).get("linkedin", {}).get("easy_apply_only", True)
            log_info(f"Scanning {'EASY APPLY ONLY' if easy_apply_only else 'ALL'} jobs for '{keyword}'...")
            job_urls = []
            for pg in range(1, pages_per_search + 1):
                try:
                    urls = await self.collect_job_urls(page, keyword, loc, pg, easy_apply_only=easy_apply_only)
                    job_urls.extend([u for u in urls if u not in job_urls])
                except Exception as e:
                    log_err(f"Search failed for pg {pg}", str(e))

            log_ok(f"Found {len(job_urls)} total jobs. Processing...")
            processed_this_kw = 0
            for idx, job_url in enumerate(job_urls):
                if processed_this_kw >= 1:
                    break
                job_id = job_url.rstrip("/").split("/")[-1]
                if self.dedup.is_applied(job_id): continue
                
                log_step("Unified", f"Job {idx+1}/{len(job_urls)} ({job_id})")
                try:
                    await page.goto(job_url, wait_until="domcontentloaded", timeout=30000)
                    await asyncio.sleep(2)
                    job_title, company_name, _, job_loc_raw = await self.extract_job_details(page, country_config)
                    job_location = {"city": country, "country": country, "is_remote": "remote" in job_loc_raw.lower()}
                    
                    # Wait up to 5 seconds for the apply button to load
                    apply_btn = None
                    for selector in ["button.jobs-apply-button", ".jobs-apply-button", "button:has-text('Easy Apply')"]:
                        try:
                            apply_btn = await page.wait_for_selector(selector, state="visible", timeout=4000)
                            if apply_btn:
                                break
                        except:
                            continue

                    is_easy_apply = False
                    if apply_btn:
                        btn_text = (await apply_btn.inner_text()).lower()
                        has_linkedin_icon = await apply_btn.evaluate("""el => {
                            const html = el.innerHTML.toLowerCase();
                            // Check for LinkedIn logo patterns
                            const isLinkedinLogo = html.includes("li-icon") || html.includes("linkedin");
                            // Ensure it doesn't contain external redirect link icons
                            const isExternalLink = html.includes("external-link") || html.includes("external_link") || html.includes("company-site");
                            return isLinkedinLogo && !isExternalLink;
                        }""")
                        
                        # It is classified as Easy Apply if:
                        # 1. The text contains "easy apply"
                        # 2. Or it contains "apply" and the LinkedIn icon/logo (but not the external redirect arrow)
                        if "easy apply" in btn_text or ("apply" in btn_text and has_linkedin_icon):
                            is_easy_apply = True
                    
                    if is_easy_apply:
                        log_info(f"Detected Easy Apply for {job_id}. Attempting auto-apply...")
                        await self.apply_to_job(page, job_id, company_name, job_title, job_location, is_guaranteed=True)
                        total_applied += 1
                        self.session_count += 1
                        # Wait approx 2 minutes before processing the next job to evade bot detection
                        await asyncio.sleep(random.randint(110, 130))
                    else:
                        log_info(f"Detected External job for {job_id}. Saving to dashboard...")
                        self.dedup.mark_applied(job_id, "LinkedIn", "External - Ready", {
                            "company": company_name, "title": job_title,
                            "location": job_location, "resume_used": None,
                            "cover_letter_used": None, "external_url": job_url
                        })
                        log_ok(f"Saved external: {job_title}")
                        # Wait approx 2 minutes before processing the next job to evade bot detection
                        await asyncio.sleep(random.randint(110, 130))
                    
                    processed_this_kw += 1
                        
                except Exception as e:
                    log_err(f"Failed to process {job_url}", str(e))

            if not self.check_guardrails():
                break

        console.print(f"\n[bold green]  ✅ '{country}' fully exhausted — Total applied: {total_applied}[/bold green]\n")

    async def ensure_login(self, page):
        try:
            logged_in_selectors = [
                ".global-nav__primary-link-me-menu-trigger", 
                "#global-nav-typeahead", 
                ".nav-item__profile-member-photo",
                "button.global-nav__primary-link--active"
            ]
            
            for sel in logged_in_selectors:
                if await page.query_selector(sel):
                    log_ok('Already logged in.')
                    return

            log_info("Not sure if logged in, checking jobs page...")
            await page.goto('https://www.linkedin.com/jobs', timeout=30000)
            await asyncio.sleep(3)
            
            current_url = page.url.lower()
            is_login_page = await page.query_selector("input#username, input#password, .login__form, .authwall")
            
            if is_login_page or 'login' in current_url or 'authwall' in current_url:
                for sel in logged_in_selectors:
                    if await page.query_selector(sel):
                        log_ok('Logged in (detected via UI elements).')
                        return
                        
                log_warn('Not logged in. Please log in manually in the browser window.')
                await asyncio.sleep(10)
                for sel in logged_in_selectors:
                    if await page.query_selector(sel):
                        log_ok('Logged in manually.')
                        return
                raise Exception("Manual login required.")
            else:
                log_ok('Already logged in.')
        except Exception as e:
            log_err('ensure_login check failed', str(e))
            raise e

    async def collect_job_urls(self, page, keyword, location, page_num=1, easy_apply_only=False):
        start = (page_num - 1) * 25
        url = (
            f"https://www.linkedin.com/jobs/search/"
            f"?keywords={keyword.replace(' ', '%20')}"
            f"&location={location.replace(' ', '%20')}"
            f"&start={start}"
            f"&f_TPR=r604800"
            f"&sortBy=DD"
        )
        if easy_apply_only:
            url += "&f_AL=true"
        
        log_info(f"GET: {url}")
        await page.goto(url, timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        links = await page.query_selector_all("a[href*='/jobs/view/']")
        urls = []
        seen = set()
        for link in links:
            try:
                href = await link.get_attribute("href")
                if href and "/jobs/view/" in href:
                    clean = href.split("?")[0].split("#")[0].rstrip("/")
                    parts = clean.split("/jobs/view/")
                    if len(parts) > 1 and parts[1].strip():
                        job_id_part = parts[1].strip("/")
                        final_url = f"https://www.linkedin.com/jobs/view/{job_id_part}/"
                        if final_url not in seen:
                            seen.add(final_url)
                            urls.append(final_url)
            except: pass
        return urls

    async def extract_job_details(self, page, country_config):
        # Wait for the job details card or title to load
        title_selectors = [
            ".job-details-jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__content-title",
            ".jobs-details-top-card__job-title",
            ".jobs-details-panel h1",
            "h1.t-24",
            "h1.text-display-medium",
            ".top-card-layout__title",
            ".topcard__title",
            "main h1",
            "main h2",
            "[role='main'] h1",
            "[role='main'] h2"
        ]
        for s in title_selectors:
            try:
                await page.wait_for_selector(s, state="visible", timeout=4000)
                break
            except:
                continue

        async def try_sel(selectors):
            for s in selectors:
                try:
                    el = await page.query_selector(s)
                    if el:
                        txt = await el.inner_text()
                        if txt.strip(): return txt.strip()
                except: continue
            return None

        async def try_attr(selectors, attr):
            for s in selectors:
                try:
                    el = await page.query_selector(s)
                    if el:
                        val = await el.get_attribute(attr)
                        if val: return val.strip()
                except: continue
            return None

        job_title = await try_sel([
            # Specific classes (most reliable)
            ".job-details-jobs-unified-top-card__job-title",
            ".job-details-jobs-unified-top-card__job-title h1",
            "h1.job-details-jobs-unified-top-card__job-title",
            "h2.job-details-jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__job-title",
            ".jobs-unified-top-card__job-title h1",
            ".jobs-unified-top-card__content-title",
            ".jobs-details-top-card__job-title",
            ".jobs-details-panel h1",
            "h1.t-24",
            "h2.t-24",
            "h1.text-display-medium",
            ".top-card-layout__title",
            ".topcard__title",
            # Scoped generic selectors inside main content to prevent matching global headers/footers
            "main [class*='job-title'] h1",
            "main [class*='job-title'] h2",
            "main [class*='job-title']",
            "main [class*='top-card'] h1",
            "main [class*='top-card'] h2",
            "main [class*='top-card']",
            "main h1",
            "main h2",
            "main h3",
            "[role='main'] h1",
            "[role='main'] h2"
        ]) or "Unknown Title"

        company_name = await try_sel([
            ".job-details-jobs-unified-top-card__company-name a",
            ".jobs-unified-top-card__company-name a",
            ".job-details-jobs-unified-top-card__company-name",
            ".jobs-unified-top-card__company-name",
            "a[href*='/company/']",
            "a.app-aware-link[href*='/company/']",
            ".topcard__org-name-link",
            ".top-card-layout__company-name",
            "span.jobs-unified-top-card__company-name"
        ]) or "Unknown Company"

        # Extract title from the browser page title as a 100% reliable fallback
        page_title = ""
        try:
            page_title = await page.title()
        except:
            pass

        parsed_title = None
        if page_title:
            clean_t = page_title
            for suffix in ["| LinkedIn", "- LinkedIn", "LinkedIn"]:
                if clean_t.endswith(suffix):
                    clean_t = clean_t[:-len(suffix)].strip()
            clean_t = clean_t.strip(" | -")
            
            # Check standard separators in page titles
            parts = []
            if " | " in clean_t:
                parts = [p.strip() for p in clean_t.split(" | ")]
            elif " - " in clean_t:
                parts = [p.strip() for p in clean_t.split(" - ")]
            elif " at " in clean_t:
                parts = [p.strip() for p in clean_t.split(" at ")]
            elif " hiring " in clean_t:
                parts = [p.strip() for p in clean_t.split(" hiring ")]
                
            if parts:
                if company_name and company_name.lower() in parts[0].lower():
                    if len(parts) > 1:
                        parsed_title = parts[1]
                else:
                    parsed_title = parts[0]
            else:
                parsed_title = clean_t

        # Validate job title to ensure it doesn't match noisy global headers/footers/accessibility widgets
        suspicious_keywords = ["notification", "message", "sign in", "hiring team", "use ai", "assess", "how you fit", "unknown title", "similar jobs"]
        is_suspicious = any(kw in job_title.lower() for kw in suspicious_keywords) or len(job_title.strip()) < 3
        
        if is_suspicious and parsed_title:
            job_title = parsed_title

        company_url = await try_attr([
            ".job-details-jobs-unified-top-card__company-name a",
            ".jobs-unified-top-card__company-name a",
            "a[href*='/company/']",
            "a.app-aware-link[href*='/company/']",
        ], "href") or ""

        job_loc_raw = await try_sel([
            ".job-details-jobs-unified-top-card__primary-description-container .tvm__text",
            ".job-details-jobs-unified-top-card__primary-description-container",
            ".jobs-unified-top-card__bullet",
            ".topcard__flavor--bullet",
        ]) or ""

        self.current_description = await try_sel([
            ".jobs-description__container",
            ".jobs-description-content__text",
            "#job-details",
            ".description__text"
        ]) or ""

        return job_title, company_name, company_url, job_loc_raw

    async def apply_to_job(self, page, job_id, company_name, job_title, job_location, is_guaranteed=False):
        try:
            easy_apply_btn = None
            
            log_info("Waiting 3s for page to fully load...")
            await asyncio.sleep(3)
            
            _data_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "data", "screenshots"
            )
            os.makedirs(_data_dir, exist_ok=True)
            screenshot_path = os.path.join(_data_dir, f"job_{job_id}.png")
            await page.screenshot(path=screenshot_path)
            log_info(f"Visual screen captured: {screenshot_path}")
            
            apply_selectors = [
                "button.jobs-apply-button",
                ".jobs-apply-button",
                ".jobs-apply-button--top-card button",
                "button.jobs-apply-button[aria-label*='Easy']",
                "button.jobs-apply-button[aria-label*='Apply']",
                "button:has-text('Easy Apply')",
                "button:has-text('Apply now')",
                "button:has-text('Apply')"
            ]
            
            for selector in apply_selectors:
                try:
                    el = await page.wait_for_selector(selector, state="visible", timeout=3000)
                    if el:
                        easy_apply_btn = el
                        log_ok(f"✅ Found Apply button: {selector}")
                        break
                except Exception:
                    continue
                
            if not easy_apply_btn:
                try:
                    el = await page.wait_for_selector("text=/Apply/i", state="visible", timeout=3000)
                    if el:
                        easy_apply_btn = el
                        log_ok("✅ Found Apply button (regex fallback).")
                except Exception as e:
                    log_warn(f"Visual scan error in fallback: {e}")

            if easy_apply_btn:
                await easy_apply_btn.click()
                await asyncio.sleep(2)
                success, resume_path = await self.handle_easy_apply_modal(page, company_name, job_title)
                if success:
                    self.dedup.mark_applied(job_id, "LinkedIn", "Submitted", {
                        "company": company_name, "title": job_title,
                        "location": job_location, "resume_used": resume_path,
                        "cover_letter_used": None
                    })
                    log_ok("Application SUBMITTED ✅")
                else:
                    log_warn(f"Application stuck for {job_id}.")
                    self.dedup.mark_applied(job_id, "LinkedIn", "Stuck - Manual Action Needed", {
                        "company": company_name, "title": job_title,
                        "location": job_location, "external_url": f"https://www.linkedin.com/jobs/view/{job_id}/"
                    })
            else:
                log_warn("No Easy Apply button found.")
        except Exception as e:
            log_err(f"apply_to_job failed for {job_id}", str(e))

    async def handle_easy_apply_modal(self, page, company_name, job_title):
        resume_path = os.path.abspath(self.profile.get('cv', {}).get('cv_path', 'active_resume.pdf'))
        
        for step in range(1, 15):
            log_info(f"Modal step {step}/15...")
            await asyncio.sleep(2)

            try:
                file_inputs = page.locator("input[type='file']")
                count = await file_inputs.count()
                if count > 0 and os.path.exists(resume_path):
                    for i in range(count):
                        try:
                            await file_inputs.nth(i).set_input_files(resume_path)
                            log_ok(f"✅ Attached resume: {os.path.basename(resume_path)}")
                            await asyncio.sleep(1)
                        except Exception:
                            pass
            except Exception:
                pass

            try: await self.fill_form_questions(page, company_name, job_title)
            except: pass

            try:
                labels = await page.query_selector_all("label")
                for label in labels:
                    txt = await label.inner_text()
                    txt_low = txt.lower()
                    if any(kw in txt_low for kw in ['terms of service', 'privacy policy', 'terms of use', 'acknowledge', 'agree', 'consent']):
                        input_id = await label.get_attribute("for")
                        if input_id:
                            is_checked = await page.evaluate(f'document.getElementById("{input_id}")?.checked')
                            if not is_checked:
                                await label.click()
                                await asyncio.sleep(1)
            except Exception:
                pass

            try:
                primary_btn = await page.query_selector(".jobs-easy-apply-modal footer .artdeco-button--primary, .jobs-easy-apply-modal .artdeco-button--primary")
                if not primary_btn:
                    log_warn("No primary action button found in modal.")
                    break
                    
                btn_text = await primary_btn.inner_text()
                btn_text = btn_text.lower()
                
                if "submit" in btn_text:
                    await primary_btn.click(force=True)
                    log_ok("Clicked Submit!")
                    await asyncio.sleep(3)
                    return True, resume_path
                else:
                    await primary_btn.click(force=True)
                    await asyncio.sleep(2)
                    
                    error_el = await page.query_selector(".artdeco-inline-feedback--error")
                    if error_el:
                        err_txt = await error_el.inner_text()
                        log_err(f"Form validation error: {err_txt.strip()}")
                        return False, resume_path
            except Exception as e:
                log_warn(f"Error clicking modal button: {e}")
                break

        return False, resume_path

    async def fill_form_questions(self, page, company_name="", job_title=""):
        try:
            questions = await page.query_selector_all(".jobs-easy-apply-form-section__grouping")
            for q in questions:
                label_el = await q.query_selector("label")
                if not label_el: continue
                label = await label_el.inner_text()
                ll = label.lower().strip()
                answer = self.answers.get('common_questions', {}).get(ll)
                if not answer:
                    import re
                    if re.search(r"experience|years|how many", ll):
                        answer = str(self.profile.get("experience", {}).get("years_of_experience", "1"))
                        
                if not answer:
                    try:
                        years_exp = self.profile.get("experience", {}).get("years_of_experience", "1")
                        title = self.profile.get("experience", {}).get("current_title", "Software Engineer")
                        skills_str = ", ".join(self.profile.get("experience", {}).get("skills", []))
                        prompt_info = f"I am a {title} with {years_exp} years of experience. My skills are: {skills_str}."
                        
                        answer = self.ai.ask(
                            f"Question: {label}. {prompt_info} Note: If the question requires a number, return ONLY a whole number (e.g. {years_exp}).",
                            {
                                "job_title": job_title,
                                "company": company_name,
                                "resume_summary": self.profile.get("cv", {}).get("resume_summary", "")
                            }
                        )
                    except:
                        answer = str(self.profile.get("experience", {}).get("years_of_experience", "1"))
                
                if answer:
                    # 1. Text Inputs (including tel, email, and numbers)
                    inp = await q.query_selector("input[type='text'], input[type='number'], input[type='email'], input[type='tel'], textarea")
                    if inp:
                        if await inp.get_attribute("type") == "number":
                            import re
                            match = re.search(r'\d+', str(answer))
                            answer = match.group(0) if match else "4"
                        await inp.fill(str(answer))
                        continue

                    # 2. Checkbox Questions (e.g. Yes/No toggles or acknowledgment checklists)
                    checkboxes = await q.query_selector_all("input[type='checkbox']")
                    if checkboxes:
                        is_positive = str(answer).lower().strip() in ["yes", "true", "y", "1", "agree", "confirm", "check"]
                        for cb in checkboxes:
                            cb_id = await cb.get_attribute("id")
                            cb_label = await page.query_selector(f"label[for='{cb_id}'], label:has(input[id='{cb_id}']), input[id='{cb_id}'] + label") if cb_id else None
                            if cb_label:
                                is_checked = await cb.is_checked()
                                if (is_positive and not is_checked) or (not is_positive and is_checked):
                                    await cb_label.click(force=True)
                                    await asyncio.sleep(0.5)
                        continue

                    # 3. Radio Options (Yes/No, experience ranges, etc.)
                    radios = await q.query_selector_all("input[type='radio']")
                    if radios:
                        clicked = False
                        for r in radios:
                            r_id = await r.get_attribute("id")
                            r_label = await page.query_selector(f"label[for='{r_id}'], label:has(input[id='{r_id}']), input[id='{r_id}'] + label") if r_id else None
                            if r_label:
                                r_text = (await r_label.inner_text()).lower().strip()
                                ans_str = str(answer).lower().strip()
                                if ans_str == r_text or ans_str in r_text or r_text in ans_str:
                                    await r_label.click(force=True)
                                    clicked = True
                                    break
                        if clicked: continue

                    # 4. Dropdowns and Comboboxes
                    dropdown_trigger = await q.query_selector("button[aria-haspopup='listbox'], .artdeco-dropdown__trigger, [role='combobox'], select")
                    if dropdown_trigger:
                        tag_name = await dropdown_trigger.evaluate("el => el.tagName.toLowerCase()")
                        if tag_name == "select":
                            options = await dropdown_trigger.query_selector_all("option")
                            best_val = None
                            for opt in options:
                                opt_text = (await opt.inner_text()).lower().strip()
                                ans_str = str(answer).lower().strip()
                                if ans_str == opt_text or ans_str in opt_text or opt_text in ans_str:
                                    best_val = await opt.get_attribute("value")
                                    break
                            if best_val:
                                await dropdown_trigger.select_option(value=best_val)
                            else:
                                await dropdown_trigger.select_option(index=1)
                            continue
                        else:
                            try:
                                await dropdown_trigger.click(force=True)
                                await asyncio.sleep(1)
                                # Search globally since dropdown items render in overlays outside of the grouping container
                                options = await page.query_selector_all(".artdeco-dropdown__item, [role='option'], .jobs-easy-apply-modal__option, li[role='option'], .artdeco-typeahead__result-item")
                                clicked = False
                                for opt in options:
                                    opt_text = (await opt.inner_text()).lower().strip()
                                    ans_str = str(answer).lower().strip()
                                    if ans_str == opt_text or ans_str in opt_text or opt_text in ans_str:
                                        await opt.click(force=True)
                                        clicked = True
                                        break
                                if not clicked and len(options) > 0:
                                    # Fallback to the first option if no exact match is found
                                    await options[0].click(force=True)
                                continue
                            except Exception as e:
                                log_warn(f"Error selecting custom dropdown: {e}")
        except Exception as e:
            log_warn(f"Form filling error: {e}")

    def check_guardrails(self):
        if self.session_count > 0 and self.session_count % 8 == 0:
            time.sleep(random.randint(60, 120))
        return True

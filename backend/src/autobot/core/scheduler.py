"""
scheduler.py
────────────
Orchestrates all enabled job-platform bots in a round-robin cycle.
Reads `prefs["platforms"]` to determine which bots to run and their
per-session application limits. Each session opens ONE browser, runs
all active platform bots sequentially, then waits 30 minutes.
"""
import asyncio
import json
import os
import random
import datetime
from rich.console import Console

from src.autobot.core.linkedin     import LinkedInBot
from src.autobot.core.naukri       import NaukriBot
from src.autobot.core.ycombinator  import YCombinatorBot
from src.autobot.core.dedup        import DedupManager
from src.autobot.core.browser      import BrowserEngine

console = Console()

# ── Platform registry ─────────────────────────────────────────────────────────
PLATFORM_REGISTRY = {
    "linkedin":    LinkedInBot,
    "naukri":      NaukriBot,
    "ycombinator": YCombinatorBot,
}

# Data directory (relative to backend working dir)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
STATE_FILE = os.path.join(DATA_DIR, "session_state.json")
APPLIED_FILE = os.path.join(DATA_DIR, "applied_jobs.json")


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"last_country_index": -1}


def save_state(state: dict) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def run_scheduler(profile: dict, prefs: dict) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    dedup = DedupManager(APPLIED_FILE)

    active_countries = [c for c in prefs.get("countries", []) if c.get("active")]
    if not active_countries:
        console.print("[bold red]❌ No active countries configured — aborting.[/bold red]")
        return

    # Build the list of enabled bots
    platforms_cfg = prefs.get("platforms", {})
    enabled_bots: list[tuple[str, object]] = []
    for platform_key, BotClass in PLATFORM_REGISTRY.items():
        cfg = platforms_cfg.get(platform_key, {})
        if platform_key == "linkedin":
            is_enabled = cfg.get("enabled", True)
        else:
            is_enabled = cfg.get("enabled", False)

        if is_enabled:
            try:
                bot = BotClass(profile, prefs, dedup)
                enabled_bots.append((platform_key, bot))
                console.print(f"[green]✅ Platform enabled: {platform_key.upper()}[/green]")
            except Exception as e:
                console.print(f"[yellow]⚠️ Could not init {platform_key} bot: {e}[/yellow]")

    if not enabled_bots:
        console.print("[bold red]❌ No platforms enabled — check job_prefs.json.[/bold red]")
        return

    async def run_loop():
        state = load_state()
        
        # Instantiate a single BrowserEngine for the scheduler lifecycle
        engine = BrowserEngine()
        page = None

        while True:
            next_index = (state["last_country_index"] + 1) % len(active_countries)
            country_config = active_countries[next_index]

            console.print(f"\n[bold blue]{'━'*60}[/bold blue]")
            console.print(
                f"[bold blue]  📅 SESSION START "
                f"— Country: {country_config['country']}  "
                f"(Priority: {country_config['priority']})[/bold blue]"
            )
            console.print(f"[bold blue]  🕒 Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/bold blue]")
            console.print(f"[bold blue]  🤖 Active platforms: {', '.join(n.upper() for n, _ in enabled_bots)}[/bold blue]")
            console.print(f"[bold blue]{'━'*60}[/bold blue]\n")

            # Check if browser needs to be initialized or re-opened
            if not page:
                try:
                    page = await engine.init_browser()
                    console.print("[green]  ✅ Browser opened for the session.[/green]")
                except Exception as e:
                    console.print(f"[bold red]  ❌ Could not open browser: {e}[/bold red]")
                    await asyncio.sleep(30)
                    continue
            else:
                try:
                    # Test if the page is still open and responsive
                    await page.title()
                except Exception:
                    console.print("[yellow]  ⚠️ Browser was closed. Re-opening…[/yellow]")
                    try:
                        page = await engine.init_browser()
                        console.print("[green]  ✅ Browser re-opened.[/green]")
                    except Exception as e:
                        console.print(f"[bold red]  ❌ Could not re-open browser: {e}[/bold red]")
                        page = None
                        await asyncio.sleep(30)
                        continue

            for platform_key, bot in enabled_bots:
                console.print(f"\n[bold cyan]{'─'*55}[/bold cyan]")
                console.print(f"[bold cyan]  🚀 Starting {platform_key.upper()} bot…[/bold cyan]")
                console.print(f"[bold cyan]{'─'*55}[/bold cyan]")

                try:
                    await bot.run_cycle(page, country_config)
                except Exception as e:
                    console.print(
                        f"[bold red]  ❌ Error in {platform_key} cycle "
                        f"for {country_config['country']}: {e}[/bold red]"
                    )

                if len(enabled_bots) > 1 and platform_key != enabled_bots[-1][0]:
                    await asyncio.sleep(random.randint(10, 20))

            state["last_country_index"] = next_index
            state["last_run"]           = datetime.datetime.now().isoformat()
            state["last_country"]       = country_config["country"]
            state["platforms_run"]      = [n for n, _ in enabled_bots]
            save_state(state)

            console.print(f"\n[bold blue]{'━'*60}[/bold blue]")
            console.print(f"[bold blue]  ✅ SESSION COMPLETE: {country_config['country']}[/bold blue]")
            next_country = active_countries[(next_index + 1) % len(active_countries)]["country"]
            console.print(f"[bold blue]  ⏳ Next session in 30 minutes → {next_country}[/bold blue]")
            console.print(f"[bold blue]  (Browser window left open for your inspection)[/bold blue]")
            console.print(f"[bold blue]{'━'*60}[/bold blue]\n")

            await asyncio.sleep(1800)  # 30 minutes

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_loop())

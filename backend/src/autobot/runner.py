"""
runner.py
─────────
Entry point for the autobot subprocess.
Run via: python -m src.autobot.runner

This loads config from environment variables and starts the scheduler.
"""
import sys
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)

from src.autobot.config.env_loader import load_configs
from src.autobot.core.scheduler import run_scheduler


def main():
    print("🚀 TalentIQ Auto Job Bot starting...")
    try:
        profile, prefs = load_configs()
        print("✅ Configuration loaded.")

        enabled = [p for p, cfg in prefs.get("platforms", {}).items() if cfg.get("enabled", False)]
        if not enabled:
            print("⚠️  No platforms enabled. Enable at least one in config.")
        else:
            print(f"✅ Enabled platforms: {', '.join(p.upper() for p in enabled)}")

        run_scheduler(profile, prefs)
    except KeyboardInterrupt:
        print("\n🛑 Bot stopped.")
    except Exception as e:
        print(f"❌ Critical error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

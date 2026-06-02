import asyncio
import random
import time
import os
import math
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

class BrowserEngine:
    def __init__(self, headless=False):
        self.headless = headless
        self.browser = None
        self.context = None

    async def init_browser(self):
        playwright = await async_playwright().start()

        # Bot uses its own isolated profile inside the autobot data directory by default,
        # but allows override via environment variables if the user wants to use their own Chrome profile.
        custom_dir = os.getenv("CHROME_USER_DATA_DIR")
        if custom_dir:
            user_data_dir = os.path.abspath(os.path.expandvars(custom_dir))
        else:
            _autobot_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            user_data_dir = os.path.join(_autobot_root, "data", "browser_profile")
        os.makedirs(user_data_dir, exist_ok=True)

        # Randomize viewport slightly each session (fingerprint evasion)
        width = random.randint(1280, 1920)
        height = random.randint(800, 1080)

        self.context = await playwright.chromium.launch_persistent_context(
            user_data_dir,
            headless=self.headless,
            channel="chrome",
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-infobars",
                "--disable-background-timer-throttling",
                "--disable-renderer-backgrounding",
                "--enable-extensions",
                f"--window-size={width},{height}"
            ],
            ignore_default_args=["--disable-extensions", "--disable-component-extensions-with-background-pages"],
            viewport={"width": width, "height": height},
            locale="en-US",
            timezone_id="Asia/Kolkata",
            geolocation={"latitude": 18.5204, "longitude": 73.8567},
            permissions=["geolocation"]
        )

        page = self.context.pages[0] if self.context.pages else await self.context.new_page()

        # Apply stealth to avoid bot detection
        stealth = Stealth()
        await stealth.apply_stealth_async(page)

        # Remove automation indicators
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            window.chrome = { runtime: {} };
        """)

        return page


    async def human_click(self, page, selector):
        """Click with natural mouse movement using bezier curves"""
        element = await page.wait_for_selector(selector, timeout=5000)
        box = await element.bounding_box()
        if box:
            # Simulate "looking around" before clicking
            if random.random() < 0.3:
                await page.mouse.move(
                    random.randint(100, 800), 
                    random.randint(100, 500), 
                    steps=random.randint(10, 20)
                )
                await asyncio.sleep(random.uniform(0.3, 1.2))

            # Move to target with slight randomness
            x = box['x'] + box['width'] * random.uniform(0.3, 0.7)
            y = box['y'] + box['height'] * random.uniform(0.3, 0.7)
            await page.mouse.move(x, y, steps=random.randint(15, 30))
            
            # Brief pause before clicking (human reaction time)
            await asyncio.sleep(random.uniform(0.1, 0.4))
            await element.click()

    async def human_scroll(self, page):
        """Scroll like a real person reading content"""
        scroll_count = random.randint(2, 5)
        for i in range(scroll_count):
            # Vary scroll speed - fast at start, slow when "reading"
            scroll_amount = random.randint(200, 500)
            await page.mouse.wheel(0, scroll_amount)
            
            # Longer pause = "reading" something interesting
            if random.random() < 0.3:
                await asyncio.sleep(random.uniform(2.0, 4.0))  # Reading pause
            else:
                await asyncio.sleep(random.uniform(0.5, 1.5))  # Scanning
            
            # Occasionally scroll back up slightly
            if random.random() < 0.15:
                await page.mouse.wheel(0, -random.randint(50, 150))
                await asyncio.sleep(random.uniform(0.5, 1.0))

    async def human_type(self, page, selector, text):
        """Type with natural rhythm, occasional pauses, and typo simulation"""
        await page.focus(selector)
        for i, char in enumerate(text):
            await page.keyboard.type(char)
            
            # Occasional typo + correction
            if random.random() < 0.03:
                wrong_char = chr(ord(char) + random.choice([-1, 1]))
                await page.keyboard.type(wrong_char)
                await asyncio.sleep(random.uniform(0.1, 0.3))
                await page.keyboard.press("Backspace")
                await asyncio.sleep(0.05)
                await page.keyboard.type(char)
            
            # Natural typing rhythm
            if char == ' ':
                await asyncio.sleep(random.uniform(0.05, 0.15))
            elif char in '.,!?':
                await asyncio.sleep(random.uniform(0.1, 0.3))  # Pause after punctuation
            else:
                await asyncio.sleep(random.uniform(0.04, 0.12))
            
            # Occasional "thinking" pause mid-sentence
            if random.random() < 0.02:
                await asyncio.sleep(random.uniform(0.5, 1.5))

    async def natural_delay(self, min_sec=1, max_sec=3):
        """Random delay to simulate human think time"""
        await asyncio.sleep(random.uniform(min_sec, max_sec))

    async def simulate_reading(self, page, duration_sec=None):
        """Simulate a human reading a page: scroll, pause, move mouse"""
        duration = duration_sec or random.uniform(3, 8)
        end_time = time.time() + duration
        
        while time.time() < end_time:
            action = random.choice(["scroll", "mouse_move", "pause"])
            if action == "scroll":
                await page.mouse.wheel(0, random.randint(100, 300))
            elif action == "mouse_move":
                await page.mouse.move(
                    random.randint(200, 1000),
                    random.randint(200, 700),
                    steps=random.randint(5, 15)
                )
            await asyncio.sleep(random.uniform(0.5, 2.0))

    async def close(self):
        if self.context:
            try:
                await self.context.close()
            except:
                pass

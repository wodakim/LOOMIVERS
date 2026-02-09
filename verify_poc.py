from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Navigate to the game
        print("Navigating to http://localhost:8080")
        page.goto("http://localhost:8080")

        # 2. Wait for canvas and check title
        page.wait_for_selector("#game-canvas")
        title = page.title()
        print(f"Page title: {title}")

        # 3. Wait a bit for the game to render a few frames (GameLoop start)
        time.sleep(2)

        # 4. Check for SEO hidden text update (it updates after 2s or so)
        # The text content should contain "Genesis Survivor Game State"
        # We might need to wait a bit more if throttle is 2s.
        time.sleep(1)

        description = page.locator("#game-description").text_content()
        print(f"Game Description: {description}")

        # 5. Take screenshot
        page.screenshot(path="poc_screenshot.png")
        print("Screenshot saved to poc_screenshot.png")

        browser.close()

if __name__ == "__main__":
    run()

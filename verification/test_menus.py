
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Main Menu
    print("Navigating to game...")
    page.goto("http://localhost:8000")
    page.wait_for_selector("#menu-screen")

    # Screenshot Main Menu
    print("Main Menu visible.")
    page.screenshot(path="verification/menu_main.png")

    # 2. Options Menu
    print("Clicking Options...")
    page.click("#options-btn")
    page.wait_for_selector("#options-screen:not(.hidden)")

    # Screenshot Options
    print("Options Menu visible.")
    page.screenshot(path="verification/menu_options.png")

    # 3. Credits Menu
    print("Going Back and Clicking Credits...")
    page.click("#options-back-btn")
    page.wait_for_selector("#menu-screen:not(.hidden)")
    page.click("#credits-btn")
    page.wait_for_selector("#credits-screen:not(.hidden)")
    page.screenshot(path="verification/menu_credits.png")
    page.click("#credits-back-btn")

    # 4. Start Game & Pause
    print("Starting Game...")
    page.click("#start-btn")
    # Wait for game canvas and UI to load (Hub state)
    page.wait_for_selector("#game-canvas")
    # Wait a bit for transition
    page.wait_for_timeout(2000)

    print("Pressing Pause (P)...")
    page.keyboard.press("P")
    page.wait_for_selector("#pause-screen:not(.hidden)")

    # Screenshot Pause
    print("Pause Menu visible.")
    page.screenshot(path="verification/menu_pause.png")

    print("Quitting to Title...")
    page.click("#quit-btn")
    page.wait_for_selector("#menu-screen:not(.hidden)")

    print("Verified successfully.")
    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)

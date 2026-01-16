import os
from playwright.sync_api import sync_playwright

def verify_player_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile emulation
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        print("Navigating to home...")
        page.goto("http://localhost:5173")

        # Wait for some content
        try:
            page.wait_for_selector('img', timeout=5000)
            print("Page loaded.")
        except:
            print("Timeout waiting for images.")

        # Take initial screenshot
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/home.png")

        # Try to interact to show player
        # Look for a play button icon (usually SVG) or class.
        # We'll just click a likely coordinate or element.
        # If we see "Unknown" text (artist default), click it?

        # Click on the center of the screen, maybe a song list is there.
        page.mouse.click(200, 300)
        page.wait_for_timeout(1000)

        # Take another screenshot
        path = "verification/player_interaction.png"
        page.screenshot(path=path)
        print(f"Screenshot saved to {path}")

        browser.close()

if __name__ == "__main__":
    verify_player_ui()

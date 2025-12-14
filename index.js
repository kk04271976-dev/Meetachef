import { chromium } from "playwright";
import { config } from "./config.js";
import fs from "fs";
import path from "path";

/**
 * Meetachef Automation Tool
 * Automates browsing meetachef.com to connect with chefs
 * Respects site policies with rate limiting and delays
 */

const progressPath = path.join(process.cwd(), config.resume.progressFile);

function loadPage() {
  try {
    if (fs.existsSync(progressPath)) {
      const data = JSON.parse(fs.readFileSync(progressPath, "utf8"));
      if (data.page && data.page > 0) {
        console.log(`📖 Resuming from page ${data.page}`);
        return data.page;
      }
    }
  } catch (e) {}
  console.log(`📖 Starting from page ${config.resume.startPage}`);
  return config.resume.startPage;
}

function savePage(page) {
  try {
    fs.writeFileSync(progressPath, JSON.stringify({ page }, null, 2), "utf8");
    console.log(`💾 Saved page ${page}`);
  } catch (e) {
    console.warn("⚠️ Failed to save progress");
  }
}

class MeetachefAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser with proper settings
   */
  async init() {
    console.log("🚀 Initializing browser...");

    this.browser = await chromium.launch({
      headless: config.headless,
      slowMo: config.slowMo, // Slow down operations for human-like behavior
    });

    this.context = await this.browser.newContext({
      userAgent: config.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    this.page = await this.context.newPage();

    // Set extra HTTP headers
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    console.log("✅ Browser initialized");
  }

  /**
   * Check if user is logged in by looking for user profile indicators
   */
  async isLoggedIn() {
    try {
      // Look for indicators that user is logged in
      const loggedInIndicators = [
        'a[href*="/profile"]',
        'a[href*="/account"]',
        'button:has-text("Log out")',
        'button:has-text("Sign out")',
        '[data-testid*="profile"]',
        ".user-menu",
        ".account-menu",
      ];

      for (const selector of loggedInIndicators) {
        try {
          const element = await this.page.$(selector);
          if (element && (await element.isVisible())) {
            return true;
          }
        } catch (e) {
          // Continue checking
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Perform automatic login
   */
  async login() {
    console.log("🔐 Attempting to log in...");

    try {
      // First navigate to login page
      console.log("📍 Navigating to login page...");
      await this.page.goto("https://meetachef.com/log-in", {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      await this.randomDelay(1000, 2000);

      // Find email input field
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]',
        "#email",
        ".email-input",
      ];

      let emailInput = null;
      for (const selector of emailSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && (await element.isVisible())) {
            emailInput = element;
            console.log(`✅ Found email input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!emailInput) {
        console.log("❌ Could not find email input field");
        await this.page.screenshot({ path: "login-form-debug.png" });
        return false;
      }

      // Fill email
      await emailInput.fill(config.credentials.email);
      // Wait 3 seconds (random between 2.5-3.5 seconds) after email input
      console.log("⏳ Waiting ~3 seconds after email input...");
      await this.randomDelay(1000, 1500);

      await this.page
        .getByRole("button", { name: "Sign in with my password" })
        .click();
      await this.randomDelay(1000, 1500);

      // Find password input field - try multiple strategies
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name*="password" i]',
        'input[id*="password" i]',
        'input[placeholder*="password" i]',
        'input[aria-label*="password" i]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="password"]',
        "#password",
        ".password-input",
        'input[type="text"][name*="password" i]', // Some sites use text type
      ];

      let passwordInput = null;

      // First try to find visible password inputs
      for (const selector of passwordSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            if (await element.isVisible()) {
              passwordInput = element;
              console.log(`✅ Found password input with selector: ${selector}`);
              break;
            }
          }
          if (passwordInput) break;
        } catch (e) {
          // Continue to next selector
        }
      }

      // If still not found, try to find any password input (even if not visible)
      if (!passwordInput) {
        for (const selector of passwordSelectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              passwordInput = element;
              console.log(
                `✅ Found password input (may be hidden) with selector: ${selector}`
              );
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      if (!passwordInput) {
        console.log("❌ Could not find password input field");
        await this.page.screenshot({
          path: "login-form-debug.png",
          fullPage: true,
        });
        return false;
      }

      // Fill password
      await passwordInput.fill(config.credentials.password);
      await this.randomDelay(500, 1000);

      // Find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Log in")',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        'input[type="submit"]',
        "button.submit",
        "form button",
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && (await element.isVisible())) {
            submitButton = element;
            console.log(`✅ Found submit button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!submitButton) {
        // Try pressing Enter as fallback
        console.log("⚠️  Submit button not found, trying Enter key...");
        await this.page.keyboard.press("Enter");
      } else {
        await submitButton.click();
      }

      // Wait for login to complete
      console.log("⏳ Waiting for login to complete...");
      await this.randomDelay(3000, 5000);

      // Check if login was successful
      if (await this.isLoggedIn()) {
        console.log("✅ Login successful!");
        const currentPage = await loadPage();

        // Navigate to individuals page after login
        console.log("📍 Navigating to individuals page after login...");
        await this.page.goto(
          `https://meetachef.com/individuals?page=${currentPage}`,
          {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          }
        );
        await this.randomDelay(2000, 3000);

        return true;
      } else {
        console.log("⚠️  Login status unclear. Taking screenshot...");
        await this.page.screenshot({ path: "login-result.png" });
        const currentPage = await loadPage();

        // Try to navigate to individuals page anyway
        try {
          await this.page.goto(
            `https://meetachef.com/individuals?page=${currentPage}`,
            {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            }
          );
          await this.randomDelay(2000, 3000);
        } catch (e) {
          // Ignore navigation errors
        }

        // Still return true to continue - might be on a different page
        return true;
      }
    } catch (error) {
      console.error("❌ Error during login:", error.message);
      await this.page.screenshot({ path: "login-error.png" });
      return false;
    }
  }

  /**
   * Check login status and perform login if needed
   */
  async ensureLoggedIn() {
    console.log("🔐 Checking login status...");

    // Check if already logged in
    if (await this.isLoggedIn()) {
      console.log("✅ Already logged in!");
      return true;
    }

    // Attempt to log in
    console.log("🔑 Login required, attempting automatic login...");
    return await this.login();
  }

  /**
   * Navigate to individuals page (replaces old matches page navigation)
   */
  async navigateToMatches() {
    console.log("📍 Navigating to individuals page...");

    try {
      // First try to go to main page to check authentication
      console.log("🌐 Checking main page first...");
      await this.page.goto("https://meetachef.com", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await this.randomDelay(2000, 3000);

      // Check if login is needed and perform login
      const loggedIn = await this.ensureLoggedIn();
      if (!loggedIn) {
        console.log("⚠️  Login failed, but continuing...");
      }

      const currentPage = await loadPage();

      // Now navigate to individuals page with more lenient wait condition
      console.log("📍 Navigating to individuals page...");
      await this.page.goto(
        `https://meetachef.com/individuals?page=${currentPage}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        }
      );
      await this.randomDelay(2000, 3000);

      return true;
    } catch (error) {
      console.error("❌ Error navigating to individuals page:", error.message);
      console.log("📸 Taking error screenshot...");
      try {
        await this.page.screenshot({
          path: "navigation-error.png",
          fullPage: true,
        });
        console.log("📸 Error screenshot saved as navigation-error.png");
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
      return false;
    }
  }

  /**
   * Parse city and state from location string
   */
  parseLocation(location) {
    // Format: "City, State" or "City, ST"
    const parts = location.split(",").map((p) => p.trim());
    if (parts.length === 2) {
      return {
        city: parts[0],
        state: parts[1],
      };
    }
    return { city: location, state: "" };
  }

  /**
   * Get full state name from abbreviation
   */
  getFullStateName(abbreviation) {
    const stateMap = {
      AL: "Alabama",
      AK: "Alaska",
      AZ: "Arizona",
      AR: "Arkansas",
      CA: "California",
      CO: "Colorado",
      CT: "Connecticut",
      DE: "Delaware",
      FL: "Florida",
      GA: "Georgia",
      HI: "Hawaii",
      ID: "Idaho",
      IL: "Illinois",
      IN: "Indiana",
      IA: "Iowa",
      KS: "Kansas",
      KY: "Kentucky",
      LA: "Louisiana",
      ME: "Maine",
      MD: "Maryland",
      MA: "Massachusetts",
      MI: "Michigan",
      MN: "Minnesota",
      MS: "Mississippi",
      MO: "Missouri",
      MT: "Montana",
      NE: "Nebraska",
      NV: "Nevada",
      NH: "New Hampshire",
      NJ: "New Jersey",
      NM: "New Mexico",
      NY: "New York",
      NC: "North Carolina",
      ND: "North Dakota",
      OH: "Ohio",
      OK: "Oklahoma",
      OR: "Oregon",
      PA: "Pennsylvania",
      RI: "Rhode Island",
      SC: "South Carolina",
      SD: "South Dakota",
      TN: "Tennessee",
      TX: "Texas",
      UT: "Utah",
      VT: "Vermont",
      VA: "Virginia",
      WA: "Washington",
      WV: "West Virginia",
      WI: "Wisconsin",
      WY: "Wyoming",
      DC: "District of Columbia",
    };

    const upperAbbr = abbreviation.toUpperCase();
    return stateMap[upperAbbr] || abbreviation;
  }

  /**
   * Update location to major US cities
   */
  async updateLocation(location) {
    console.log(`📍 Updating location to ${location}...`);

    try {
      const { city, state: stateAbbr } = this.parseLocation(location);
      const fullStateName = this.getFullStateName(stateAbbr);

      console.log(`   City: ${city}`);
      console.log(`   State: ${fullStateName}`);

      // Look for location selector/button
      const locationSelectors = [
        'button[aria-label*="location"]',
        'button[aria-label*="Location"]',
        '[data-testid*="location"]',
        'button:has-text("Location")',
        'input[placeholder*="location" i]',
        'input[placeholder*="city" i]',
        ".location-selector",
        "#location",
      ];

      let locationElement = null;

      for (const selector of locationSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && (await element.isVisible())) {
            locationElement = element;
            console.log(`✅ Found location element with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (locationElement) {
        // Click to open location input
        await locationElement.click();
        await this.randomDelay(1500, 2500);
      }

      // Step 1: Find and fill city input
      console.log("   Step 1: Inputting city name...");
      const cityInputSelectors = [
        'input[placeholder*="city" i]',
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[aria-label*="city" i]',
        'input[type="text"]:first-of-type',
      ];

      let cityInput = null;
      for (const selector of cityInputSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            if (await element.isVisible()) {
              cityInput = element;
              console.log(`✅ Found city input with selector: ${selector}`);
              break;
            }
          }
          if (cityInput) break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (cityInput) {
        await cityInput.click();
        await this.randomDelay(500, 1000);
        await cityInput.fill(city);
        await this.randomDelay(1000, 1500);
        console.log(`✅ City "${city}" entered`);
      } else {
        console.log("⚠️  City input not found, trying alternative approach...");
        // Try typing directly
        await this.page.keyboard.type(city, { delay: 100 });
        await this.randomDelay(1000, 1500);
      }

      // Step 2: Find and fill state input
      console.log("   Step 2: Inputting state name...");
      const stateInputSelectors = [
        'input[placeholder*="state" i]',
        'input[name*="state" i]',
        'input[id*="state" i]',
        'input[aria-label*="state" i]',
        'select[name*="state" i]',
        'select[id*="state" i]',
      ];

      let stateInput = null;
      for (const selector of stateInputSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            if (await element.isVisible()) {
              stateInput = element;
              console.log(`✅ Found state input with selector: ${selector}`);
              break;
            }
          }
          if (stateInput) break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (stateInput) {
        const tagName = await stateInput.evaluate((el) =>
          el.tagName.toLowerCase()
        );

        if (tagName === "select") {
          // Handle dropdown/select
          await stateInput.selectOption({ label: fullStateName });
          await this.randomDelay(1000, 1500);
          console.log(`✅ State "${fullStateName}" selected from dropdown`);
        } else {
          // Handle text input
          await stateInput.click();
          await this.randomDelay(500, 1000);
          await stateInput.fill(fullStateName);
          await this.randomDelay(1000, 1500);
          console.log(`✅ State "${fullStateName}" entered`);
        }
      } else {
        console.log("⚠️  State input not found, trying Tab + type...");
        // Try Tab to move to next field and type
        await this.page.keyboard.press("Tab");
        await this.randomDelay(500, 1000);
        await this.page.keyboard.type(fullStateName, { delay: 100 });
        await this.randomDelay(1000, 1500);
      }

      // Wait for location to be applied
      await this.randomDelay(2000, 3000);

      // Try to confirm/apply the location if there's a button
      const applySelectors = [
        'button:has-text("Apply")',
        'button:has-text("Search")',
        'button:has-text("Update")',
        'button[type="submit"]',
      ];

      for (const selector of applySelectors) {
        try {
          const button = await this.page.$(selector);
          if (button && (await button.isVisible())) {
            await button.click();
            await this.randomDelay(2000, 3000);
            console.log(`✅ Applied location`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`✅ Location updated to ${city}, ${fullStateName}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Error updating location to ${location}:`,
        error.message
      );
      await this.page.screenshot({
        path: "location-debug.png",
        fullPage: true,
      });
      return false;
    }
  }

  /**
   * Find all chef profiles with pagination/scrolling support
   */
  async findChefs() {
    console.log("👨‍🍳 Looking for chef profiles...");

    try {
      // Wait for initial content to load
      await this.randomDelay(2000, 3000);

      // Common selectors for chef cards/profiles
      const chefSelectors = [
        '[data-testid*="chef"]',
        '[data-testid*="profile"]',
        ".chef-card",
        ".profile-card",
        "article",
        '[role="article"]',
        ".match-card",
        '[class*="chef"]',
        '[class*="profile"]',
        '[class*="card"]',
      ];

      let allChefs = [];
      let previousCount = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 20; // Prevent infinite scrolling
      let foundSelector = null;

      // First, identify which selector works
      for (const selector of chefSelectors) {
        try {
          const elements = await this.page.$$(selector);
          if (elements.length > 0) {
            foundSelector = selector;
            console.log(
              `✅ Found selector: ${selector} with ${elements.length} initial chefs`
            );
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!foundSelector) {
        console.log(
          "⚠️  No chef profiles found. Taking screenshot for debugging..."
        );
        await this.page.screenshot({ path: "chefs-debug.png", fullPage: true });
        return [];
      }

      // Scroll and collect all chefs
      while (scrollAttempts < maxScrollAttempts) {
        // Get current chefs
        const currentChefs = await this.page.$$(foundSelector);
        allChefs = currentChefs;

        console.log(
          `📊 Found ${allChefs.length} chefs so far (scroll attempt ${
            scrollAttempts + 1
          })`
        );

        // Scroll to load more content
        await this.page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });

        await this.randomDelay(2000, 3000);

        // Check if new content loaded
        const newChefs = await this.page.$$(foundSelector);

        if (
          newChefs.length === allChefs.length &&
          newChefs.length === previousCount
        ) {
          // No new chefs loaded, we've reached the end
          console.log("✅ Reached end of list - no more chefs to load");
          break;
        }

        previousCount = allChefs.length;
        scrollAttempts++;
      }

      // Scroll back to top
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await this.randomDelay(1000, 2000);

      // Get final list of unique chefs
      const finalChefs = await this.page.$$(foundSelector);
      console.log(`✅ Total chefs found: ${finalChefs.length}`);

      if (finalChefs.length === 0) {
        console.log(
          "⚠️  No chef profiles found. Taking screenshot for debugging..."
        );
        await this.page.screenshot({ path: "chefs-debug.png", fullPage: true });
      }

      return finalChefs;
    } catch (error) {
      console.error("❌ Error finding chefs:", error.message);
      return [];
    }
  }

  /**
   * Send message to a chef
   */
  async sendMessage() {
    try {
      console.log("💬 Attempting to send message...");

      const messageButtons = await this.page.locator("button", {
        hasText: /^Message$/i,
      });

      const count = await messageButtons.count();
      console.log(`📨 Found ${count} new Message buttons`);

      for (let i = 0; i < count; i++) {
        const button = messageButtons.nth(i);

        if (await button.isVisible()) {
          console.log(`➡️ Clicking Message button ${i + 1}/${count}`);
          await button.click();
          await this.randomDelay(2000, 3000);

          await this.page.waitForSelector(
            "role=dialog >> text=/send a message/i",
            { timeout: 10000 }
          );

          // await this.page.fill("textarea#message", config.defaultMessage);
          await this.page
            .getByRole("button", {
              name: "Send a message",
            })
            .click();

          console.log("✅ Message sent");

          await this.randomDelay(800, 1200);
        }
      }

      return true;
    } catch (error) {
      console.error("❌ Error sending message:", error.message);
      return false;
    }
  }

  /**
   * Process ALL chefs in current city with rate limiting
   */
  async processChefs() {
    await this.sendMessage();
  }

  /**
   * Helper to find the working chef selector
   */
  async findChefSelector() {
    const chefSelectors = [
      '[data-testid*="chef"]',
      '[data-testid*="profile"]',
      ".chef-card",
      ".profile-card",
      "article",
      '[role="article"]',
      ".match-card",
      '[class*="chef"]',
      '[class*="profile"]',
      '[class*="card"]',
    ];

    for (const selector of chefSelectors) {
      try {
        const elements = await this.page.$$(selector);
        if (elements.length > 0) {
          return selector;
        }
      } catch (e) {
        // Continue
      }
    }
    return null;
  }

  /**
   * Navigate to individuals page with specific page number
   */
  async navigateToChefsNear(pageNumber = 1) {
    console.log(`📍 Navigating to individuals page ${pageNumber}...`);

    try {
      const url = `https://meetachef.com/individuals?page=${pageNumber}`;
      await this.page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await this.randomDelay(3000, 5000);

      console.log(`✅ Successfully navigated to page ${pageNumber}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Error navigating to page ${pageNumber}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Get the page number file path
   */
  getPageNumberFilePath() {
    return path.join(process.cwd(), ".current-page.txt");
  }

  /**
   * Save current page number to file
   */
  async savePageNumber(pageNumber) {
    try {
      const filePath = this.getPageNumberFilePath();
      fs.writeFileSync(filePath, pageNumber.toString(), "utf8");
      console.log(`💾 Saved page number: ${pageNumber}`);
    } catch (error) {
      console.error(`⚠️  Error saving page number:`, error.message);
    }
  }

  /**
   * Load saved page number from file
   */
  loadPageNumber() {
    try {
      const filePath = this.getPageNumberFilePath();
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8").trim();
        const pageNumber = parseInt(content, 10);
        if (!isNaN(pageNumber) && pageNumber > 0) {
          console.log(`📖 Loaded saved page number: ${pageNumber}`);
          return pageNumber;
        }
      }
    } catch (error) {
      console.error(`⚠️  Error loading page number:`, error.message);
    }
    console.log(`📖 No saved page number found, starting from page 1`);
    return 1;
  }

  /**
   * Find all profile links on the current page
   * Uses the exact CSS selector pattern provided by user:
   * #__next > div > div:nth-child(1) > main > div > div > div > div > div.DirectoriesContainer_main__4i8Po > div > div > div.Stack_stack__tmEkS... > a:nth-child(n)
   */

  /**
   * Check if there's a next page available
   */
  async hasNextPage(currentPage) {
    try {
      // Look for next page button or pagination indicators
      const nextPageSelectors = [
        'button:has-text("Next")',
        'a:has-text("Next")',
        'button[aria-label*="next" i]',
        'a[aria-label*="next" i]',
        '[data-testid*="next"]',
        'button:has-text(">")',
        'a:has-text(">")',
        'button[aria-label*="next page" i]',
        'a[aria-label*="next page" i]',
      ];

      for (const selector of nextPageSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && (await element.isVisible())) {
            // Check if it's disabled
            const isDisabled = await element.evaluate((el) => {
              return (
                el.hasAttribute("disabled") ||
                el.classList.contains("disabled") ||
                el.getAttribute("aria-disabled") === "true" ||
                el.getAttribute("aria-disabled") === "disabled"
              );
            });
            if (!isDisabled) {
              console.log(`✅ Found next page button (not disabled)`);
              return true;
            } else {
              console.log(`⚠️  Next page button found but is disabled`);
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Also check current page number vs total pages if available
      try {
        const bodyText = await this.page.textContent("body");
        // Look for patterns like "Page 5 of 10" or "5 / 10" or similar
        const pageMatch =
          bodyText.match(/page\s+(\d+)\s+of\s+(\d+)/i) ||
          bodyText.match(/(\d+)\s*\/\s*(\d+)/);
        if (pageMatch) {
          const current = parseInt(pageMatch[1]);
          const total = parseInt(pageMatch[2]);
          const hasNext = current < total;
          console.log(
            `📄 Page info: ${current} of ${total}, has next: ${hasNext}`
          );
          return hasNext;
        }
      } catch (e) {
        // Ignore
      }

      return true;
    } catch (error) {
      console.error("❌ Error checking for next page:", error.message);
      return false;
    }
  }

  /**
   * Get current page number from URL
   */
  getCurrentPageNumber() {
    try {
      const url = this.page.url();
      const match = url.match(/[?&]page=(\d+)/);
      return match ? parseInt(match[1]) : 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Send message using the specific send message button selector
   */
  async sendMessageToProfile(profileLink, message = config.defaultMessage) {
    try {
      console.log("💬 Attempting to send message to profile...");

      // Click on the profile link to open the profile
      await profileLink.click();
      await this.randomDelay(2000, 3000);

      // Wait for profile page to load
      await this.randomDelay(1500, 2500);

      // Look for the send message button using the exact selector pattern provided by user
      // User's exact selector: #__next > div > div:nth-child(1) > main > div > div > div > div > div.Stack_stack__tmEkS...DirectoriesContainer_main__4i8Po > div > div > div.Stack_stack__tmEkS... > a:nth-child(1) > div > div.Stack_stack__tmEkS...Listing_styles_cardBody__eD7Ue > div.Box_box__GrdOx.Box_displayBlock__AAL5s.Box_tabletDisplayBlock__PWHi6.Box_desktopDisplayNone__C62_U > div > button
      const sendMessageButtonSelectors = [
        // Most specific: exact path from user (highest priority)
        ".Listing_styles_cardBody__eD7Ue > div.Box_box__GrdOx.Box_displayBlock__AAL5s.Box_tabletDisplayBlock__PWHi6.Box_desktopDisplayNone__C62_U > div > button",
        // Slightly more flexible: any button in that Box div
        "div.Box_box__GrdOx.Box_displayBlock__AAL5s.Box_tabletDisplayBlock__PWHi6.Box_desktopDisplayNone__C62_U button",
        // Card body area
        ".Listing_styles_cardBody__eD7Ue button",
        'div[class*="cardBody"] button',
        'div[class*="Listing_styles_cardBody"] button',
        // More generic selectors
        'button:has-text("Send Message")',
        'button:has-text("Message")',
        'button[aria-label*="message" i]',
        'button[aria-label*="send" i]',
        'a:has-text("Message")',
        '[data-testid*="message"]',
        "button.send-message",
        ".message-button",
        // Try to find any button that might be a message button
        'button[type="button"]',
      ];

      let messageButton = null;

      for (const selector of sendMessageButtonSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && (await element.isVisible())) {
            messageButton = element;
            console.log(`✅ Found message button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!messageButton) {
        console.log("⚠️  Message button not found. Taking screenshot...");
        await this.page.screenshot({
          path: `message-button-debug-${Date.now()}.png`,
          fullPage: true,
        });
        // Go back to previous page
        await this.page.goBack();
        await this.randomDelay(2000, 3000);
        return false;
      }

      // Click the message button
      await messageButton.click();
      await this.randomDelay(2000, 3000);

      // Wait for dialog/modal to appear
      // User's exact selector: #cgc-dialog-1765668666349 > div.Overlay_centered__nmWFy > div > div > form > div > button
      // The dialog ID is dynamic, so we'll use a more flexible selector
      console.log("🔍 Waiting for dialog to appear...");
      await this.randomDelay(1500, 2500); // Wait for dialog to appear

      // First, try to find and fill message input if it exists
      console.log("🔍 Looking for message input in dialog...");
      const inputSelectors = [
        "div.Overlay_centered__nmWFy textarea",
        'div.Overlay_centered__nmWFy input[type="text"]',
        '[id^="cgc-dialog"] textarea',
        '[id^="cgc-dialog"] input[type="text"]',
        'textarea[placeholder*="message" i]',
        'textarea[aria-label*="message" i]',
        "textarea",
        '[contenteditable="true"]',
      ];

      let messageInput = null;
      for (const selector of inputSelectors) {
        try {
          const input = await this.page
            .waitForSelector(selector, {
              state: "visible",
              timeout: 2000,
            })
            .catch(() => null);

          if (input && (await input.isVisible())) {
            messageInput = input;
            console.log(`✅ Found message input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (messageInput) {
        // Fill the message
        await messageInput.fill(message);
        await this.randomDelay(1000, 1500);
        console.log("✅ Message filled in dialog");
      } else {
        console.log(
          "⚠️  Message input not found, will try to send without filling (may use default message)"
        );
      }

      // Now find and click the send button in the dialog
      console.log("🔍 Looking for send button in dialog...");
      const sendButtonSelectors = [
        // Most specific: dialog with Overlay_centered__nmWFy > form > div > button
        "div.Overlay_centered__nmWFy > div > div > form > div > button",
        // More flexible: any button in form within Overlay_centered
        "div.Overlay_centered__nmWFy form > div > button",
        "div.Overlay_centered__nmWFy form button",
        // Even more flexible: button in any dialog/modal
        '[id^="cgc-dialog"] div.Overlay_centered__nmWFy form button',
        '[id^="cgc-dialog"] form button',
        '[id^="cgc-dialog"] button',
        // Generic dialog selectors
        'div[class*="Overlay"] form button',
        'div[class*="dialog"] form button',
        'div[class*="modal"] form button',
        // Fallback selectors
        'button:has-text("Send")',
        'button[type="submit"]',
        'button[aria-label*="send" i]',
        'form button[type="submit"]',
        'form button:has-text("Send")',
      ];

      let sendButton = null;
      for (const sendSelector of sendButtonSelectors) {
        try {
          // Wait a bit for the element to appear
          const button = await this.page
            .waitForSelector(sendSelector, {
              state: "visible",
              timeout: 3000,
            })
            .catch(() => null);

          if (button && (await button.isVisible())) {
            sendButton = button;
            console.log(
              `✅ Found send button in dialog with selector: ${sendSelector}`
            );
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!sendButton) {
        console.log(
          "⚠️  Send button in dialog not found. Taking screenshot..."
        );
        await this.page.screenshot({
          path: `send-button-dialog-debug-${Date.now()}.png`,
          fullPage: true,
        });
        // Try to close modal and go back
        try {
          await this.page.keyboard.press("Escape");
          await this.randomDelay(1000, 1500);
        } catch (e) {
          // Ignore
        }
        await this.page.goBack();
        await this.randomDelay(2000, 3000);
        return false;
      }

      // Click the send button in the dialog
      await sendButton.click();
      await this.randomDelay(2000, 3000);
      console.log("✅ Message sent successfully");

      // Close modal/dialog and go back
      try {
        await this.page.keyboard.press("Escape");
        await this.randomDelay(1000, 1500);
      } catch (e) {
        // Ignore
      }

      // Go back to the list page
      await this.page.goBack();
      await this.randomDelay(2000, 3000);
      return true;
    } catch (error) {
      console.error("❌ Error sending message:", error.message);
      // Try to go back
      try {
        await this.page.goBack();
        await this.randomDelay(2000, 3000);
      } catch (e) {
        // Ignore
      }
      return false;
    }
  }

  /**
   * Process all pages from first page to the end
   */
  async processAllPages() {
    console.log("📄 Starting to process all pages...");

    // Load saved page number or start from 1
    let currentPage = this.loadPageNumber();
    let totalMessagesSent = 0;
    let totalMessagesSkipped = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📄 Processing page ${currentPage}`);
      console.log(`${"=".repeat(60)}`);

      // Navigate to current page
      const navigated = await this.navigateToChefsNear(currentPage);
      if (!navigated) {
        console.log(
          `⚠️  Failed to navigate to page ${currentPage}, stopping...`
        );
        break;
      }

      // Process each profile
      let pageSuccessCount = 0;
      let pageSkippedCount = 0;

      for (let i = 0; i < profileLinks.length; i++) {
        console.log(
          `\n📋 Processing profile ${i + 1}/${
            profileLinks.length
          } on page ${currentPage}...`
        );

        try {
          // Ensure we're on the correct page before processing
          const currentUrl = this.page.url();
          if (!currentUrl.includes(`page=${currentPage}`)) {
            console.log(`⚠️  Not on page ${currentPage}, navigating...`);
            await this.navigateToChefsNear(currentPage);
            await this.randomDelay(2000, 3000);
            // Re-find links after navigation
          }

          const success = await this.sendMessageToProfile(profileLinks[i]);
          if (success) {
            pageSuccessCount++;
            totalMessagesSent++;
          } else {
            pageSkippedCount++;
            totalMessagesSkipped++;
          }

          // After sending message, ensure we're back on the correct page
          // sendMessageToProfile() already calls goBack(), but verify we're on the right page
          const urlAfterMessage = this.page.url();
          if (!urlAfterMessage.includes(`page=${currentPage}`)) {
            console.log(
              `⚠️  Not on page ${currentPage} after message, navigating back...`
            );
            await this.navigateToChefsNear(currentPage);
            await this.randomDelay(2000, 3000);
          }

          // Rate limiting between messages
          if (i < profileLinks.length - 1) {
            const delay = config.delayBetweenActions;
            console.log(
              `⏳ Waiting ${delay}ms before next message (rate limiting)...`
            );
            await this.randomDelay(delay, delay + 1000);
          }
        } catch (error) {
          console.error(`❌ Error processing profile ${i + 1}:`, error.message);
          pageSkippedCount++;
          totalMessagesSkipped++;

          // Try to navigate back to the page if we're not on it
          try {
            const currentUrl = this.page.url();
            if (!currentUrl.includes(`page=${currentPage}`)) {
              await this.navigateToChefsNear(currentPage);
              await this.randomDelay(2000, 3000);
            }
          } catch (e) {
            // Ignore navigation errors
          }
        }
      }

      console.log(`\n📊 Summary for page ${currentPage}:`);
      console.log(`   - Total profiles: ${profileLinks.length}`);
      console.log(`   - Messages sent: ${pageSuccessCount}`);
      console.log(`   - Skipped: ${pageSkippedCount}`);

      // Save page number after completing this page
      await this.savePageNumber(currentPage);

      // Check if there's a next page
      hasMorePages = await this.hasNextPage(currentPage);

      if (hasMorePages) {
        currentPage++;
        // Save the new page number before navigating
        await this.savePageNumber(currentPage);
        console.log(`\n⏳ Moving to next page (${currentPage})...`);
        await this.randomDelay(3000, 5000);
      } else {
        console.log("\n✅ Reached the last page");
        // Clear saved page number when done
        try {
          const filePath = this.getPageNumberFilePath();
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("🗑️  Cleared saved page number (all pages completed)");
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 FINAL SUMMARY");
    console.log(`${"=".repeat(60)}`);
    console.log(`   - Total pages processed: ${currentPage}`);
    console.log(`   - Total messages sent: ${totalMessagesSent}`);
    console.log(`   - Total messages skipped: ${totalMessagesSkipped}`);
    console.log(`${"=".repeat(60)}\n`);

    return {
      totalPages: currentPage,
      totalSent: totalMessagesSent,
      totalSkipped: totalMessagesSkipped,
    };
  }

  /**
   * Random delay to simulate human behavior
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * Main automation flow - processes all pages on chefs
   */
  async run() {
    try {
      await this.init();

      // Ensure user is logged in
      const loggedIn = await this.ensureLoggedIn();
      if (!loggedIn) {
        console.log("⚠️  Login failed, but continuing...");
        console.log("💡 You can manually log in in the browser window");
        console.log("⏳ Waiting 10 seconds for manual login...");
        await this.randomDelay(10000, 10000);
      }

      // Process all pages on chefs
      const result = await this.processAllPages();

      console.log("\n✅ Automation completed successfully!");
    } catch (error) {
      console.error("❌ Automation error:", error);
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }

  /**
   * Alternative automation flow - processes chefs by city (original flow)
   */
  async runByCity() {
    try {
      await this.init();

      // Navigate to individuals page
      const navigated = await this.navigateToMatches();
      if (!navigated) {
        console.log(
          "⚠️  Navigation failed, but continuing to allow manual intervention..."
        );
        console.log(
          "💡 You can manually navigate to https://meetachef.com/individuals in the browser window"
        );
        console.log("⏳ Waiting 10 seconds for manual navigation...");
        await this.randomDelay(10000, 10000);
      }

      // Process chefs pages if enabled
      if (config.runChefsNearPages) {
        await this.processChefsNearPages();
      }

      // Update location for each major US city (if enabled)
      if (config.runMatchesByCity) {
        for (const city of config.usCities) {
          console.log(`\n${"=".repeat(60)}`);
          console.log(`🏙️  Processing location: ${city}`);
          console.log(`${"=".repeat(60)}`);

          // Update location
          const locationUpdated = await this.updateLocation(city);
          if (locationUpdated) {
            await this.randomDelay(3000, 4000); // Wait for location to apply
          } else {
            console.log("⚠️  Location update failed, but continuing...");
            await this.randomDelay(2000, 3000);
          }

          // Process ALL chefs for this location before moving to next city
          await this.sendMessage();

          // Longer delay between cities
          if (city !== config.usCities[config.usCities.length - 1]) {
            console.log(`\n⏳ Waiting before next city...`);
            await this.randomDelay(5000, 7000);
          }
        }
      }

      console.log("\n✅ Automation completed successfully!");
    } catch (error) {
      console.error("❌ Automation error:", error);
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }
}

// Run automation
const automation = new MeetachefAutomation();
automation.run().catch(console.error);

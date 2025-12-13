import { chromium } from 'playwright';
import { config } from './config.js';

/**
 * Meetachef Automation Tool
 * Automates browsing meetachef.com to connect with chefs
 * Respects site policies with rate limiting and delays
 */

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
    console.log('🚀 Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: config.headless,
      slowMo: config.slowMo, // Slow down operations for human-like behavior
    });

    this.context = await this.browser.newContext({
      userAgent: config.userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    this.page = await this.context.newPage();
    
    // Set extra HTTP headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    console.log('✅ Browser initialized');
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
        '.user-menu',
        '.account-menu',
      ];

      for (const selector of loggedInIndicators) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
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
    console.log('🔐 Attempting to log in...');
    
    try {
      // Look for login button/link
      const loginButtonSelectors = [
        'button:has-text("Log in")',
        'button:has-text("Sign in")',
        'a:has-text("Log in")',
        'a:has-text("Sign in")',
        'a[href*="/login"]',
        'a[href*="/signin"]',
        '[data-testid*="login"]',
        '.login-button',
        'button.login',
      ];

      let loginButton = null;
      
      for (const selector of loginButtonSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
            loginButton = element;
            console.log(`✅ Found login button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!loginButton) {
        console.log('⚠️  Login button not found. Checking if already logged in...');
        if (await this.isLoggedIn()) {
          console.log('✅ Already logged in!');
          return true;
        }
        console.log('❌ Could not find login button');
        return false;
      }

      // Click login button
      await loginButton.click();
      await this.randomDelay(2000, 3000);

      // Wait for login form to appear
      await this.randomDelay(1000, 2000);

      // Find email input field
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]',
        '#email',
        '.email-input',
      ];

      let emailInput = null;
      for (const selector of emailSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
            emailInput = element;
            console.log(`✅ Found email input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!emailInput) {
        console.log('❌ Could not find email input field');
        await this.page.screenshot({ path: 'login-form-debug.png' });
        return false;
      }

      // Fill email
      await emailInput.fill(config.credentials.email);
      await this.randomDelay(500, 1000);

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
        '#password',
        '.password-input',
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
              console.log(`✅ Found password input (may be hidden) with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      if (!passwordInput) {
        console.log('❌ Could not find password input field');
        await this.page.screenshot({ path: 'login-form-debug.png', fullPage: true });
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
        'button.submit',
        'form button',
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
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
        console.log('⚠️  Submit button not found, trying Enter key...');
        await this.page.keyboard.press('Enter');
      } else {
        await submitButton.click();
      }

      // Wait for login to complete
      console.log('⏳ Waiting for login to complete...');
      await this.randomDelay(3000, 5000);

      // Check if login was successful
      if (await this.isLoggedIn()) {
        console.log('✅ Login successful!');
        return true;
      } else {
        console.log('⚠️  Login status unclear. Taking screenshot...');
        await this.page.screenshot({ path: 'login-result.png' });
        // Still return true to continue - might be on a different page
        return true;
      }
    } catch (error) {
      console.error('❌ Error during login:', error.message);
      await this.page.screenshot({ path: 'login-error.png' });
      return false;
    }
  }

  /**
   * Check login status and perform login if needed
   */
  async ensureLoggedIn() {
    console.log('🔐 Checking login status...');
    
    // Check if already logged in
    if (await this.isLoggedIn()) {
      console.log('✅ Already logged in!');
      return true;
    }

    // Attempt to log in
    console.log('🔑 Login required, attempting automatic login...');
    return await this.login();
  }

  /**
   * Navigate to matches page
   */
  async navigateToMatches() {
    console.log('📍 Navigating to matches page...');
    
    try {
      // First try to go to main page to check authentication
      console.log('🌐 Checking main page first...');
      await this.page.goto('https://meetachef.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.randomDelay(2000, 3000);
      
      // Check if login is needed and perform login
      const loggedIn = await this.ensureLoggedIn();
      if (!loggedIn) {
        console.log('⚠️  Login failed, but continuing...');
      }

      // Now navigate to matches page with more lenient wait condition
      console.log('📍 Navigating to matches page...');
      await this.page.goto('https://meetachef.com/matches', {
        waitUntil: 'domcontentloaded', // Changed from 'networkidle' to be more lenient
        timeout: 60000, // Increased timeout
      });

      // Wait for page to fully load
      await this.randomDelay(3000, 5000);
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'matches-page.png', fullPage: true });
      console.log('📸 Screenshot saved as matches-page.png');
      
      console.log('✅ Successfully navigated to matches page');
      return true;
    } catch (error) {
      console.error('❌ Error navigating to matches page:', error.message);
      console.log('📸 Taking error screenshot...');
      try {
        await this.page.screenshot({ path: 'navigation-error.png', fullPage: true });
        console.log('📸 Error screenshot saved as navigation-error.png');
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
    const parts = location.split(',').map(p => p.trim());
    if (parts.length === 2) {
      return {
        city: parts[0],
        state: parts[1]
      };
    }
    return { city: location, state: '' };
  }

  /**
   * Get full state name from abbreviation
   */
  getFullStateName(abbreviation) {
    const stateMap = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
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
        '.location-selector',
        '#location',
      ];

      let locationElement = null;
      
      for (const selector of locationSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
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
      console.log('   Step 1: Inputting city name...');
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
        console.log('⚠️  City input not found, trying alternative approach...');
        // Try typing directly
        await this.page.keyboard.type(city, { delay: 100 });
        await this.randomDelay(1000, 1500);
      }

      // Step 2: Find and fill state input
      console.log('   Step 2: Inputting state name...');
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
        const tagName = await stateInput.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
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
        console.log('⚠️  State input not found, trying Tab + type...');
        // Try Tab to move to next field and type
        await this.page.keyboard.press('Tab');
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
          if (button && await button.isVisible()) {
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
      console.error(`❌ Error updating location to ${location}:`, error.message);
      await this.page.screenshot({ path: 'location-debug.png', fullPage: true });
      return false;
    }
  }

  /**
   * Find all chef profiles with pagination/scrolling support
   */
  async findChefs() {
    console.log('👨‍🍳 Looking for chef profiles...');
    
    try {
      // Wait for initial content to load
      await this.randomDelay(2000, 3000);

      // Common selectors for chef cards/profiles
      const chefSelectors = [
        '[data-testid*="chef"]',
        '[data-testid*="profile"]',
        '.chef-card',
        '.profile-card',
        'article',
        '[role="article"]',
        '.match-card',
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
            console.log(`✅ Found selector: ${selector} with ${elements.length} initial chefs`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!foundSelector) {
        console.log('⚠️  No chef profiles found. Taking screenshot for debugging...');
        await this.page.screenshot({ path: 'chefs-debug.png', fullPage: true });
        return [];
      }

      // Scroll and collect all chefs
      while (scrollAttempts < maxScrollAttempts) {
        // Get current chefs
        const currentChefs = await this.page.$$(foundSelector);
        allChefs = currentChefs;
        
        console.log(`📊 Found ${allChefs.length} chefs so far (scroll attempt ${scrollAttempts + 1})`);

        // Scroll to load more content
        await this.page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        
        await this.randomDelay(2000, 3000);

        // Check if new content loaded
        const newChefs = await this.page.$$(foundSelector);
        
        if (newChefs.length === allChefs.length && newChefs.length === previousCount) {
          // No new chefs loaded, we've reached the end
          console.log('✅ Reached end of list - no more chefs to load');
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
        console.log('⚠️  No chef profiles found. Taking screenshot for debugging...');
        await this.page.screenshot({ path: 'chefs-debug.png', fullPage: true });
      }

      return finalChefs;
    } catch (error) {
      console.error('❌ Error finding chefs:', error.message);
      return [];
    }
  }

  /**
   * Send message to a chef
   */
  async sendMessage(chefElement, message = config.defaultMessage) {
    try {
      console.log('💬 Attempting to send message...');

      // Click on the chef profile/card to open details
      await chefElement.click();
      await this.randomDelay(1500, 2500);

      // Look for message button or input
      const messageSelectors = [
        'button:has-text("Message")',
        'button:has-text("Send Message")',
        'button[aria-label*="message" i]',
        'a:has-text("Message")',
        '[data-testid*="message"]',
        'button.send-message',
        '.message-button',
      ];

      let messageButton = null;
      
      for (const selector of messageSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element && await element.isVisible()) {
            messageButton = element;
            console.log(`✅ Found message button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (messageButton) {
        await messageButton.click();
        await this.randomDelay(1500, 2500);

        // Find message input field
        const inputSelectors = [
          'textarea[placeholder*="message" i]',
          'textarea[aria-label*="message" i]',
          'input[type="text"][placeholder*="message" i]',
          'textarea',
          '[contenteditable="true"]',
        ];

        for (const selector of inputSelectors) {
          try {
            const input = await this.page.$(selector);
            if (input && await input.isVisible()) {
              await input.fill(message);
              await this.randomDelay(1000, 1500);

              // Find and click send button
              const sendSelectors = [
                'button:has-text("Send")',
                'button[type="submit"]',
                'button[aria-label*="send" i]',
                'button.send',
              ];

              for (const sendSelector of sendSelectors) {
                try {
                  const sendButton = await this.page.$(sendSelector);
                  if (sendButton && await input.isVisible()) {
                    await sendButton.click();
                    await this.randomDelay(2000, 3000);
                    console.log('✅ Message sent successfully');
                    return true;
                  }
                } catch (e) {
                  // Continue to next selector
                }
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      } else {
        console.log('⚠️  Message button not found. This chef may not be available for messaging.');
      }

      // Close any modal or go back
      try {
        await this.page.keyboard.press('Escape');
        await this.randomDelay(500, 1000);
      } catch (e) {
        // Ignore if escape doesn't work
      }

      return false;
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
      return false;
    }
  }

  /**
   * Process ALL chefs in current city with rate limiting
   */
  async processChefs() {
    console.log(`👨‍🍳 Finding all chefs in current city...`);

    const chefs = await this.findChefs();
    
    if (chefs.length === 0) {
      console.log('⚠️  No chefs found to process in this city');
      return { total: 0, success: 0 };
    }

    console.log(`\n📋 Processing ALL ${chefs.length} chefs in this city...`);
    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < chefs.length; i++) {
      console.log(`\n📋 Processing chef ${i + 1}/${chefs.length}...`);
      
      try {
        // Re-find all chefs to get fresh list
        const chefSelector = await this.findChefSelector();
        if (!chefSelector) {
          console.log('⚠️  Could not find chef selector, stopping...');
          break;
        }
        
        const currentChefs = await this.page.$$(chefSelector);
        if (i >= currentChefs.length) {
          console.log('⚠️  Chef index out of range, stopping...');
          break;
        }

        const success = await this.sendMessage(currentChefs[i]);
        if (success) {
          successCount++;
        } else {
          skippedCount++;
        }

        // Rate limiting - respect site policies
        if (i < chefs.length - 1) {
          const delay = config.delayBetweenActions;
          console.log(`⏳ Waiting ${delay}ms before next action (rate limiting)...`);
          await this.randomDelay(delay, delay + 1000);
        }
      } catch (error) {
        console.error(`❌ Error processing chef ${i + 1}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ City completed: ${successCount}/${chefs.length} messages sent (${skippedCount} skipped)`);
    return { total: chefs.length, success: successCount, skipped: skippedCount };
  }

  /**
   * Helper to find the working chef selector
   */
  async findChefSelector() {
    const chefSelectors = [
      '[data-testid*="chef"]',
      '[data-testid*="profile"]',
      '.chef-card',
      '.profile-card',
      'article',
      '[role="article"]',
      '.match-card',
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
   * Random delay to simulate human behavior
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * Main automation flow
   */
  async run() {
    try {
      await this.init();
      
      // Navigate to matches page
      const navigated = await this.navigateToMatches();
      if (!navigated) {
        console.log('⚠️  Navigation failed, but continuing to allow manual intervention...');
        console.log('💡 You can manually navigate to https://meetachef.com/matches in the browser window');
        console.log('⏳ Waiting 10 seconds for manual navigation...');
        await this.randomDelay(10000, 10000);
      }

      // Update location for each major US city
      for (const city of config.usCities) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🏙️  Processing location: ${city}`);
        console.log(`${'='.repeat(60)}`);
        
        // Update location
        const locationUpdated = await this.updateLocation(city);
        if (locationUpdated) {
          await this.randomDelay(3000, 4000); // Wait for location to apply
        } else {
          console.log('⚠️  Location update failed, but continuing...');
          await this.randomDelay(2000, 3000);
        }
        
        // Process ALL chefs for this location before moving to next city
        const result = await this.processChefs();
        
        console.log(`\n📊 Summary for ${city}:`);
        console.log(`   - Total chefs: ${result.total}`);
        console.log(`   - Messages sent: ${result.success}`);
        console.log(`   - Skipped: ${result.skipped}`);
        
        // Longer delay between cities
        if (city !== config.usCities[config.usCities.length - 1]) {
          console.log(`\n⏳ Waiting before next city...`);
          await this.randomDelay(5000, 7000);
        }
      }

      console.log('\n✅ Automation completed successfully!');
    } catch (error) {
      console.error('❌ Automation error:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('🔒 Browser closed');
      }
    }
  }
}

// Run automation
const automation = new MeetachefAutomation();
automation.run().catch(console.error);


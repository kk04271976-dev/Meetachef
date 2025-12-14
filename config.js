/**
 * Configuration file for Meetachef Automation
 * Adjust these settings according to your needs and site policies
 */

export const config = {
  // Browser settings
  headless: false, // Set to true to run in background
  slowMo: 100, // Slow down operations by 100ms (simulates human behavior)

  // User agent - use a realistic browser user agent
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Major US cities with high population
  usCities: [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA',
    'Austin, TX',
    'Jacksonville, FL',
    'San Francisco, CA',
    'Columbus, OH',
    'Fort Worth, TX',
    'Charlotte, NC',
    'Seattle, WA',
    'Denver, CO',
    'Boston, MA',
    'Nashville, TN',
  ],

  // Default message to send to chefs
  defaultMessage: `Hello! I'm interested in collaborating with you. I'd love to learn more about your culinary expertise and explore potential opportunities to work together. Looking forward to connecting!`,

  // Automation mode settings
  runChefsNearPages: true, // Set to true to process chefs/near pages
  runMatchesByCity: true, // Set to true to process matches by city

  // Rate limiting settings (important for policy compliance)
  delayBetweenActions: 3000, // Minimum delay between actions in milliseconds (3 seconds)
  // Note: maxChefsPerSession is no longer used - all chefs in each city are processed

  // Timeout settings
  pageTimeout: 30000, // 30 seconds
  actionTimeout: 10000, // 10 seconds

  // Login credentials
  // ⚠️ SECURITY NOTE: Consider using environment variables for production use
  credentials: {
    email: 'thomasdpurdy@outlook.com',
    password: 'i7ZrdrhjK9R9Yww',
  },
  resume: {
    enabled: true,
    progressFile: '.progress.json',
    startPage: 1,
  },
};


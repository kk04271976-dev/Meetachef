# Meetachef Automation Tool

An automated Node.js application using Playwright to connect with chefs on meetachef.com. This tool helps you efficiently browse matches, update locations for major US cities, and send collaboration messages to chefs.

## ⚠️ Important: Policy Compliance

This tool is designed to respect meetachef.com's Terms of Service:
- Includes rate limiting to avoid overwhelming the server
- Uses realistic delays between actions
- Implements human-like browsing behavior
- Uses proper user agent strings
- Respects reasonable usage limits

**Please review meetachef.com's Terms of Service before using this tool.**

## 🚀 Features

- ✅ **Automatic login** - Logs in automatically with your credentials
- ✅ Automated navigation to matches page
- ✅ Location updates for major US cities
- ✅ Chef profile discovery
- ✅ Automated message sending with customizable default message
- ✅ Rate limiting and policy compliance
- ✅ Human-like behavior simulation
- ✅ Error handling and debugging screenshots

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install-browsers
```

Or use:
```bash
npx playwright install chromium
```

## ⚙️ Configuration

Edit `config.js` to customize:

- **Cities**: Modify `usCities` array to target specific locations
- **Default Message**: Change `defaultMessage` to your preferred collaboration message
- **Rate Limiting**: Adjust `delayBetweenActions` (minimum 3 seconds recommended)
- **Max Chefs**: Set `maxChefsPerSession` to limit contacts per run
- **Headless Mode**: Set `headless: true` to run in background
- **Credentials**: Login credentials are stored in `config.js` (consider using environment variables for production)

### 🔐 Security Note

Credentials are currently stored in `config.js`. For better security:
- Consider using environment variables
- Never commit credentials to version control
- The `.gitignore` file is configured to help prevent accidental commits

## 🎯 Usage

Run the automation:
```bash
npm start
```

Or directly:
```bash
node index.js
```

## 📝 How It Works

1. **Initialization**: Launches browser with realistic settings
2. **Navigation**: Goes to https://meetachef.com/matches
3. **Location Updates**: Cycles through major US cities
4. **Chef Discovery**: Finds available chef profiles
5. **Messaging**: Sends collaboration messages with rate limiting
6. **Compliance**: Includes delays and human-like behavior

## 🔍 Debugging

If the tool encounters issues:
- Screenshots are saved as `location-debug.png` and `chefs-debug.png`
- Check console output for detailed error messages
- Verify the site structure hasn't changed (selectors may need updates)

## ⚖️ Legal & Ethical Considerations

- **Always comply with meetachef.com's Terms of Service**
- **Use responsibly** - don't spam or abuse the platform
- **Respect rate limits** - the tool includes delays, but monitor your usage
- **Review messages** - customize the default message to be genuine
- **Manual verification** - periodically check your account manually

## 🛡️ Best Practices

1. Start with small test runs (set `maxChefsPerSession` to 1-2)
2. Monitor your account for any issues
3. Adjust delays if needed (increase `delayBetweenActions`)
4. Customize messages to be personal and relevant
5. Don't run multiple instances simultaneously

## 📦 Project Structure

```
meetachef-automation/
├── index.js          # Main automation script
├── config.js         # Configuration settings
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## 🐛 Troubleshooting

**Issue**: Selectors not finding elements
- **Solution**: The site structure may have changed. Check screenshots and update selectors in `index.js`

**Issue**: Messages not sending
- **Solution**: Verify you're logged in and have messaging permissions

**Issue**: Location not updating
- **Solution**: Check if location feature requires different interaction (may need manual setup first)

## 📄 License

MIT License - Use responsibly and in compliance with meetachef.com's policies.

## 🤝 Contributing

Feel free to improve this tool while maintaining ethical automation practices.

---

**Remember**: Automation should enhance your workflow, not replace genuine human interaction. Use this tool to efficiently connect with chefs, but always maintain authentic communication.


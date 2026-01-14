# DPDC Telegram Customer Info Bot

---

## 📢 **TEAM TESTING ANNOUNCEMENT**

### 🤖 **Bot Link:** [https://t.me/DPDC_customerInfo_bot](https://t.me/DPDC_customerInfo_bot)

**Dear Team,**

We're excited to announce our new **DPDC Customer Info Telegram Bot** is ready for testing! 🎉

This bot allows customers to instantly check their electricity account information, billing history, and recharge records directly through Telegram - no need to log into the website!

### **Quick Start:**
1. **Click the link:** [https://t.me/DPDC_customerInfo_bot](https://t.me/DPDC_customerInfo_bot)
2. **Press "START"** or type `/start`
3. **Send a Customer Number** (e.g., `30295639`) or **Meter Number** (e.g., `70048800`)
4. **Explore the features** using the interactive buttons

### **What Can You Test:**
✅ Customer Information lookup
✅ Monthly billing history (Last Month, 6 Months, Year, All Records)
✅ Recharge transaction history
✅ Balance checking (Credit/Due status)
✅ Navigation and button responsiveness
✅ Error handling (try invalid numbers)

### **Please Test and Report:**
- Any bugs or errors you encounter
- UI/UX suggestions
- Missing features
- Performance issues
- Any confusion in the user flow

**Let's make this bot amazing!** 🚀

---

## Bot Information

**Bot Username:** [@DPDC_customerInfo_bot](https://t.me/DPDC_customerInfo_bot)
**Bot Link:** `https://t.me/DPDC_customerInfo_bot`
**Bot Token:** `8575870159:AAHupxIlKBLpBS_7PEY9t41qfeNLdl8tobk`

## Features

The bot provides customers with instant access to their electricity account information through Telegram.

### Main Features:
1. **Customer Information** - View account details, balance, and meter status
2. **Monthly Billing History** - View billing records for different time periods
3. **Recharge History** - View payment records and recharge history

---

## How to Use

### 1. Start the Bot

Send one of these commands to the bot:
- `/start`
- `/hello`
- `/hi`

The bot will greet you and ask for your customer number or meter number.

### 2. Send Customer Number or Meter Number

Simply type and send:
- Your Customer Number (e.g., `30295639`)
- OR Your Meter Number (e.g., `70048800`)

The bot will:
- Fetch your account information
- Greet you by name
- Show you a menu with 3 options

### 3. Choose What You Want to See

#### Option 1: Customer Information 👤
Shows:
- Customer ID
- Meter Number
- NOCS (area)
- Phone Number
- Address
- **Current Balance** (Due/Credit/Paid)
- **Last Bill Date**

#### Option 2: Billing History 📊
You can view monthly billing for:
- **Last Month** - Most recent bill
- **Last 6 Months** - Recent 6 months
- **Last 1 Year** - Past 12 months
- **All Records** - Complete history

Each billing record shows:
- Month & Year
- Total Consumption (kWh)
- Total Charges (৳)

#### Option 3: Recharge History 💳
You can view recharges for:
- **Last Recharge** - Most recent payment
- **Last 6 Months** - Recent 6 months
- **Last 1 Year** - Past 12 months
- **All Records** - Complete history

Each recharge record shows:
- Recharge Date
- Recharge Amount (৳)
- Energy Cost (৳)

---

## Example Conversation

```
User: /start

Bot: 👋 Welcome to DPDC Customer Info Bot!
     I can help you get information about your electricity account.

     📋 Please send me:
     • Your Customer Number
     • OR Your Meter Number

     I'll provide you with your account details and billing information.

User: 30295639

Bot: ⏳ Fetching customer details...

Bot: 👋 Hello Md. Rahman!
     I found your account. What would you like to know?

     📋 Please select an option:

     [Button: 👤 Customer Information]
     [Button: 📊 Billing History]
     [Button: 💳 Recharge History]

User: [Clicks "Customer Information"]

Bot: 👤 Customer Information

     📋 Customer ID: 30295639
     ⚡ Meter Number: 70048800
     📍 NOCS: Gulshan
     📞 Phone: 01712345678
     🏠 Address: House 12, Road 5, Gulshan-2, Dhaka

     💰 Current Balance: ৳ 1,250.50
     🔴 Status: Due Amount

     📅 Last Bill Date: Nov 24, 2024

     [Button: ⬅️ Back to Menu]
```

---

## Deployment Instructions

### On Production Server:

1. **Pull latest changes:**
```bash
cd /var/www/dpdc-ami
git pull origin main
```

2. **Install new dependencies:**
```bash
cd backend
npm install
```

3. **Add bot token to production .env:**
```bash
nano backend/.env
```

Add this line:
```
TELEGRAM_BOT_TOKEN=8575870159:AAHupxIlKBLpBS_7PEY9t41qfeNLdl8tobk
```

4. **Restart backend:**
```bash
pm2 restart dpdc-backend
```

5. **Verify bot is running:**
```bash
pm2 logs dpdc-backend | grep "Telegram"
```

You should see:
```
✅ Telegram Bot initialized and ready at @DPDC_customerInfo_bot
```

---

## Technical Details

### Files Added/Modified:
- `backend/src/services/telegram-bot.service.js` - Main bot service
- `backend/src/server.js` - Bot initialization
- `backend/.env.example` - Added bot token placeholder
- `backend/.env` - Added bot token (DO NOT COMMIT THIS FILE)
- `backend/package.json` - Added `node-telegram-bot-api` dependency

### How It Works:
1. Bot uses polling to receive messages from Telegram
2. When user sends customer/meter number, bot fetches data from Oracle database
3. Data is cached in user session (Map in memory)
4. User navigates menu using inline buttons
5. Bot formats and sends data back as Markdown messages

### Session Management:
- User sessions stored in memory (Map)
- Each session contains: customer data, search value, timestamp
- Sessions persist until server restart
- In production, consider using Redis for persistent sessions

### Bot Commands:
- `/start` - Start bot and show instructions
- `/hello` - Same as start
- `/hi` - Same as start

### Data Source:
Bot uses the same SQL queries as the Customer Details page:
- `customer_details_search.sql` - Search by customer ID
- `customer_search_by_meter.sql` - Search by meter number
- `customer_billing_details.sql` - Get billing records
- `customer_recharge_history.sql` - Get recharge records

---

## Testing the Bot

### On Local Development:

1. **Start backend with bot token:**
```bash
cd backend
# Make sure .env has TELEGRAM_BOT_TOKEN
npm start
```

2. **Open Telegram and search for:** `@DPDC_customerInfo_bot`

3. **Test scenarios:**
   - Send `/start` command
   - Send a valid customer number
   - Try all menu options
   - Test different time period filters
   - Test with invalid customer number

### On Production:

After deploying, test with real customer data:
1. Get a valid customer number from the customer-details page
2. Send it to the bot
3. Verify all data matches the web interface
4. Test all menu options

---

## Security Notes

⚠️ **IMPORTANT:**
- Bot token is sensitive - never commit `.env` file to git
- Token is in `.env.example` as placeholder only
- Production server needs the token added manually
- Consider rate limiting bot requests in the future
- Consider adding user authentication in future versions

---

## Troubleshooting

### Bot Not Responding:
1. Check backend logs: `pm2 logs dpdc-backend`
2. Verify token in .env file
3. Check Oracle database connectivity
4. Restart backend: `pm2 restart dpdc-backend`

### "Customer not found" Error:
- Verify customer number is correct
- Check if customer exists in Oracle database
- Try searching by meter number instead

### Session Expired Message:
- User sessions are stored in memory
- Server restart clears all sessions
- User needs to send customer number again

---

## Future Enhancements

Possible improvements:
1. Add user authentication (OTP verification)
2. Enable bill payment through bot
3. Add consumption alerts/notifications
4. Add load shedding schedule information
5. Multi-language support (Bengali/English)
6. Persistent session storage with Redis
7. Rate limiting per user
8. Admin commands for bot management

---

## Support

For issues or questions:
- Check backend logs: `pm2 logs dpdc-backend`
- Review error messages in Telegram
- Contact development team

Bot Status: **Active and Ready** ✅
Last Updated: December 5, 2024

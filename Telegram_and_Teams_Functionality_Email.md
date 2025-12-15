# DPDC AMI System - Telegram Bot & MS Teams Reports

**To:** Management Team
**From:** Development Team
**Date:** December 14, 2025
**Subject:** Automated Customer Service & Operational Monitoring Systems

---

## Executive Summary

We have successfully implemented two automated systems to improve customer service and operational monitoring:

1. **Telegram Customer Service Bot** - Allows customers to check their account information instantly via Telegram
2. **MS Teams Automated Reports** - Sends real-time operational updates to our Teams channels

Both systems are fully operational and running automatically.

---

## 1. TELEGRAM CUSTOMER SERVICE BOT

### What It Does

The DPDC Customer Info Bot is a Telegram chatbot that provides instant access to customer account information without requiring customers to log into the website or call customer service.

**Bot Link:** https://t.me/DPDC_customerInfo_bot
**Status:** Live and operational 24/7

### How Customers Use It

**Step 1:** Open Telegram and search for `@DPDC_customerInfo_bot`

**Step 2:** Press "START" to begin

**Step 3:** Send their Customer Number or Meter Number

**Step 4:** Bot displays a menu with three options:
- 👤 Customer Information
- 📊 Billing History
- 💳 Recharge History

**Step 5:** Customer selects what they want to see

**Step 6:** Bot displays the requested information instantly

### What Information Can Customers Access?

#### Customer Information
- Customer ID and Name
- Meter Number
- NOCS Area (e.g., Gulshan, Mirpur)
- Phone Number
- Full Address
- Current Balance (shows if they have credit or due amount)
- Last Bill Date

#### Billing History
Customers can view their monthly electricity bills for:
- Last Month
- Last 6 Months
- Last 1 Year
- All Records

Each bill shows:
- Month and Year
- Total Consumption (kWh)
- Total Charges (৳)

#### Recharge History
Customers can view their payment records for:
- Last Recharge
- Last 6 Months
- Last 1 Year
- All Records

Each recharge shows:
- Recharge Date
- Recharge Amount (৳)
- Energy Cost (৳)

### Example Conversation

```
User: /start

Bot: 👋 Welcome to DPDC Customer Info Bot!
     I can help you get information about your electricity account.

     Please send me your Customer Number or Meter Number.

User: 30295639

Bot: ⏳ Fetching customer details...

Bot: 👋 Hello Md. Rahman!
     I found your account. What would you like to know?

     [👤 Customer Information] [📊 Billing History] [💳 Recharge History]

User: [Clicks "Customer Information"]

Bot: 👤 Customer Information

     Customer ID: 30295639
     Meter Number: 70048800
     NOCS: Gulshan
     Phone: 01712345678
     Address: House 12, Road 5, Gulshan-2, Dhaka

     Current Balance: ৳ 1,250.50
     Status: Due Amount

     Last Bill Date: Nov 24, 2024
```

### Key Benefits

✅ **24/7 Availability** - Customers can check information anytime
✅ **Instant Access** - No login required, just send customer number
✅ **Reduces Call Volume** - Fewer customers calling for basic information
✅ **Mobile-Friendly** - Works on any device with Telegram
✅ **Easy to Use** - Simple button-based navigation
✅ **Real-Time Data** - Shows current information from our database

---

## 2. MS TEAMS AUTOMATED REPORTS

### What It Does

The system automatically sends operational monitoring reports to our Microsoft Teams channels at scheduled intervals. This keeps the operations team informed about system performance without manual checking.

### Report 1: Batch Monitoring Report

**Sent:** Every 30 minutes
**Purpose:** Monitor batch processing jobs and detect issues early

#### What This Report Shows

**Pending IMD Records**
- Current count of pending IMD records waiting to be processed
- Last update time
- Example: "69,895 records pending"

**Currently Running Batches**
For each batch job that's currently running:
- Batch Name (e.g., D1-IMD, D1-BILL)
- When it started
- How long it's been running
- How many records processed so far
- **RPS (Records Per Second)** - Speed indicator with color codes:
  - 🟢 Green (RPS > 100): Excellent performance
  - 🟡 Yellow (RPS 50-100): Moderate performance
  - 🔴 Red (RPS < 50): Slow performance
- Current status

**24-Hour Performance Statistics**
- Average processing speed over the last 24 hours
- Maximum processing speed achieved
- Maximum records processed
- Number of monitoring checks performed

#### Sample Report Format

```
🔄 BATCH MONITORING REPORT

📋 Pending IMD
69,895 records pending
Last Update: Dec 14, 2025, 10:30 AM

⚡ Currently Running Batches (2)

🟢 D1-IMD                           RPS: 125.50
Start Time: Dec 14, 2025, 8:00 AM
Duration: 2h 30m
Records: 1,250,000
Status: Running

🟡 D1-BILL                          RPS: 75.25
Start Time: Dec 14, 2025, 9:00 AM
Duration: 1h 30m
Records: 450,000
Status: Running

📈 Batch Statistics (Last 24 Hours)

D1-IMD
Avg RPS: 118.50 | Max RPS: 180.25
Max Records: 1,500,000 | Checks: 48
```

#### Stuck Batch Alerts

If a batch job stops processing or slows down significantly, the system sends an **immediate alert** to Teams:

```
🚨 BATCH STUCK ALERT

⚠️ Batch: D1-IMD
Reason: Records not increasing (stuck at 1,250,000 records)

Current Status:
Duration: 3h 15m
Records: 1,250,000
RPS: 0.25 (Very Low)

Comparison:
30 minutes ago: RPS was 125.50
Now: RPS is 0.25
Trend: DEGRADING - Immediate attention required
```

### Report 2: NOCS Balance Summary

**Sent:** Every 60 minutes (1 hour)
**Purpose:** Monitor financial status across all NOCS areas

#### What This Report Shows

```
💰 NOCS Balance - Overall Summary

🏢 Total NOCS Areas: 17
👥 Total Customers: 2,31,435

💚 Credit Balance: ৳22,47,03,188.91
   (1,69,070 customers with credit)

🔴 Due Balance: -৳25,08,39,233.46
   (61,324 customers with dues)

💰 Net Balance: -৳2,61,36,044.55

Last Updated: Dec 14, 2025, 10:30 AM
```

#### Key Metrics Explained

- **Total NOCS Areas** - Number of operational areas being monitored
- **Total Customers** - Active customer count across all areas
- **Credit Balance** - Total amount customers have paid in advance
- **Due Balance** - Total amount customers owe
- **Net Balance** - Overall financial position (Due - Credit)

### How the System Works

**Batch Monitoring (Every 30 Minutes):**
1. System checks Oracle database for batch jobs
2. Calculates processing speed (RPS) for each running batch
3. Compares current performance with previous checks
4. Detects if any batch is stuck or running slow
5. Sends report to Teams channel
6. If issues detected, sends immediate alert

**NOCS Balance (Every 60 Minutes):**
1. System retrieves balance data from database cache
2. Calculates totals across all NOCS areas
3. Formats summary with key metrics
4. Sends report to Teams channel

### Key Benefits

✅ **Proactive Monitoring** - Issues are detected automatically
✅ **Real-Time Alerts** - Team is notified immediately when batches get stuck
✅ **Performance Tracking** - Historical data shows trends over 24 hours
✅ **Financial Visibility** - Hourly updates on balance status
✅ **No Manual Checking** - Reports arrive automatically in Teams
✅ **Centralized Information** - All team members see the same data

---

## COMPARISON: Telegram vs Teams

| Feature | Telegram Bot | MS Teams Reports |
|---------|--------------|------------------|
| **Who uses it** | External Customers | Internal Operations Team |
| **Purpose** | Customer self-service | Operations monitoring |
| **When it runs** | On-demand (when customer asks) | Automatic (30/60 minutes) |
| **What it shows** | Customer billing & recharge | Batch jobs & balance summary |
| **How it works** | Interactive with buttons | Automatic reports sent to channel |
| **Access** | Public (anyone can use) | Private (Teams channel only) |

---

## CURRENT STATUS

### Telegram Customer Service Bot
**Status:** ✅ Live and Running
**Availability:** 24/7
**Access:** https://t.me/DPDC_customerInfo_bot
**Usage:** Available to all customers immediately

### MS Teams Reports
**Status:** ✅ Live and Running
**Batch Monitoring:** Sending reports every 30 minutes
**NOCS Balance:** Sending reports every 60 minutes
**Alerts:** Active - sends immediate notifications for stuck batches

---

## BENEFITS SUMMARY

### For Customers (Telegram Bot)
- Get account information instantly without calling or logging in
- Check bills and recharge history anytime
- Easy mobile access via Telegram app
- Fast and convenient self-service

### For Operations Team (MS Teams)
- Early detection of batch processing issues
- Automatic monitoring - no manual checking needed
- Immediate alerts when problems occur
- Historical performance data for analysis
- Regular financial status updates

### For Organization
- Reduced customer service workload
- Improved operational efficiency
- Proactive issue detection and resolution
- Better data visibility for decision making
- Automated reporting saves staff time

---

## NEXT STEPS & RECOMMENDATIONS

### Short Term
1. Monitor usage patterns and gather feedback from customers
2. Train customer service team to promote Telegram bot
3. Review Teams reports daily to identify patterns
4. Optimize alert thresholds based on actual performance

### Future Enhancements
1. **Telegram Bot**
   - Add bill payment feature
   - Send proactive notifications for due bills
   - Add Bengali language support
   - Include load shedding schedule information

2. **MS Teams Reports**
   - Add interactive buttons (e.g., "Restart Batch")
   - Include visual charts in reports
   - Add predictive alerts based on trends
   - Integrate with WhatsApp for critical alerts

---

## SUPPORT

For questions or issues:
- Telegram Bot not responding → Contact development team
- Teams reports not received → Check Teams channel and webhook configuration
- Incorrect data displayed → Report to technical support with details

---

**Document Prepared By:** DPDC AMI Development Team
**Date:** December 14, 2025
**Version:** 1.0

---

This email describes both automated systems now operational in the DPDC AMI platform. Both services are running smoothly and providing value to customers and operations teams respectively.

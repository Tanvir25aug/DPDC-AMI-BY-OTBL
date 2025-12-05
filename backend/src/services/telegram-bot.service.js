const TelegramBot = require('node-telegram-bot-api');
const reportsService = require('./reports.service');
const logger = require('../config/logger');

// User session storage (in production, use Redis or database)
const userSessions = new Map();

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Telegram Bot
   */
  initialize() {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;

      if (!token) {
        logger.warn('[Telegram Bot] No bot token found. Telegram bot disabled.');
        return;
      }

      // Create bot instance
      this.bot = new TelegramBot(token, { polling: true });

      // Set up command handlers
      this.setupHandlers();

      this.isInitialized = true;
      logger.info('[Telegram Bot] Bot initialized successfully');
    } catch (error) {
      logger.error('[Telegram Bot] Failed to initialize:', error);
    }
  }

  /**
   * Setup message and callback handlers
   */
  setupHandlers() {
    // Handle /start, /hello, /hi commands
    this.bot.onText(/\/(start|hello|hi)/i, (msg) => this.handleGreeting(msg));

    // Handle text messages (customer number or meter number)
    this.bot.on('message', (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      this.handleMessage(msg);
    });

    // Handle callback queries (button presses)
    this.bot.on('callback_query', (query) => this.handleCallback(query));

    logger.info('[Telegram Bot] Handlers registered');
  }

  /**
   * Handle greeting messages
   */
  async handleGreeting(msg) {
    const chatId = msg.chat.id;

    const welcomeMessage = `👋 *Welcome to DPDC Customer Info Bot!*

I can help you get information about your electricity account.

📋 *Please send me:*
• Your Customer Number
• OR Your Meter Number

I'll provide you with your account details and billing information.`;

    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Handle incoming messages (customer/meter number)
   */
  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const searchValue = msg.text.trim();

    // Check if it's a customer number or meter number
    if (!searchValue || searchValue.length < 5) {
      await this.bot.sendMessage(
        chatId,
        '⚠️ Please provide a valid Customer Number or Meter Number (minimum 5 digits).'
      );
      return;
    }

    // Send loading message
    const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Fetching customer details...');

    try {
      // Fetch customer data
      const customerData = await this.fetchCustomerData(searchValue);

      if (!customerData) {
        await this.bot.editMessageText(
          '❌ Customer not found. Please check the Customer Number or Meter Number and try again.',
          { chat_id: chatId, message_id: loadingMsg.message_id }
        );
        return;
      }

      // Store customer data in session
      userSessions.set(chatId, {
        searchValue,
        customerData,
        timestamp: Date.now()
      });

      // Delete loading message
      await this.bot.deleteMessage(chatId, loadingMsg.message_id);

      // Send greeting with customer name
      const customerName = customerData.customer.CUSTOMER_NAME || 'Valued Customer';
      await this.bot.sendMessage(
        chatId,
        `👋 Hello *${customerName}*!\n\nI found your account. What would you like to know?`,
        { parse_mode: 'Markdown' }
      );

      // Show main menu
      await this.showMainMenu(chatId);
    } catch (error) {
      logger.error('[Telegram Bot] Error fetching customer data:', error);
      await this.bot.editMessageText(
        '❌ An error occurred while fetching customer details. Please try again later.',
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }
  }

  /**
   * Fetch customer data (same as customer-details page)
   */
  async fetchCustomerData(searchValue) {
    try {
      // Try customer ID first
      let customerData = await reportsService.executeReport('customer_details_search', {
        searchValue
      });

      // If not found, try meter number
      if (!customerData || customerData.length === 0) {
        customerData = await reportsService.executeReport('customer_search_by_meter', {
          meterNumber: searchValue
        });
      }

      if (!customerData || customerData.length === 0) {
        return null;
      }

      const customer = customerData[0];
      const custId = customer.CUSTOMER_ID || customer.SA_ID;

      // Fetch all data (billing, recharge, etc.)
      const [billingData, rechargeHistory] = await Promise.all([
        reportsService.executeReport('customer_billing_details', {
          custId,
          startDate: null,
          endDate: null
        }),
        reportsService.executeReport('customer_recharge_history', { custId })
      ]);

      // Aggregate monthly billing
      const monthlyBilling = this.aggregateMonthlyBilling(billingData);

      // Calculate analytics
      const analytics = this.calculateAnalytics(billingData, rechargeHistory);

      return {
        customer,
        dailyBilling: billingData,
        monthlyBilling,
        rechargeHistory,
        analytics
      };
    } catch (error) {
      logger.error('[Telegram Bot] Error in fetchCustomerData:', error);
      throw error;
    }
  }

  /**
   * Show main menu options
   */
  async showMainMenu(chatId) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '👤 Customer Information', callback_data: 'menu_customer_info' }],
        [{ text: '📊 Billing History', callback_data: 'menu_billing_history' }],
        [{ text: '💳 Recharge History', callback_data: 'menu_recharge_history' }]
      ]
    };

    await this.bot.sendMessage(chatId, '📋 *Please select an option:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Handle callback queries (button presses)
   */
  async handleCallback(query) {
    const chatId = query.message.chat.id;
    const data = query.callback_data;

    // Get user session
    const session = userSessions.get(chatId);

    if (!session) {
      await this.bot.answerCallbackQuery(query.id, {
        text: 'Session expired. Please send your customer number again.',
        show_alert: true
      });
      return;
    }

    // Answer callback query
    await this.bot.answerCallbackQuery(query.id);

    // Handle different menu options
    if (data === 'menu_customer_info') {
      await this.sendCustomerInfo(chatId, session.customerData);
    } else if (data === 'menu_billing_history') {
      await this.showBillingHistoryMenu(chatId);
    } else if (data === 'menu_recharge_history') {
      await this.showRechargeHistoryMenu(chatId);
    } else if (data.startsWith('billing_')) {
      await this.sendBillingHistory(chatId, session.customerData, data);
    } else if (data.startsWith('recharge_')) {
      await this.sendRechargeHistory(chatId, session.customerData, data);
    } else if (data === 'back_to_main') {
      await this.showMainMenu(chatId);
    }
  }

  /**
   * Send customer information
   */
  async sendCustomerInfo(chatId, customerData) {
    const { customer, analytics } = customerData;

    const message = `
👤 *Customer Information*

📋 *Customer ID:* ${customer.CUSTOMER_ID || 'N/A'}
⚡ *Meter Number:* ${customer.METER_NO || 'N/A'}
📍 *NOCS:* ${customer.NOCS_NAME || 'N/A'}
📞 *Phone:* ${customer.PHONE_NO || 'N/A'}
🏠 *Address:* ${customer.ADDRESS || 'N/A'}

💰 *Current Balance:* ${this.formatCurrency(Math.abs(analytics.currentBalance))}
${analytics.currentBalance < 0 ? '🔴 *Status:* Due Amount' : analytics.currentBalance > 0 ? '🟢 *Status:* Credit' : '⚪ *Status:* Paid'}

📅 *Last Bill Date:* ${this.formatDate(customer.LAST_BILL_DATE)}
📊 *Meter Status:* ${customer.METER_STATUS || 'Unknown'}
    `.trim();

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    // Show back button
    const keyboard = {
      inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'back_to_main' }]]
    };

    await this.bot.sendMessage(chatId, '👆 Choose an action:', { reply_markup: keyboard });
  }

  /**
   * Show billing history menu
   */
  async showBillingHistoryMenu(chatId) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '📅 Last Month', callback_data: 'billing_last_month' }],
        [{ text: '📅 Last 6 Months', callback_data: 'billing_last_6_months' }],
        [{ text: '📅 Last 1 Year', callback_data: 'billing_last_year' }],
        [{ text: '📅 All Records', callback_data: 'billing_all' }],
        [{ text: '⬅️ Back to Menu', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, '📊 *Select Billing Period:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Send billing history
   */
  async sendBillingHistory(chatId, customerData, filterType) {
    const { customer, monthlyBilling } = customerData;

    // Filter monthly billing based on selection
    let filteredBilling = monthlyBilling;
    let periodText = 'All Time';

    if (filterType === 'billing_last_month') {
      filteredBilling = monthlyBilling.slice(-1);
      periodText = 'Last Month';
    } else if (filterType === 'billing_last_6_months') {
      filteredBilling = monthlyBilling.slice(-6);
      periodText = 'Last 6 Months';
    } else if (filterType === 'billing_last_year') {
      filteredBilling = monthlyBilling.slice(-12);
      periodText = 'Last 1 Year';
    }

    if (!filteredBilling || filteredBilling.length === 0) {
      await this.bot.sendMessage(chatId, '❌ No billing records found for this period.');
      return;
    }

    // Build message
    let message = `
📊 *Monthly Billing History (${periodText})*

👤 *Customer:* ${customer.CUSTOMER_NAME || 'N/A'}
📋 *Customer ID:* ${customer.CUSTOMER_ID || 'N/A'}
⚡ *Meter:* ${customer.METER_NO || 'N/A'}

───────────────────────
`.trim();

    filteredBilling.forEach((bill, index) => {
      message += `\n\n*${index + 1}. ${bill.MONTH_NAME} ${bill.YEAR}*\n`;
      message += `⚡ Consumption: *${this.formatNumber(bill.TOTAL_CONSUMPTION)} kWh*\n`;
      message += `💰 Total Charges: *${this.formatCurrency(bill.TOTAL_CHARGES)}*`;
    });

    // Calculate totals
    const totalConsumption = filteredBilling.reduce((sum, b) => sum + b.TOTAL_CONSUMPTION, 0);
    const totalCharges = filteredBilling.reduce((sum, b) => sum + b.TOTAL_CHARGES, 0);

    message += `\n\n───────────────────────`;
    message += `\n\n📊 *Period Total:*`;
    message += `\n⚡ Total Consumption: *${this.formatNumber(totalConsumption)} kWh*`;
    message += `\n💰 Total Charges: *${this.formatCurrency(totalCharges)}*`;

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    // Show back button
    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 Change Period', callback_data: 'menu_billing_history' }],
        [{ text: '⬅️ Back to Menu', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, '👆 Choose an action:', { reply_markup: keyboard });
  }

  /**
   * Show recharge history menu
   */
  async showRechargeHistoryMenu(chatId) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '💳 Last Recharge', callback_data: 'recharge_last' }],
        [{ text: '💳 Last 6 Months', callback_data: 'recharge_last_6_months' }],
        [{ text: '💳 Last 1 Year', callback_data: 'recharge_last_year' }],
        [{ text: '💳 All Records', callback_data: 'recharge_all' }],
        [{ text: '⬅️ Back to Menu', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, '💳 *Select Recharge Period:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  /**
   * Send recharge history
   */
  async sendRechargeHistory(chatId, customerData, filterType) {
    const { customer, rechargeHistory } = customerData;

    if (!rechargeHistory || rechargeHistory.length === 0) {
      await this.bot.sendMessage(chatId, '❌ No recharge records found.');
      return;
    }

    // Filter recharge history based on selection
    let filteredRecharge = rechargeHistory;
    let periodText = 'All Time';

    if (filterType === 'recharge_last') {
      filteredRecharge = rechargeHistory.slice(-1);
      periodText = 'Last Recharge';
    } else if (filterType === 'recharge_last_6_months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      filteredRecharge = rechargeHistory.filter(
        (r) => new Date(r.RECHARGE_DATE) >= sixMonthsAgo
      );
      periodText = 'Last 6 Months';
    } else if (filterType === 'recharge_last_year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filteredRecharge = rechargeHistory.filter((r) => new Date(r.RECHARGE_DATE) >= oneYearAgo);
      periodText = 'Last 1 Year';
    }

    if (filteredRecharge.length === 0) {
      await this.bot.sendMessage(chatId, '❌ No recharge records found for this period.');
      return;
    }

    // Build message
    let message = `
💳 *Recharge History (${periodText})*

👤 *Customer:* ${customer.CUSTOMER_NAME || 'N/A'}
📋 *Customer ID:* ${customer.CUSTOMER_ID || 'N/A'}
⚡ *Meter:* ${customer.METER_NO || 'N/A'}

───────────────────────
`.trim();

    filteredRecharge.forEach((recharge, index) => {
      message += `\n\n*${index + 1}. ${this.formatDate(recharge.RECHARGE_DATE)}*\n`;
      message += `💰 Recharge Amount: *${this.formatCurrency(recharge.RECHARGE_AMOUNT)}*\n`;
      message += `⚡ Energy Cost: *${this.formatCurrency(recharge.ENERGY_COST)}*`;
    });

    // Calculate total
    const totalRecharge = filteredRecharge.reduce((sum, r) => sum + parseFloat(r.RECHARGE_AMOUNT || 0), 0);

    message += `\n\n───────────────────────`;
    message += `\n\n💰 *Total Recharge: ${this.formatCurrency(totalRecharge)}*`;

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    // Show back button
    const keyboard = {
      inline_keyboard: [
        [{ text: '💳 Change Period', callback_data: 'menu_recharge_history' }],
        [{ text: '⬅️ Back to Menu', callback_data: 'back_to_main' }]
      ]
    };

    await this.bot.sendMessage(chatId, '👆 Choose an action:', { reply_markup: keyboard });
  }

  /**
   * Aggregate monthly billing from daily billing
   */
  aggregateMonthlyBilling(dailyData) {
    const monthlyMap = new Map();

    dailyData.forEach((record) => {
      const startDate = new Date(record.START_DT);
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          MONTH: monthKey,
          YEAR: startDate.getFullYear(),
          MONTH_NAME: startDate.toLocaleString('en-US', { month: 'long' }),
          TOTAL_CHARGES: 0,
          TOTAL_CONSUMPTION: 0,
          BILLING_DAYS: 0
        });
      }

      const monthData = monthlyMap.get(monthKey);
      monthData.TOTAL_CHARGES += parseFloat(record.DAILY_CHARGES || 0);
      monthData.TOTAL_CONSUMPTION += parseFloat(record.QUANTITY || 0);
      monthData.BILLING_DAYS += 1;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.MONTH.localeCompare(b.MONTH));
  }

  /**
   * Calculate analytics
   */
  calculateAnalytics(billingData, rechargeHistory) {
    const totalConsumption = billingData.reduce((sum, b) => sum + parseFloat(b.QUANTITY || 0), 0);
    const totalCharges = billingData.reduce((sum, b) => sum + parseFloat(b.DAILY_CHARGES || 0), 0);
    const totalRecharge = rechargeHistory.reduce(
      (sum, r) => sum + parseFloat(r.RECHARGE_AMOUNT || 0),
      0
    );

    const currentBalance = totalRecharge - totalCharges;

    return {
      totalConsumption,
      totalCharges,
      totalRecharge,
      currentBalance
    };
  }

  /**
   * Format number with thousand separators
   */
  formatNumber(value) {
    if (!value) return '0.00';
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format currency
   */
  formatCurrency(value) {
    return `৳ ${this.formatNumber(value)}`;
  }

  /**
   * Format date
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// Create singleton instance
const telegramBotService = new TelegramBotService();

module.exports = telegramBotService;

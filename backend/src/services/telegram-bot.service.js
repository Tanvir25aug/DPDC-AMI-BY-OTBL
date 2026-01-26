const TelegramBot = require('node-telegram-bot-api');
const reportsService = require('./reports.service');
const logger = require('../config/logger');

// User session storage (in production, use Redis or database)
const userSessions = new Map();

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isInitialized = false;
    this.lastPollingErrorLog = null; // Track last polling error log time
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

      // Create bot instance with polling configuration
      this.bot = new TelegramBot(token, {
        polling: {
          interval: 300,  // Check for updates every 300ms
          autoStart: true,
          params: {
            timeout: 10  // Long polling timeout in seconds
          }
        }
      });

      // Handle polling errors gracefully
      this.bot.on('polling_error', (error) => {
        // Don't flood logs with connection timeout errors
        if (error.code === 'EFATAL' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          // Log connection errors only once every 5 minutes
          const now = Date.now();
          if (!this.lastPollingErrorLog || now - this.lastPollingErrorLog > 300000) {
            logger.warn('[Telegram Bot] Polling connection issue (will retry automatically):', {
              code: error.code,
              message: error.message?.substring(0, 100)
            });
            this.lastPollingErrorLog = now;
          }
        } else {
          // Log other errors normally
          logger.error('[Telegram Bot] Polling error:', error);
        }
      });

      // Set up command handlers
      this.setupHandlers();

      this.isInitialized = true;
      logger.info('[Telegram Bot] Bot initialized successfully');
      logger.info('[Telegram Bot] Using polling mode - ensure Telegram servers are accessible');
    } catch (error) {
      logger.error('[Telegram Bot] Failed to initialize:', error);
    }
  }

  /**
   * Setup message and callback handlers
   */
  setupHandlers() {
    // Handle /start, /hello, /hi commands
    this.bot.onText(/\/(start|hello|hi)/i, async (msg) => {
      try {
        await this.handleGreeting(msg);
      } catch (error) {
        logger.error('[Telegram Bot] Error in greeting handler:', error);
      }
    });

    // Handle text messages (customer number or meter number)
    this.bot.on('message', async (msg) => {
      try {
        if (!msg.text || msg.text.startsWith('/')) return;
        await this.handleMessage(msg);
      } catch (error) {
        logger.error('[Telegram Bot] Error in message handler:', error);
      }
    });

    // Handle callback queries (button presses)
    this.bot.on('callback_query', async (query) => {
      try {
        await this.handleCallback(query);
      } catch (error) {
        logger.error('[Telegram Bot] Error in callback handler:', error);
      }
    });

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

    logger.info(`[Telegram Bot] Received message from chatId ${chatId}: "${searchValue}"`);

    // Check if it's a customer number or meter number
    if (!searchValue || searchValue.length < 5) {
      logger.warn(`[Telegram Bot] Invalid search value from chatId ${chatId}: too short`);
      await this.bot.sendMessage(
        chatId,
        '⚠️ Please provide a valid Customer Number or Meter Number (minimum 5 digits).'
      );
      return;
    }

    // Send loading message
    logger.info(`[Telegram Bot] Searching for customer: ${searchValue}`);
    const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Fetching customer details...');

    try {
      // Fetch customer data
      const customerData = await this.fetchCustomerData(searchValue);

      if (!customerData) {
        logger.warn(`[Telegram Bot] Customer not found for search: ${searchValue}`);
        await this.bot.editMessageText(
          '❌ Customer not found. Please check the Customer Number or Meter Number and try again.',
          { chat_id: chatId, message_id: loadingMsg.message_id }
        );
        return;
      }

      logger.info(`[Telegram Bot] Customer found: ${customerData.customer.CUSTOMER_NAME} (ID: ${customerData.customer.CUSTOMER_ID})`);

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

      logger.info(`[Telegram Bot] Showing main menu to chatId ${chatId}`);
      // Show main menu
      await this.showMainMenu(chatId);

      logger.info(`[Telegram Bot] Successfully processed request for chatId ${chatId}`);
    } catch (error) {
      logger.error('[Telegram Bot] Error fetching customer data:', error);
      try {
        await this.bot.editMessageText(
          '❌ An error occurred while fetching customer details. Please try again later.',
          { chat_id: chatId, message_id: loadingMsg.message_id }
        );
      } catch (editError) {
        logger.error('[Telegram Bot] Failed to edit error message:', editError);
        await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
      }
    }
  }

  /**
   * Fetch customer data (optimized - same fixes as customer-details page)
   */
  async fetchCustomerData(searchValue) {
    try {
      logger.info(`[Telegram Bot] fetchCustomerData starting for: ${searchValue}`);

      // Try customer ID first
      let customerData = await reportsService.executeReport('customer_details_search', {
        searchValue
      });

      logger.info(`[Telegram Bot] Customer ID search result: ${customerData?.length || 0} rows`);

      // If not found, try meter number lookup (quick lookup with customer name)
      if (!customerData || customerData.length === 0) {
        logger.info(`[Telegram Bot] Trying meter number lookup (lightweight)...`);

        // Use new lightweight meter lookup to get Customer ID and Name quickly
        const meterLookup = await reportsService.executeReport('meter_to_customer_lookup', {
          meterNumber: searchValue
        });

        logger.info(`[Telegram Bot] Meter lookup result: ${meterLookup?.length || 0} rows`);

        if (meterLookup && meterLookup.length > 0) {
          // Got Customer ID from meter, now fetch full details
          const custId = meterLookup[0].CUSTOMER_ID;
          logger.info(`[Telegram Bot] Found customer ${custId} (${meterLookup[0].CUSTOMER_NAME}) via meter lookup, fetching full details...`);

          customerData = await reportsService.executeReport('customer_details_search', {
            searchValue: custId
          });

          // Add customer name from meter lookup if not in customer data
          if (customerData && customerData.length > 0 && !customerData[0].CUSTOMER_NAME) {
            customerData[0].CUSTOMER_NAME = meterLookup[0].CUSTOMER_NAME;
          }
        } else {
          logger.info(`[Telegram Bot] Meter lookup failed, trying comprehensive meter search...`);
          customerData = await reportsService.executeReport('customer_search_by_meter', {
            meterNumber: searchValue
          });
          logger.info(`[Telegram Bot] Comprehensive meter search result: ${customerData?.length || 0} rows`);
        }
      }

      if (!customerData || customerData.length === 0) {
        logger.warn(`[Telegram Bot] No customer found for: ${searchValue}`);
        return null;
      }

      const customer = customerData[0];
      const custId = customer.CUSTOMER_ID || customer.SA_ID;
      const saId = customer.SA_ID; // Service Agreement ID for recharge history

      logger.info(`[Telegram Bot] Fetching billing and recharge data for custId: ${custId}, saId: ${saId}`);

      // Calculate date range - last 12 months for faster queries
      const now = new Date();
      const startDate = this.formatDateForOracle(new Date(now.getFullYear() - 1, now.getMonth(), 1));

      // Fetch all data in parallel with date limits for speed
      const [monthlyBillingData, rechargeHistory, balanceData] = await Promise.all([
        // Use SQL aggregation for accurate monthly data
        reportsService.executeReport('customer_monthly_billing', {
          custId,
          startDate,
          endDate: null
        }, { maxRows: 0 }),
        // Recharge history
        reportsService.executeReport('customer_recharge_history', { saId }, { maxRows: 0 }),
        // Real-time balance
        reportsService.executeReport('customer_realtime_balance', { saId })
      ]);

      logger.info(`[Telegram Bot] Fetched ${monthlyBillingData?.length || 0} monthly billing records and ${rechargeHistory?.length || 0} recharge records`);

      // Transform monthly billing data for compatibility
      const monthlyBilling = (monthlyBillingData || []).map(row => ({
        MONTH: row.MONTH_KEY,
        YEAR: row.YEAR,
        MONTH_NAME: row.MONTH_NAME ? row.MONTH_NAME.trim() : '',
        TOTAL_CHARGES: parseFloat(row.TOTAL_CHARGES || 0),
        TOTAL_CONSUMPTION: parseFloat(row.TOTAL_CONSUMPTION || 0),
        BILLING_DAYS: parseInt(row.BILLING_DAYS || 0),
        START_DATE: row.MONTH_START_DATE,
        END_DATE: row.MONTH_END_DATE,
        PAYOFF_BAL: parseFloat(row.LATEST_PAYOFF_BAL || 0)
      }));

      // Get meter number from monthly billing or customer data
      if (monthlyBillingData && monthlyBillingData.length > 0 && monthlyBillingData[0].MSN) {
        customer.METER_NO = monthlyBillingData[0].MSN;
        logger.info(`[Telegram Bot] Meter number found: ${customer.METER_NO}`);
      } else if (!customer.METER_NO) {
        logger.warn(`[Telegram Bot] No meter number found`);
      }

      // Calculate real-time balance
      let currentBalance = 0;
      if (balanceData && balanceData.length > 0) {
        // Negate because positive TOT_AMT means customer owes money (due)
        currentBalance = Math.round(parseFloat(balanceData[0].CURRENT_BALANCE || 0) * -1 * 100) / 100;
      }

      // Calculate analytics with real-time balance
      const analytics = this.calculateAnalyticsFromMonthly(monthlyBilling, rechargeHistory || [], currentBalance);

      logger.info(`[Telegram Bot] Data processing completed. Monthly records: ${monthlyBilling?.length || 0}, Balance: ${currentBalance}`);

      return {
        customer,
        monthlyBilling: monthlyBilling || [],
        rechargeHistory: rechargeHistory || [],
        analytics
      };
    } catch (error) {
      logger.error('[Telegram Bot] Error in fetchCustomerData:', error);
      throw error;
    }
  }

  /**
   * Format date for Oracle (DD-MON-YYYY)
   */
  formatDateForOracle(date) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

    logger.info(`[Telegram Bot] Sending main menu to chatId ${chatId} with keyboard:`, JSON.stringify(keyboard));

    await this.bot.sendMessage(chatId, '📋 *Please select an option:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    logger.info(`[Telegram Bot] Main menu sent successfully to chatId ${chatId}`);
  }

  /**
   * Handle callback queries (button presses)
   */
  async handleCallback(query) {
    try {
      // Debug: Log entire query object structure
      logger.info(`[Telegram Bot] Raw callback query received:`, {
        id: query.id,
        from: query.from?.id,
        message_id: query.message?.message_id,
        chat_id: query.message?.chat?.id,
        data: query.data,
        callback_data: query.callback_data,
        query_keys: Object.keys(query)
      });

      const chatId = query.message.chat.id;
      const data = query.data || query.callback_data; // Try both fields

      logger.info(`[Telegram Bot] Callback received from chatId ${chatId}, data: "${data || 'undefined'}"`);

      // Check if callback data exists
      if (!data) {
        logger.warn('[Telegram Bot] Received callback query without data - likely from old message');
        logger.warn('[Telegram Bot] Full query object:', JSON.stringify(query, null, 2));

        await this.bot.answerCallbackQuery(query.id, {
          text: '⚠️ This button has expired. Please send your customer number again to get fresh data.',
          show_alert: true
        });

        // Send help message
        await this.bot.sendMessage(
          chatId,
          '📋 Please send your *Customer Number* or *Meter Number* to continue.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Get user session
      const session = userSessions.get(chatId);

      if (!session) {
        logger.warn(`[Telegram Bot] Session expired for chatId ${chatId}`);
        await this.bot.answerCallbackQuery(query.id, {
          text: '⏱️ Session expired. Please send your customer number again.',
          show_alert: true
        });

        // Send help message
        await this.bot.sendMessage(
          chatId,
          '📋 Please send your *Customer Number* or *Meter Number* to get started.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Answer callback query
      await this.bot.answerCallbackQuery(query.id);

      logger.info(`[Telegram Bot] Processing callback action: ${data}`);

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
      } else {
        logger.warn(`[Telegram Bot] Unknown callback data: ${data}`);
        await this.bot.sendMessage(chatId, '❌ Unknown action. Please try again.');
      }

      logger.info(`[Telegram Bot] Callback action ${data} completed successfully`);
    } catch (error) {
      logger.error('[Telegram Bot] Error in handleCallback:', error);
      await this.bot.sendMessage(query.message.chat.id, '❌ An error occurred. Please try again.');
    }
  }

  /**
   * Send customer information
   */
  async sendCustomerInfo(chatId, customerData) {
    if (!customerData || !customerData.customer || !customerData.analytics) {
      await this.bot.sendMessage(chatId, '❌ Unable to retrieve customer information. Please try again.');
      return;
    }

    const { customer, analytics } = customerData;

    const message = `
👤 *Customer Information*

📋 *Customer ID:* ${customer.CUSTOMER_ID || 'N/A'}
⚡ *Meter Number:* ${customer.METER_NO || 'N/A'}
👤 *Customer Name:* ${customer.CUSTOMER_NAME || 'N/A'}
📍 *NOCS:* ${customer.NOCS_NAME || 'N/A'}
📞 *Phone:* ${customer.PHONE_NO || 'N/A'}
🏠 *Address:* ${customer.ADDRESS || 'N/A'}

💰 *Current Balance:* ${this.formatCurrency(Math.abs(analytics.currentBalance))}
${analytics.currentBalance < 0 ? '🔴 *Status:* Due Amount' : analytics.currentBalance > 0 ? '🟢 *Status:* Credit' : '⚪ *Status:* Paid'}

📅 *Last Bill Date:* ${this.formatDate(customer.LAST_BILL_DATE)}
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
    if (!customerData || !customerData.customer || !customerData.monthlyBilling) {
      await this.bot.sendMessage(chatId, '❌ Unable to retrieve billing history. Please try again.');
      return;
    }

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

📋 *Customer ID:* ${customer.CUSTOMER_ID || 'N/A'}
⚡ *Meter:* ${customer.METER_NO || 'N/A'}
👤 *Customer Name:* ${customer.CUSTOMER_NAME || 'N/A'}

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
    if (!customerData || !customerData.customer || !customerData.rechargeHistory) {
      await this.bot.sendMessage(chatId, '❌ Unable to retrieve recharge history. Please try again.');
      return;
    }

    const { customer, rechargeHistory } = customerData;

    if (!rechargeHistory || rechargeHistory.length === 0) {
      await this.bot.sendMessage(chatId, '❌ No recharge records found.');
      return;
    }

    // IMPORTANT: Sort recharge history by date DESCENDING (newest first)
    const sortedRechargeHistory = [...rechargeHistory].sort((a, b) => {
      return new Date(b.RECHARGE_DATE) - new Date(a.RECHARGE_DATE);
    });

    logger.info(`[Telegram Bot] Recharge history sorted. First: ${sortedRechargeHistory[0]?.RECHARGE_DATE}, Last: ${sortedRechargeHistory[sortedRechargeHistory.length - 1]?.RECHARGE_DATE}`);

    // Filter recharge history based on selection
    let filteredRecharge = sortedRechargeHistory;
    let periodText = 'All Time';

    if (filterType === 'recharge_last') {
      // Get the first record (most recent after sorting)
      filteredRecharge = [sortedRechargeHistory[0]];
      periodText = 'Last Recharge';
    } else if (filterType === 'recharge_last_6_months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      filteredRecharge = sortedRechargeHistory.filter(
        (r) => new Date(r.RECHARGE_DATE) >= sixMonthsAgo
      );
      periodText = 'Last 6 Months';
    } else if (filterType === 'recharge_last_year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filteredRecharge = sortedRechargeHistory.filter((r) => new Date(r.RECHARGE_DATE) >= oneYearAgo);
      periodText = 'Last 1 Year';
    }

    if (filteredRecharge.length === 0) {
      await this.bot.sendMessage(chatId, '❌ No recharge records found for this period.');
      return;
    }

    // Build message
    let message = `
💳 *Recharge History (${periodText})*

📋 *Customer ID:* ${customer.CUSTOMER_ID || 'N/A'}
⚡ *Meter:* ${customer.METER_NO || 'N/A'}
👤 *Customer Name:* ${customer.CUSTOMER_NAME || 'N/A'}

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
   * Calculate analytics from monthly billing data (optimized)
   * Uses pre-aggregated monthly data from SQL query
   */
  calculateAnalyticsFromMonthly(monthlyBilling, rechargeHistory, currentBalance) {
    const totalConsumption = monthlyBilling.reduce((sum, b) => sum + (b.TOTAL_CONSUMPTION || 0), 0);
    const totalCharges = monthlyBilling.reduce((sum, b) => sum + (b.TOTAL_CHARGES || 0), 0);
    const totalRecharge = rechargeHistory.reduce(
      (sum, r) => sum + parseFloat(r.RECHARGE_AMOUNT || 0),
      0
    );

    logger.info(`[Telegram Bot] Analytics: consumption=${totalConsumption}, charges=${totalCharges}, balance=${currentBalance}`);

    return {
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      totalCharges: Math.round(totalCharges * 100) / 100,
      totalRecharge: Math.round(totalRecharge * 100) / 100,
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

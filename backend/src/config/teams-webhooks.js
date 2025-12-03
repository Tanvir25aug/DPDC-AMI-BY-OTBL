/**
 * Microsoft Teams Webhook Configuration
 *
 * Maps report types to Teams webhook URLs
 */

module.exports = {
  // Main webhook for all reports
  DEFAULT: 'https://oculintech.webhook.office.com/webhookb2/b9c509e0-902c-461b-8fff-b569361bc576@0e2b73fd-9cf7-47a6-b73d-e64e03b9ac84/IncomingWebhook/0977cff90e98495db18b623108d40277/2ff1950a-8a58-4de9-837e-15368efe3001/V2RV-wLdgXzgWB4NnqYKWBY6hws1Od18QLculVM8ds9Fk1',

  // Batch Monitoring Reports (every 30 minutes)
  BATCH_MONITORING: 'https://oculintech.webhook.office.com/webhookb2/b9c509e0-902c-461b-8fff-b569361bc576@0e2b73fd-9cf7-47a6-b73d-e64e03b9ac84/IncomingWebhook/0977cff90e98495db18b623108d40277/2ff1950a-8a58-4de9-837e-15368efe3001/V2RV-wLdgXzgWB4NnqYKWBY6hws1Od18QLculVM8ds9Fk1',

  // Critical Alerts (stuck batches, performance issues)
  ALERTS: 'https://oculintech.webhook.office.com/webhookb2/b9c509e0-902c-461b-8fff-b569361bc576@0e2b73fd-9cf7-47a6-b73d-e64e03b9ac84/IncomingWebhook/0977cff90e98495db18b623108d40277/2ff1950a-8a58-4de9-837e-15368efe3001/V2RV-wLdgXzgWB4NnqYKWBY6hws1Od18QLculVM8ds9Fk1',

  // You can add more webhooks for different channels
  // RC_DC_DASHBOARD: 'https://...',
  // NOCS_BREAKDOWN: 'https://...',
  // NOCS_BALANCE: 'https://...',
};

/**
 * Simple Teams Webhook Test
 * Tests if the Teams webhook is working by sending a simple text message
 */

const axios = require('axios');
const teamsWebhooks = require('./src/config/teams-webhooks');

async function testTeamsWebhook() {
  console.log('========================================');
  console.log('Testing Microsoft Teams Webhook');
  console.log('========================================');
  console.log('Webhook URL:', teamsWebhooks.DEFAULT);
  console.log('');

  try {
    // Test 1: Simple text message
    console.log('Test 1: Sending simple text message...');
    const textPayload = {
      text: '✅ **TEAMS CONNECTION TEST**\n\nIf you see this message, your Teams webhook is working correctly!\n\nTime: ' + new Date().toLocaleString()
    };

    const response1 = await axios.post(teamsWebhooks.DEFAULT, textPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Simple text message sent successfully!');
    console.log('Response:', response1.status, response1.statusText);
    console.log('');

    // Test 2: Simple Adaptive Card
    console.log('Test 2: Sending simple Adaptive Card...');
    const cardPayload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'Container',
                style: 'emphasis',
                items: [
                  {
                    type: 'TextBlock',
                    text: '🎉 TEAMS ADAPTIVE CARD TEST',
                    size: 'Large',
                    weight: 'Bolder',
                    color: 'Accent',
                    horizontalAlignment: 'Center'
                  }
                ]
              },
              {
                type: 'Container',
                separator: true,
                spacing: 'Medium',
                items: [
                  {
                    type: 'TextBlock',
                    text: 'Connection Details',
                    weight: 'Bolder',
                    size: 'Medium'
                  },
                  {
                    type: 'FactSet',
                    facts: [
                      { title: 'Status:', value: '✅ Connected' },
                      { title: 'Time:', value: new Date().toLocaleString() },
                      { title: 'System:', value: 'DPDC AMI Monitoring' }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    };

    const response2 = await axios.post(teamsWebhooks.DEFAULT, cardPayload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Adaptive Card sent successfully!');
    console.log('Response:', response2.status, response2.statusText);
    console.log('');
    console.log('========================================');
    console.log('✅ ALL TESTS PASSED');
    console.log('Check your Teams channel for 2 messages:');
    console.log('1. Simple text message');
    console.log('2. Adaptive Card');
    console.log('========================================');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ TEST FAILED');
    console.error('========================================');
    console.error('Error:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }

    console.error('');
    console.error('Possible issues:');
    console.error('1. Webhook URL might be expired or invalid');
    console.error('2. Teams channel might have been deleted');
    console.error('3. Webhook might have been removed from the channel');
    console.error('4. Network/firewall issues');
    console.error('');
    console.error('To fix:');
    console.error('1. Go to your Teams channel');
    console.error('2. Click the "..." menu → Workflows');
    console.error('3. Create a new "Post to a channel when a webhook request is received" workflow');
    console.error('4. Copy the new webhook URL');
    console.error('5. Update backend/src/config/teams-webhooks.js with the new URL');
    console.error('========================================');
  }
}

testTeamsWebhook();

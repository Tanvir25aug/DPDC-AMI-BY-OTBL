/**
 * Helper Script to Get WhatsApp Group IDs
 *
 * Run this script after WhatsApp is authenticated to get all group IDs
 *
 * Usage:
 *   node GET_WHATSAPP_GROUP_IDS.js
 *
 * This will display all WhatsApp groups with their IDs
 * Copy the IDs and update src/config/nocs-whatsapp-groups.js
 */

const whatsappService = require('./src/services/whatsapp.service');
const logger = require('./src/config/logger');

async function getGroupIds() {
  try {
    console.log('========================================');
    console.log('WhatsApp Group ID Finder');
    console.log('========================================\n');

    console.log('Initializing WhatsApp service...');
    await whatsappService.initialize();

    // Wait a bit for client to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    const status = whatsappService.getConnectionStatus();
    if (!status.ready) {
      console.log('\n❌ WhatsApp is not ready yet.');
      console.log('Please wait for QR code scan and authentication to complete.');
      console.log('Then run this script again.\n');
      process.exit(1);
    }

    console.log('✅ WhatsApp is ready!\n');
    console.log('Fetching all WhatsApp groups...\n');

    const groups = await whatsappService.getAllGroups();

    if (groups.length === 0) {
      console.log('❌ No groups found.');
      console.log('Make sure the WhatsApp account is a member of the required groups.\n');
      process.exit(1);
    }

    console.log(`Found ${groups.length} WhatsApp groups:\n`);
    console.log('========================================');

    groups.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.name}`);
      console.log(`   Group ID: ${group.id}`);
      console.log(`   Participants: ${group.participantCount}`);
      console.log('   ---');
    });

    console.log('\n========================================');
    console.log('Copy & Paste Configuration:');
    console.log('========================================\n');
    console.log('// Add this to src/config/nocs-whatsapp-groups.js:\n');
    console.log('module.exports = {');

    groups.forEach((group) => {
      // Try to extract NOCS name from group name
      const groupName = group.name.replace(/[^a-zA-Z0-9-]/g, '_').substring(0, 30);
      console.log(`  '${groupName}': '${group.id}',`);
    });

    console.log(`  'DEFAULT': '${groups[0].id}' // Fallback to first group`);
    console.log('};\n');

    console.log('========================================');
    console.log('✅ Complete!');
    console.log('========================================\n');

    await whatsappService.stop();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Error getting group IDs:', error);
    process.exit(1);
  }
}

// Run the script
getGroupIds();

/* ======================================================
   Auto-Delete Events Scheduled Task
   Purpose: Automatically delete events with no participants
            the day before the event date
   ====================================================== */

const AdminEventModel = require("../Models/Admin_event_Model");

async function runAutoDelete() {
  try {
    console.log(`[${new Date().toISOString()}] Running auto-delete task for events with no participants...`);
    
    const deletedEvents = await AdminEventModel.autoDeleteEventsWithNoParticipants();
    
    if (deletedEvents.length > 0) {
      console.log(`[${new Date().toISOString()}] Deleted ${deletedEvents.length} event(s) with no participants:`);
      deletedEvents.forEach(event => {
        console.log(`  - Event ID ${event.eventid}: ${event.eventname} (Date: ${event.eventdate})`);
      });
    } else {
      console.log(`[${new Date().toISOString()}] No events to delete.`);
    }

    return deletedEvents;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in auto-delete task:`, error);
    throw error;
  }
}

// Export for use in cron job or scheduled task runner
module.exports = { runAutoDelete };

// If run directly (for testing), execute immediately
if (require.main === module) {
  runAutoDelete()
    .then(() => {
      console.log("Auto-delete task completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Auto-delete task failed:", error);
      process.exit(1);
    });
}


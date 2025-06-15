// In-memory user-based automation queues
// Each user can only run one automation at a time
const userQueues = new Map(); // userId -> { running: automationId, pending: [automationIds] }

class UserQueueService {
  // Add automation to user's queue
  static addToQueue(userId, automationId) {
    if (!userQueues.has(userId)) {
      userQueues.set(userId, { running: null, pending: [] });
    }
    
    const queue = userQueues.get(userId);
    
    // If nothing is running, start immediately
    if (!queue.running) {
      queue.running = automationId;
      console.log(`[Queue] Started automation ${automationId} for user ${userId}`);
      return { position: 0, started: true };
    } else {
      // Add to pending queue
      queue.pending.push(automationId);
      console.log(`[Queue] Added automation ${automationId} to queue for user ${userId}, position: ${queue.pending.length}`);
      return { position: queue.pending.length, started: false };
    }
  }

  // Complete automation and start next in queue
  static completeAutomation(userId, automationId) {
    const queue = userQueues.get(userId);
    if (!queue) return;

    // If this was the running automation
    if (queue.running === automationId) {
      queue.running = null;
      console.log(`[Queue] Completed automation ${automationId} for user ${userId}`);

      // Start next automation if any pending
      if (queue.pending.length > 0) {
        const nextAutomationId = queue.pending.shift();
        queue.running = nextAutomationId;
        console.log(`[Queue] Started next automation ${nextAutomationId} for user ${userId}`);
        return nextAutomationId;
      }
    } else {
      // Remove from pending queue if it was there
      const index = queue.pending.indexOf(automationId);
      if (index > -1) {
        queue.pending.splice(index, 1);
        console.log(`[Queue] Removed automation ${automationId} from pending queue for user ${userId}`);
      }
    }
    
    return null;
  }

  // Get user's queue status
  static getQueueStatus(userId) {
    const queue = userQueues.get(userId);
    if (!queue) {
      return { running: null, pending: [], total: 0 };
    }

    return {
      running: queue.running,
      pending: [...queue.pending],
      total: (queue.running ? 1 : 0) + queue.pending.length
    };
  }

  // Remove automation from queue (cancel)
  static removeFromQueue(userId, automationId) {
    const queue = userQueues.get(userId);
    if (!queue) return false;

    // If it's the running automation, we can't cancel it here
    if (queue.running === automationId) {
      console.log(`[Queue] Cannot cancel running automation ${automationId} for user ${userId}`);
      return false;
    }

    // Remove from pending queue
    const index = queue.pending.indexOf(automationId);
    if (index > -1) {
      queue.pending.splice(index, 1);
      console.log(`[Queue] Cancelled automation ${automationId} for user ${userId}`);
      return true;
    }

    return false;
  }

  // Get all queue statuses (for admin)
  static getAllQueues() {
    const result = {};
    for (const [userId, queue] of userQueues) {
      result[userId] = {
        running: queue.running,
        pending: [...queue.pending],
        total: (queue.running ? 1 : 0) + queue.pending.length
      };
    }
    return result;
  }

  // Clear user's queue (for admin)
  static clearUserQueue(userId) {
    if (userQueues.has(userId)) {
      userQueues.delete(userId);
      console.log(`[Queue] Cleared queue for user ${userId}`);
      return true;
    }
    return false;
  }
}

module.exports = UserQueueService; 
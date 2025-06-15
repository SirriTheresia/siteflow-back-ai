const { machineIdSync } = require('node-machine-id');

// Simple allowed versions list (edit this array to control access)
const ALLOWED_VERSIONS = ['1.0.0'];

const simpleAuth = async (req, res, next) => {
  try {
    // Check version
    const version = req.headers['app-version'];
    if (!version || !ALLOWED_VERSIONS.includes(version)) {
      return res.status(403).json({ error: 'Update required' });
    }

    // If user is authenticated, check device and subscription
    if (req.user) {
      const currentDevice = machineIdSync();

      // Check if user is on their registered device
      if (req.user.currentDeviceId !== currentDevice) {
        return res.status(403).json({ error: 'You can only access your account from the device you registered on.' });
      }

      // Check if subscription is active (if user has workspace)
      if (req.user.workspace && !req.user.workspace.subscriptionActive) {
        return res.status(403).json({ error: 'Subscription required' });
      }
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { simpleAuth, ALLOWED_VERSIONS }; 
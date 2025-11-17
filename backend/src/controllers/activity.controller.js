const { UserActivity, LoginHistory, UserSession, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get user activities
 */
exports.getUserActivities = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 50, offset = 0, type = null } = req.query;

    const whereClause = { user_id: userId };

    if (type) {
      whereClause.activity_type = type;
    }

    const activities = await UserActivity.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await UserActivity.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activities'
    });
  }
};

/**
 * Get user login history
 */
exports.getUserLoginHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const loginHistory = await LoginHistory.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await LoginHistory.count({ where: { user_id: userId } });

    res.json({
      success: true,
      data: {
        loginHistory,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching login history'
    });
  }
};

/**
 * Get user active sessions
 */
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await UserSession.findAll({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: {
          [Op.gt]: new Date()
        }
      },
      order: [['last_activity', 'DESC']],
      attributes: {
        exclude: ['session_token'] // Don't send token to client
      }
    });

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user sessions'
    });
  }
};

/**
 * Revoke a user session
 */
exports.revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.sessionId;

    const session = await UserSession.findOne({
      where: {
        id: sessionId,
        user_id: userId
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.revoke();

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking session'
    });
  }
};

/**
 * Get user activity statistics
 */
exports.getActivityStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Get activity counts by type
    const activities = await UserActivity.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        'activity_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['activity_type']
    });

    // Get login count
    const loginCount = await LoginHistory.count({
      where: {
        user_id: userId,
        status: 'success',
        created_at: {
          [Op.gte]: startDate
        }
      }
    });

    // Get query execution count
    const queryCount = activities.find(a => a.activity_type === 'query_executed')?.get('count') || 0;

    // Get report generation count
    const reportCount = activities.find(a => a.activity_type === 'report_generated')?.get('count') || 0;

    // Get data export count
    const exportCount = activities.find(a => a.activity_type === 'data_exported')?.get('count') || 0;

    res.json({
      success: true,
      data: {
        period,
        stats: {
          logins: loginCount,
          queries: queryCount,
          reports: reportCount,
          exports: exportCount
        },
        activityBreakdown: activities.map(a => ({
          type: a.activity_type,
          count: parseInt(a.get('count'))
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics'
    });
  }
};

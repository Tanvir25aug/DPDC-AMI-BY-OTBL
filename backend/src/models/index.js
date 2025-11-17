const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const QueryLog = require('./QueryLog');
const LoginHistory = require('./LoginHistory');
const UserSession = require('./UserSession');
const UserActivity = require('./UserActivity');

// Define associations
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});

QueryLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(QueryLog, {
  foreignKey: 'user_id',
  as: 'query_logs'
});

// LoginHistory associations
LoginHistory.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(LoginHistory, {
  foreignKey: 'user_id',
  as: 'login_history'
});

// UserSession associations
UserSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(UserSession, {
  foreignKey: 'user_id',
  as: 'sessions'
});

// UserActivity associations
UserActivity.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(UserActivity, {
  foreignKey: 'user_id',
  as: 'activities'
});

module.exports = {
  sequelize,
  User,
  Role,
  QueryLog,
  LoginHistory,
  UserSession,
  UserActivity
};

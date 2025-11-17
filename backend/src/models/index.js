const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const QueryLog = require('./QueryLog');

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

module.exports = {
  sequelize,
  User,
  Role,
  QueryLog
};

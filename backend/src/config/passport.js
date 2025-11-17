require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { User, Role } = require('../models');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find user by ID from JWT payload
      const user = await User.findByPk(payload.id, {
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'permissions']
        }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return done(null, false);
      }

      // Check if user is active
      if (!user.is_active) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = passport;

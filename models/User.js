const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, username = null }) {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert the user
      const [result] = await db.query(
        'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
        [email, hashedPassword, username]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async verifyPassword(inputPassword, hashedPassword) {
    try {
      console.log('Verifying password...');
      console.log('Input password:', inputPassword);
      console.log('Stored hash:', hashedPassword);
      const result = await bcrypt.compare(inputPassword, hashedPassword);
      console.log('Password verification result:', result);
      return result;
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  static async createSession(userId, token, expiresAt) {
    try {
      const [result] = await db.execute(
        'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async findSession(token) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()',
        [token]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async createPasswordReset(userId, otp, expiresAt) {
    try {
      const [result] = await db.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, otp, expiresAt]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating password reset:', error);
      throw error;
    }
  }

  static async findPasswordReset(otp) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
        [otp]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding password reset:', error);
      throw error;
    }
  }

  static async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  static async deletePasswordReset(otp) {
    try {
      await db.query('DELETE FROM password_resets WHERE token = ?', [otp]);
    } catch (error) {
      console.error('Error deleting password reset:', error);
      throw error;
    }
  }
}

module.exports = User; 
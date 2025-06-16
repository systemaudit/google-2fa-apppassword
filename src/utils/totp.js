const speakeasy = require('speakeasy');
const axios = require('axios');
const config = require('../config/settings');

class TOTPGenerator {
  async generateFromAPI(secret) {
    try {
      const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
      const response = await axios.get(`${config.totp.apiUrl}/${cleanSecret}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.token) {
        return response.data.token;
      }
      
      throw new Error('Invalid API response');
    } catch (error) {
      return this.generateLocal(secret);
    }
  }

  generateLocal(secret) {
    try {
      const cleanSecret = secret.replace(/\s/g, '');
      const token = speakeasy.totp({
        secret: cleanSecret,
        encoding: 'base32'
      });
      
      return token;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new TOTPGenerator();

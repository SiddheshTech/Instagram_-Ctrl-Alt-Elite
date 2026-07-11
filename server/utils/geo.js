const https = require('https');

const fetchJson = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const getIPLocation = async (ip) => {
  try {
    let cleanIp = ip || '';
    if (cleanIp.includes('::ffff:')) {
      cleanIp = cleanIp.replace('::ffff:', '');
    }
    
    // Check if localhost or private IP
    if (
      cleanIp === '127.0.0.1' || 
      cleanIp === '::1' || 
      cleanIp === '' || 
      cleanIp.startsWith('192.168.') || 
      cleanIp.startsWith('10.')
    ) {
      // Query server's own public IP to give a realistic location during local development
      const ipInfo = await fetchJson('https://api.ipify.org?format=json');
      cleanIp = ipInfo ? ipInfo.ip : '8.8.8.8';
    }

    const geo = await fetchJson(`https://ipapi.co/${cleanIp}/json/`);
    if (geo && geo.city && geo.region && geo.country_name) {
      return `${geo.city}, ${geo.region}, ${geo.country_name}`;
    }
    
    return 'San Francisco, CA, USA'; // Default fallback
  } catch (error) {
    console.error('GeoIP lookup failed:', error.message);
    return 'San Francisco, CA, USA';
  }
};

const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return 'Windows'; // Default fallback
  
  if (userAgentString.includes('Windows')) {
    return 'Windows';
  } else if (userAgentString.includes('Macintosh') || userAgentString.includes('Mac OS X')) {
    return 'Mac OS X';
  } else if (userAgentString.includes('iPhone')) {
    return 'iPhone';
  } else if (userAgentString.includes('iPad')) {
    return 'iPad';
  } else if (userAgentString.includes('Android')) {
    return 'Android';
  } else if (userAgentString.includes('Linux')) {
    return 'Linux';
  }
  
  return 'Web Browser';
};

module.exports = {
  getIPLocation,
  parseUserAgent,
};

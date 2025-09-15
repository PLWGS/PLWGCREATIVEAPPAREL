const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const FORCE_HTTPS = process.env.FORCE_HTTPS === 'true';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Force HTTPS redirect in production
  if (FORCE_HTTPS && req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, {
      'Location': `https://${req.headers.host}${req.url}`,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Remove leading slash for file system path
  const filePath = path.join(__dirname, pathname);
  
  // Get file extension
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1><p>The requested file was not found on this server.</p>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Internal Server Error</h1><p>Something went wrong on the server.</p>');
      }
      return;
    }
    
    // Add security headers
    res.writeHead(200, { 
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔒 HTTPS redirect: ${FORCE_HTTPS ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🎨 CSS watching enabled. Run 'npm run watch:css' in another terminal for live CSS updates.`);
  console.log(`\n📋 Available pages:`);
  console.log(`   • Homepage: http://localhost:${PORT}/`);
  console.log(`   • Admin Dashboard: http://localhost:${PORT}/pages/admin.html`);
  console.log(`   • Customer Account: http://localhost:${PORT}/pages/account.html`);
  console.log(`   • Custom Orders: http://localhost:${PORT}/pages/custom.html`);
  console.log(`   • Shop: http://localhost:${PORT}/pages/shop.html`);
  console.log(`   • Cart: http://localhost:${PORT}/pages/cart.html`);
  console.log(`\n💡 Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
}); 
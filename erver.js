[33mcommit c32efb6bfe1042fce16a73561bc3b3c6f119ab6e[m[33m ([m[1;31morigin/fix-smtp-config[m[33m)[m
Author: google-labs-jules[bot] <161369871+google-labs-jules[bot]@users.noreply.github.com>
Date:   Tue Aug 26 02:17:09 2025 +0000

    Fix: Improve SMTP configuration robustness
    
    This change makes the nodemailer transport configuration more resilient to common misconfigurations.
    
    - The `secure` option is now automatically set to `true` when `SMTP_PORT` is 465, which is the standard for SSL/TLS connections. For other ports, it continues to respect the `SMTP_SECURE` environment variable.
    - Adds connection, greeting, and socket timeouts (10 seconds) to the transporter to prevent the application from hanging due to SMTP connection issues, which was a factor in the recent server instability.
    
    This addresses the 2FA email delivery failure and improves overall server stability when dealing with email services.

[1mdiff --git a/server.js b/server.js[m
[1mindex 9191d88..75f6185 100644[m
[1m--- a/server.js[m
[1m+++ b/server.js[m
[36m@@ -96,14 +96,23 @@[m [mif (process.env.DATABASE_URL) {[m
 }[m
 [m
 // Email transporter[m
[32m+[m[32m// Smarter config: if port is 465, secure is always true.[m
[32m+[m[32m// Otherwise, respect the environment variable. This prevents common misconfigurations.[m
[32m+[m[32mconst smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);[m
[32m+[m[32mconst smtpSecure = process.env.SMTP_SECURE === 'true';[m
[32m+[m
 const transporter = nodemailer.createTransport({[m
   host: process.env.SMTP_HOST,[m
[31m-  port: process.env.SMTP_PORT,[m
[31m-  secure: process.env.SMTP_SECURE === 'true',[m
[32m+[m[32m  port: smtpPort,[m
[32m+[m[32m  secure: smtpPort === 465 ? true : smtpSecure,[m
   auth: {[m
     user: process.env.SMTP_USER,[m
     pass: process.env.SMTP_PASSWORD[m
[31m-  }[m
[32m+[m[32m  },[m
[32m+[m[32m  // Add a timeout to prevent long waits on connection issues[m
[32m+[m[32m  connectionTimeout: 10000, // 10 seconds[m
[32m+[m[32m  greetingTimeout: 10000, // 10 seconds[m
[32m+[m[32m  socketTimeout: 10000, // 10 seconds[m
 });[m
 [m
 // Helper function to check database availability[m

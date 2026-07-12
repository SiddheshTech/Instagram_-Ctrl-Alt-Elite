const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace single-quoted exact matches first
content = content.replace(/'shrushtiganacharya'/g, `(authUser?.username || 'user')`);
content = content.replace(/'shrushti'/g, `(authUser?.username || 'user')`);

// Replace @ references
content = content.replace(/@shrushti(?!ganacharya)/g, `@{authUser?.username || 'user'}`);
content = content.replace(/@shrushtiganacharya/g, `@{authUser?.username || 'user'}`);

// Replace fallback profile images
content = content.replace(/https:\/\/i\.pravatar\.cc\/150\?u=shrushti/g, `https://i.pravatar.cc/150?u=default`);

// Replace any leftover plain text occurrences (e.g. in text strings)
content = content.replace(/shrushtiganacharya/gi, `{authUser?.username || 'user'}`);
content = content.replace(/shrushti/gi, `{authUser?.username || 'user'}`);

// Wait, the above might break some literal string concatenations. 
// Actually, doing this via script is risky for JSX vs JS context. Let's be very specific:

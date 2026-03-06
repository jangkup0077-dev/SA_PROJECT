const http = require('http');

const data = JSON.stringify({
    name: 'testuser',
    email: 'test@example.com',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Status code:', res.statusCode);
        console.log('Response body:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error sending request:', error);
});

req.write(data);
req.end();

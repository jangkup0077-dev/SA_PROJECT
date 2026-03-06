async function test() {
    try {
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Logged in successfully, token:', token.substring(0, 15) + '...');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const candidatesRes = await fetch('http://localhost:3000/api/swipe/candidates', { headers });
        const candidates = await candidatesRes.json();
        console.log('Got candidates:', candidates.length);

        if (candidates.length === 0) {
            console.log('No candidates to swipe!');
            return;
        }

        const firstCandidate = candidates[0];
        console.log('Testing swipe for:', firstCandidate.user_id, firstCandidate.display_name);

        const swipeRes = await fetch('http://localhost:3000/api/swipe', {
            method: 'POST',
            headers,
            body: JSON.stringify({ targetId: firstCandidate.user_id, status: 'LIKE' })
        });

        if (!swipeRes.ok) {
            console.error('Swipe HTTP Error:', swipeRes.status, await swipeRes.text());
        } else {
            console.log('Swipe successful:', await swipeRes.json());
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

test();

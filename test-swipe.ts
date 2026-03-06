import axios from 'axios';

async function test() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully, token:', token.substring(0, 15) + '...');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Get Candidates
        const candidatesRes = await axios.get('http://localhost:3000/api/swipe/candidates', config);
        const candidates = candidatesRes.data;
        console.log('Got candidates:', candidates.length);

        if (candidates.length === 0) {
            console.log('No candidates to swipe on!');
            return;
        }

        const firstCandidate = candidates[0];
        console.log('First candidate:', { user_id: firstCandidate.user_id, display_name: firstCandidate.display_name });

        // 3. Swipe LIKE
        const swipeRes = await axios.post('http://localhost:3000/api/swipe', {
            targetId: firstCandidate.user_id,
            status: 'LIKE'
        }, config);

        console.log('Swipe successful:', swipeRes.data);

    } catch (err: any) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();

// functions/groq-proxy.js

// Netlify Functions run a Node.js environment, which includes 'fetch' globally.

exports.handler = async (event) => {
    // 1. Get the secret key securely from Netlify's Environment Variables
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server key not configured.' }) };
    }

    // 2. Safely parse the request body from your GitHub Pages frontend
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }

    // 3. Define the external API URL
    const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    try {
        // 4. Make the secure, server-side call
        const groqResponse = await fetch(groqApiUrl, {
            method: 'POST',
            headers: {
                // *** The secret key is only used here, on the server! ***
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await groqResponse.json();

        // 5. Return the result back to your GitHub Pages frontend
        return {
            statusCode: groqResponse.status,
            // Allow your GitHub Pages site to read the response (CORS)
            headers: { 'Access-Control-Allow-Origin': '*' }, 
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error("Groq Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal proxy error.' }),
        };
    }
};

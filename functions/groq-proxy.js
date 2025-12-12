// functions/groq-proxy.js
const fetch = require('node-fetch');

// Define the required CORS headers for all responses
const CORS_HEADERS = {
    // Allows requests from all origins (security relies on API key remaining hidden)
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", 
};

exports.handler = async (event, context) => {
    
    // *** SECURITY CHECK REMOVED: Function is now open to all domains ***

    // 1. Handle the CORS Preflight Request (HTTP OPTIONS)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: "OK",
        };
    }
    
    // 2. Main POST Request Handler
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: CORS_HEADERS, 
            body: "Method Not Allowed",
        };
    }

    try {
        // Retrieve the Groq API Key securely from environment variables
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            console.error("GROQ_API_KEY environment variable is not set.");
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: { message: "Server configuration error: API key missing." } }),
            };
        }

        const requestBody = JSON.parse(event.body);
        
        // Forward the request to Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // *** THE SECURITY STEP ***: Key added on the server-side
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
        });

        const groqData = await groqResponse.json();

        // 3. Return the Final Result with CORS Headers
        if (!groqResponse.ok) {
            return {
                statusCode: groqResponse.status,
                headers: CORS_HEADERS, 
                body: JSON.stringify(groqData),
            };
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS, // CORS header for successful response
            body: JSON.stringify(groqData),
        };

    } catch (error) {
        console.error("Function error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: { message: `Internal proxy error: ${error.message}` } }),
        };
    }
};

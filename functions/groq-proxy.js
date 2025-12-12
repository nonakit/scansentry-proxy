// functions/groq-proxy.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // 1. Preflight CORS Check (REQUIRED for POST requests from other domains)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                // Allow requests from all origins (YOUR GitHub Pages site)
                "Access-Control-Allow-Origin": "*",
                // Specify which methods are allowed
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                // Specify which headers can be sent
                "Access-Control-Allow-Headers": "Content-Type", 
            },
            body: "OK",
        };
    }
    
    // 2. Main POST Request Handler
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
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
                headers: { "Access-Control-Allow-Origin": "*" }, 
                body: JSON.stringify({ error: { message: "Server configuration error: API key missing." } }),
            };
        }

        // Parse the request body (which contains the Groq payload from your frontend)
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
            // Forward error response from Groq, ensuring CORS is included
            return {
                statusCode: groqResponse.status,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(groqData),
            };
        }

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" }, // CORS header for successful response
            body: JSON.stringify(groqData),
        };

    } catch (error) {
        console.error("Function error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: { message: `Internal proxy error: ${error.message}` } }),
        };
    }
};

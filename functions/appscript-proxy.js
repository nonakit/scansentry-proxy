// functions/appscript-proxy.js

exports.handler = async (event) => {
    // 1. Get the secret Apps Script URL securely from Netlify's Environment Variables
    const APPSCRIPT_URL = process.env.GOOGLE_APPSCRIPT_URL;

    if (!APPSCRIPT_URL) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Apps Script URL not configured.' }) };
    }

    try {
        // 2. Forward the request to your Google Apps Script
        const response = await fetch(APPSCRIPT_URL, {
            method: event.httpMethod,
            // Forward the body for POST requests
            body: event.httpMethod === 'POST' ? event.body : null, 
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        // 3. Return the result back to your GitHub Pages frontend
        return {
            statusCode: response.status,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Apps Script Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal proxy error reaching Apps Script.' }),
        };
    }
};

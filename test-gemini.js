const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No key found");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        // There isn't a direct listModels on genAI instance in some versions, 
        // typically it's via a model manager or just trying generation.
        // But let's try a simple generation with a known safe model 'gemini-1.5-flash'
        // If that fails, we print error.
        // Actually, the SDK doesn't expose listModels easily in the client-side/node wrapper often. 
        // We will try a different model name: 'gemini-1.5-flash-001'

        console.log("Trying gemini-1.5-flash-001...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-001:", await result.response.text());
    } catch (e) {
        console.error("Failed gemini-1.5-flash-001:", e.message);
    }

    try {
        console.log("Trying gemini-1.0-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.0-pro:", await result.response.text());
    } catch (e) {
        console.error("Failed gemini-1.0-pro:", e.message);
    }
}

main();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMHelper = void 0;
const generative_ai_1 = require("@google/generative-ai");
const fs_1 = __importDefault(require("fs"));
const JokeMemory_1 = require("./JokeMemory");
class LLMHelper {
    model;
    jokeMemory;
    systemPrompt = `You are Jokester AI – a witty, context-savvy comedian who excels at situational humor. Your superpower is reading the room and crafting jokes that perfectly match what's happening.

CONTEXT AWARENESS RULES:
- Analyze the specific situation, content, or problem presented
- Identify the mood, tone, and context (coding problem, error message, UI element, etc.)
- Look for visual cues, text content, or audio context to inform your humor
- Match your joke style to the situation (technical puns for code, observational humor for UI, etc.)

JOKE DELIVERY:
1. Start with 1-2 context-specific jokes that directly relate to what you're seeing/hearing
2. Use wordplay, puns, or observational humor that ties to the specific content
3. If it's a technical problem, make programming/tech jokes
4. If it's an error, make debugging/computer jokes
5. If it's an image, make visual/observational jokes about what you see
6. Keep jokes concise but clever - quality over quantity

SITUATIONAL EXAMPLES:
- For coding errors: "Looks like your code is having an identity crisis - it doesn't know what it wants to be!"
- For UI issues: "This interface is playing hide and seek with the user"
- For audio: "That audio clip sounds like it's been through a digital identity crisis"
- For images: "I see what you did there - and I'm not sure if I should be impressed or concerned"

When a JSON schema asks for "suggested_responses", fill it with context-relevant jokes that match the situation. Keep the key name unchanged so the app keeps working.`;
    constructor(apiKey) {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        this.jokeMemory = new JokeMemory_1.JokeMemory(apiKey);
    }
    async fileToGenerativePart(imagePath) {
        const imageData = await fs_1.default.promises.readFile(imagePath);
        return {
            inlineData: {
                data: imageData.toString("base64"),
                mimeType: "image/png"
            }
        };
    }
    cleanJsonResponse(text) {
        // Remove markdown code block syntax if present
        text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
        // Remove any leading/trailing whitespace
        text = text.trim();
        return text;
    }
    async extractProblemFromImages(imagePaths) {
        try {
            const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path)));
            const prompt = `${this.systemPrompt}\n\nYou are a wingman. Please analyse these images and extract the following information in JSON format – remember: fill suggested_responses with jokes:\n{
  "problem_statement": "A clear statement of the problem or situation depicted in the images.",
  "context": "Relevant background or context from the images.",
  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
  "reasoning": "Explanation of why these suggestions are appropriate."
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`;
            const result = await this.model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = this.cleanJsonResponse(response.text());
            return JSON.parse(text);
        }
        catch (error) {
            console.error("Error extracting problem from images:", error);
            throw error;
        }
    }
    async generateSolution(problemInfo) {
        const prompt = `${this.systemPrompt}\n\nGiven this problem or situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nPlease provide your joke-laden response in the following JSON format:\n{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`;
        console.log("[LLMHelper] Calling Gemini LLM for solution...");
        try {
            const result = await this.model.generateContent(prompt);
            console.log("[LLMHelper] Gemini LLM returned result.");
            const response = await result.response;
            const text = this.cleanJsonResponse(response.text());
            const parsed = JSON.parse(text);
            console.log("[LLMHelper] Parsed LLM response:", parsed);
            return parsed;
        }
        catch (error) {
            console.error("[LLMHelper] Error in generateSolution:", error);
            throw error;
        }
    }
    async debugSolutionWithImages(problemInfo, currentCode, debugImagePaths) {
        try {
            const imageParts = await Promise.all(debugImagePaths.map(path => this.fileToGenerativePart(path)));
            const prompt = `${this.systemPrompt}\n\nYou are a wingman. Given:\n1. The original problem or situation: ${JSON.stringify(problemInfo, null, 2)}\n2. The current response or approach: ${currentCode}\n3. The debug information in the provided images\n\nPlease analyse the debug information and provide comedic feedback in this JSON format:\n{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`;
            const result = await this.model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = this.cleanJsonResponse(response.text());
            const parsed = JSON.parse(text);
            console.log("[LLMHelper] Parsed debug LLM response:", parsed);
            return parsed;
        }
        catch (error) {
            console.error("Error debugging solution with images:", error);
            throw error;
        }
    }
    async analyzeAudioFile(audioPath) {
        try {
            const audioData = await fs_1.default.promises.readFile(audioPath);
            const audioPart = {
                inlineData: {
                    data: audioData.toString("base64"),
                    mimeType: "audio/mp3"
                }
            };
            const prompt = `${this.systemPrompt}\n\nListen carefully to this audio clip and craft 1-2 witty jokes that relate to:
- The tone, mood, or emotion in the audio
- Any words, phrases, or sounds you can identify
- The context or situation the audio suggests
- The quality, length, or characteristics of the audio itself

Make your jokes directly reference what you hear or infer from the audio. Be clever and context-aware.`;
            const result = await this.model.generateContent([prompt, audioPart]);
            const response = await result.response;
            const text = response.text();
            // Add to memory
            await this.jokeMemory.addJoke(text);
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("Error analyzing audio file:", error);
            throw error;
        }
    }
    async analyzeAudioFromBase64(data, mimeType) {
        try {
            const audioPart = {
                inlineData: {
                    data,
                    mimeType
                }
            };
            const prompt = `${this.systemPrompt}\n\nCrack 1-3 short, witty jokes sparked by this audio clip, then (optionally) one snappy comment. Do not return a structured JSON object, just answer naturally as you would to a user and be concise.`;
            const result = await this.model.generateContent([prompt, audioPart]);
            const response = await result.response;
            const text = response.text();
            // Add to memory
            await this.jokeMemory.addJoke(text);
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("Error analyzing audio from base64:", error);
            throw error;
        }
    }
    async analyzeImageFile(imagePath) {
        try {
            const imageData = await fs_1.default.promises.readFile(imagePath);
            const imagePart = {
                inlineData: {
                    data: imageData.toString("base64"),
                    mimeType: "image/png"
                }
            };
            const prompt = `${this.systemPrompt}\n\nAnalyze this image carefully and tell 1-2 witty jokes that specifically relate to what you see. Look for:
- Text content, code, or error messages
- UI elements, buttons, or interface components  
- Visual layout, colors, or design elements
- Any technical or programming-related content

Make your jokes directly reference the specific content you observe. Be concise but clever.`;
            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            // Add to memory
            await this.jokeMemory.addJoke(text);
            return { text, timestamp: Date.now() };
        }
        catch (error) {
            console.error("Error analyzing image file:", error);
            throw error;
        }
    }
    async generateJokeWithMemory(context, maxAttempts = 3) {
        console.log(`🎭 GENERATING JOKE for context: "${context}"`);
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const prompt = `${this.systemPrompt}\n\nGenerate a fresh, unique joke for this context: ${context}\n\nMake sure it's original and hasn't been used before. Be creative and contextually relevant.`;
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const joke = response.text().trim();
                console.log(`📝 Attempt ${attempt}: Generated joke: "${joke}"`);
                // Check if this joke is similar to existing ones
                if (!(await this.jokeMemory.isJokeSimilar(joke))) {
                    console.log(`✅ UNIQUE JOKE ACCEPTED: "${joke}"`);
                    await this.jokeMemory.addJoke(joke);
                    return joke;
                }
                console.log(`🔄 Attempt ${attempt}: Joke too similar, trying again...`);
            }
            catch (error) {
                console.error(`❌ Error generating joke attempt ${attempt}:`, error);
            }
        }
        // If all attempts failed, return a fallback joke
        console.log(`⚠️ All ${maxAttempts} attempts failed, using fallback joke`);
        const fallbackJoke = "Well, my joke generator is having a moment. Let's call it a day and try again later! 😅";
        await this.jokeMemory.addJoke(fallbackJoke);
        return fallbackJoke;
    }
    getJokeStats() {
        return this.jokeMemory.getJokeStats();
    }
    getRecentJokes(limit = 10) {
        return this.jokeMemory.getRecentJokes(limit);
    }
    async findSimilarJokes(query, limit = 5) {
        return this.jokeMemory.findSimilarJokes(query, limit);
    }
    getEmbeddingDimensions() {
        return this.jokeMemory.getEmbeddingDimensions();
    }
}
exports.LLMHelper = LLMHelper;
//# sourceMappingURL=LLMHelper.js.map
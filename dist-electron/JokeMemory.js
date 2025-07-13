"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JokeMemory = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const generative_ai_1 = require("@google/generative-ai");
class JokeMemory {
    memoryFile;
    jokes = [];
    SIMILARITY_THRESHOLD = 0.85;
    genAI;
    constructor(apiKey) {
        this.memoryFile = path_1.default.join(process.cwd(), 'joke_memory.json');
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.loadMemory();
        console.log(`🧠 JOKE MEMORY INITIALIZED: ${this.jokes.length} jokes loaded from ${this.memoryFile}`);
    }
    loadMemory() {
        try {
            if (fs_1.default.existsSync(this.memoryFile)) {
                const data = fs_1.default.readFileSync(this.memoryFile, 'utf-8');
                this.jokes = JSON.parse(data);
            }
        }
        catch (error) {
            console.error('Error loading joke memory:', error);
            this.jokes = [];
        }
    }
    saveMemory() {
        try {
            fs_1.default.writeFileSync(this.memoryFile, JSON.stringify(this.jokes, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('Error saving joke memory:', error);
        }
    }
    generateHash(text) {
        return crypto_1.default.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
    }
    // Simple cosine similarity for vectors
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length)
            return 0;
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        if (norm1 === 0 || norm2 === 0)
            return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    // Generate embeddings using Gemini API
    async generateEmbedding(text) {
        try {
            const embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" });
            const result = await embeddingModel.embedContent(text);
            const embedding = await result.embedding;
            return embedding.values;
        }
        catch (error) {
            console.error('Error generating embedding:', error);
            // Fallback to hash-based embedding if API fails
            const hash = crypto_1.default.createHash('sha256').update(text.toLowerCase()).digest('hex');
            const embedding = [];
            for (let i = 0; i < 768; i += 2) { // Gemini embeddings are 768-dimensional
                const hexPair = hash.substr(i, 2) || '00';
                embedding.push((parseInt(hexPair, 16) - 128) / 128);
            }
            return embedding;
        }
    }
    async isJokeSimilar(newJoke) {
        const newHash = this.generateHash(newJoke);
        // Check for exact duplicates
        if (this.jokes.some(joke => joke.hash === newHash)) {
            console.log(`🚫 EXACT DUPLICATE DETECTED: "${newJoke.substring(0, 50)}..."`);
            return true;
        }
        // Generate embedding for new joke
        const newJokeEmbedding = await this.generateEmbedding(newJoke);
        // Check for similar jokes
        for (const joke of this.jokes) {
            const jokeSimilarity = this.cosineSimilarity(newJokeEmbedding, joke.jokeEmbedding);
            if (jokeSimilarity > this.SIMILARITY_THRESHOLD) {
                console.log(`🔄 SIMILAR JOKE DETECTED (${(jokeSimilarity * 100).toFixed(1)}% similarity):`);
                console.log(`   New: "${newJoke}"`);
                console.log(`   Existing: "${joke.joke}"`);
                console.log(`   Similarity: ${(jokeSimilarity * 100).toFixed(1)}%`);
                return true;
            }
        }
        return false;
    }
    async addJoke(joke) {
        const id = crypto_1.default.randomUUID();
        const timestamp = Date.now();
        const hash = this.generateHash(joke);
        // Generate embedding for joke
        const jokeEmbedding = await this.generateEmbedding(joke);
        const jokeEntry = {
            id,
            joke,
            jokeEmbedding,
            timestamp,
            hash
        };
        this.jokes.push(jokeEntry);
        this.saveMemory();
        console.log(`💾 JOKE SAVED TO MEMORY (Total: ${this.jokes.length}): "${joke.substring(0, 60)}..."`);
    }
    async findSimilarJokes(query, limit = 5) {
        const queryEmbedding = await this.generateEmbedding(query);
        const similarities = this.jokes.map(joke => ({
            joke,
            similarity: this.cosineSimilarity(queryEmbedding, joke.jokeEmbedding)
        }));
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => item.joke);
    }
    getJokeStats() {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        return {
            total: this.jokes.length,
            recent: this.jokes.filter(joke => joke.timestamp > oneDayAgo).length
        };
    }
    getRecentJokes(limit = 10) {
        return this.jokes
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    clearOldJokes(daysOld = 30) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        this.jokes = this.jokes.filter(joke => joke.timestamp > cutoffTime);
        this.saveMemory();
    }
    // Method to get embedding dimensions for debugging
    getEmbeddingDimensions() {
        return this.jokes.length > 0 ? this.jokes[0].jokeEmbedding.length : 768;
    }
}
exports.JokeMemory = JokeMemory;
//# sourceMappingURL=JokeMemory.js.map
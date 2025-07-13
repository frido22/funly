import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { GoogleGenerativeAI } from "@google/generative-ai"

interface JokeEntry {
  id: string
  joke: string
  jokeEmbedding: number[]
  timestamp: number
  hash: string
}

export class JokeMemory {
  private memoryFile: string
  private jokes: JokeEntry[] = []
  private readonly SIMILARITY_THRESHOLD = 0.5
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.memoryFile = path.join(process.cwd(), 'joke_memory.json')
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.loadMemory()
    console.log(`🧠 JOKE MEMORY INITIALIZED: ${this.jokes.length} jokes loaded from ${this.memoryFile}`)
  }

  private loadMemory(): void {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const data = fs.readFileSync(this.memoryFile, 'utf-8')
        this.jokes = JSON.parse(data)
      }
    } catch (error) {
      console.error('Error loading joke memory:', error)
      this.jokes = []
    }
  }

  private saveMemory(): void {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(this.jokes, null, 2), 'utf-8')
    } catch (error) {
      console.error('Error saving joke memory:', error)
    }
  }

  private generateHash(text: string): string {
    return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex')
  }

  // Simple cosine similarity for vectors
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }
    
    if (norm1 === 0 || norm2 === 0) return 0
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  // Generate embeddings using Gemini API
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" })
      const result = await embeddingModel.embedContent(text)
      const embedding = await result.embedding
      
      return embedding.values
    } catch (error) {
      console.error('Error generating embedding:', error)
      // Fallback to hash-based embedding if API fails
      const hash = crypto.createHash('sha256').update(text.toLowerCase()).digest('hex')
      const embedding: number[] = []
      
      for (let i = 0; i < 768; i += 2) { // Gemini embeddings are 768-dimensional
        const hexPair = hash.substr(i, 2) || '00'
        embedding.push((parseInt(hexPair, 16) - 128) / 128)
      }
      
      return embedding
    }
  }

  public async isJokeSimilar(newJoke: string): Promise<boolean> {
    const newHash = this.generateHash(newJoke)
    
    // Check for exact duplicates
    if (this.jokes.some(joke => joke.hash === newHash)) {
      console.log(`🚫 EXACT DUPLICATE DETECTED: "${newJoke.substring(0, 50)}..."`)
      return true
    }

    // Generate embedding for new joke
    const newJokeEmbedding = await this.generateEmbedding(newJoke)

    // Check for similar jokes
    for (const joke of this.jokes) {
      const jokeSimilarity = this.cosineSimilarity(newJokeEmbedding, joke.jokeEmbedding)
      if (jokeSimilarity > this.SIMILARITY_THRESHOLD) {
        console.log(`🔄 SIMILAR JOKE DETECTED (${(jokeSimilarity * 100).toFixed(1)}% similarity):`)
        console.log(`   New: "${newJoke}"`)
        console.log(`   Existing: "${joke.joke}"`)
        console.log(`   Similarity: ${(jokeSimilarity * 100).toFixed(1)}%`)
        return true
      }
    }

    return false
  }

  public async addJoke(joke: string): Promise<void> {
    const id = crypto.randomUUID()
    const timestamp = Date.now()
    const hash = this.generateHash(joke)

    // Generate embedding for joke
    const jokeEmbedding = await this.generateEmbedding(joke)

    const jokeEntry: JokeEntry = {
      id,
      joke,
      jokeEmbedding,
      timestamp,
      hash
    }

    this.jokes.push(jokeEntry)
    this.saveMemory()
    console.log(`💾 JOKE SAVED TO MEMORY (Total: ${this.jokes.length}): "${joke.substring(0, 60)}..."`)
  }

  public async findSimilarJokes(query: string, limit: number = 5): Promise<JokeEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    
    const similarities = this.jokes.map(joke => ({
      joke,
      similarity: this.cosineSimilarity(queryEmbedding, joke.jokeEmbedding)
    }))
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.joke)
  }

  public getJokeStats(): { total: number; recent: number } {
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    
    return {
      total: this.jokes.length,
      recent: this.jokes.filter(joke => joke.timestamp > oneDayAgo).length
    }
  }

  public getRecentJokes(limit: number = 10): JokeEntry[] {
    return this.jokes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
      
  public clearOldJokes(daysOld: number = 30): void {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
    this.jokes = this.jokes.filter(joke => joke.timestamp > cutoffTime)
    this.saveMemory()
  }

  // Method to get embedding dimensions for debugging
  public getEmbeddingDimensions(): number {
    return this.jokes.length > 0 ? this.jokes[0].jokeEmbedding.length : 768
  }
} 
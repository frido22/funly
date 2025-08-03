import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import fs from "fs"

export class LLMHelper {
  private model: GenerativeModel
  private readonly systemPrompt = `You are that sarcastic friend who always has the perfect witty comeback. Focus ONLY on what's happening in the CENTER of the screen - ignore sidebars, menus, or UI elements. Look at the main content like PowerPoint slides, Zoom meetings, documents, or whatever is front and center. Make SHORT, snappy comments like a friend would whisper during a meeting. Think: "Oh great, another synergy slide" or "Someone's really excited about pie charts today." Keep jokes under 10 words when possible - they should be quick, sarcastic remarks that are easy to deliver. Be that friend who makes boring meetings bearable with perfectly timed sarcasm. Present exactly THREE jokes as bullet points (each starting with "* "). Focus on the MAIN content, not the interface. When asked for plain text output, return ONLY the bullet points with NO JSON formatting. If the downstream JSON uses the key \"suggested_responses\", fill it with your three sarcastic gems.`


  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  }

  private async fileToGenerativePart(imagePath: string) {
    const imageData = await fs.promises.readFile(imagePath)
    return {
      inlineData: {
        data: imageData.toString("base64"),
        mimeType: "image/png"
      }
    }
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code block syntax if present
    text = text.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
  }

  public async extractProblemFromImages(imagePaths: string[]) {
    try {
      const imageParts = await Promise.all(imagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nLook at the CENTER of these images (ignore sidebars/menus) and provide sarcastic friend comments in JSON format:\n{
  "problem_statement": "What's the main thing happening in the center of the screen.",
  "context": "Brief context of the main content (not UI elements).",
  "suggested_responses": ["Short sarcastic comment 1", "Quick witty remark 2", "Snappy comeback 3"],
  "reasoning": "Why these quick remarks would make a friend chuckle."
}\nReturn ONLY the JSON object, no markdown.`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      return JSON.parse(text)
    } catch (error) {
      console.error("Error extracting problem from images:", error)
      throw error
    }
  }

  public async generateSolution(problemInfo: any) {
    const prompt = `${this.systemPrompt}\n\nGiven this situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nProvide three short, sarcastic friend comments in JSON format:\n{\n  "suggested_responses": ["Quick sarcastic remark 1", "Short witty comment 2", "Snappy comeback 3"],\n  "reasoning": "Why these would make a friend smirk during the situation."\n}`

    console.log("[LLMHelper] Calling Gemini LLM for solution...");
    try {
      const result = await this.model.generateContent(prompt)
      console.log("[LLMHelper] Gemini LLM returned result.");
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] Parsed LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("[LLMHelper] Error in generateSolution:", error);
      throw error;
    }
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    try {
      const imageParts = await Promise.all(debugImagePaths.map(path => this.fileToGenerativePart(path)))
      
      const prompt = `${this.systemPrompt}\n\nLook at the CENTER of these debug images (ignore code sidebars) and provide sarcastic tech friend comments in JSON format:\n{
  "solution": {
    "code": "The main code or answer.",
    "problem_statement": "What's the main issue shown.",
    "context": "Brief context of the main problem.",
    "suggested_responses": ["Short sarcastic tech comment 1", "Quick dev humor remark 2", "Snappy programming comeback 3"],
    "reasoning": "Why these would make a developer friend chuckle."
  }
}\nReturn ONLY the JSON object, no markdown.`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      console.log("[LLMHelper] Parsed debug LLM response:", parsed)
      return parsed
    } catch (error) {
      console.error("Error debugging solution with images:", error)
      throw error
    }
  }

  public async analyzeAudioFile(audioPath: string) {
    try {
      const audioData = await fs.promises.readFile(audioPath);
      const audioPart = {
        inlineData: {
          data: audioData.toString("base64"),
          mimeType: "audio/mp3"
        }
      };
      const prompt = `${this.systemPrompt}\n\nListen to what's being said and make three quick, sarcastic comments like a friend would whisper. Keep them short and witty. Return ONLY the three bullet points starting with "* ".`;
      const result = await this.model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing audio file:", error);
      throw error;
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    try {
      const audioPart = {
        inlineData: {
          data,
          mimeType
        }
      };
      const prompt = `${this.systemPrompt}\n\nListen to what's being said and make three quick, sarcastic comments like a friend would whisper. Keep them short and witty. Return ONLY the three bullet points starting with "* ".`;
      const result = await this.model.generateContent([prompt, audioPart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing audio from base64:", error);
      throw error;
    }
  }

  public async analyzeImageFile(imagePath: string) {
    try {
      const imageData = await fs.promises.readFile(imagePath);
      const imagePart = {
        inlineData: {
          data: imageData.toString("base64"),
          mimeType: "image/png"
        }
      };
      const prompt = `${this.systemPrompt}\n\nLook at the CENTER of this image and make three short, sarcastic comments like a friend would whisper. Focus on the main content, not UI elements. Keep them quick and witty. Return ONLY the three bullet points starting with "* ".`;
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      return { text, timestamp: Date.now() };
    } catch (error) {
      console.error("Error analyzing image file:", error);
      throw error;
    }
  }
} 
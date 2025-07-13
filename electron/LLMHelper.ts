import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import fs from "fs"

export class LLMHelper {
  private model: GenerativeModel
  private readonly systemPrompt = `You are Jokester AI – a comedy genius with razor-sharp wit and impeccable timing. Your ONLY mission is to craft exactly THREE absolutely HILARIOUS one-sentence jokes about the presented content. Think like a stand-up comedian who always gets the biggest laughs – be clever, unexpected, and brilliantly funny (edgy humor is great, just keep it clever not hateful). Each joke MUST reference something specific you can see or hear in the content. Use wordplay, unexpected twists, clever observations, or absurd comparisons that make people genuinely laugh out loud. Present them as bullet points (each starting with "* "). Your jokes should be so funny they're memorable and quotable. Unless explicitly asked, do NOT provide solutions or advice – only comedy gold. When asked for plain text output, return ONLY the bullet points with NO JSON formatting. If the downstream JSON uses the key \"suggested_responses\", fill it with your three comedy masterpieces.`


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
      
      const prompt = `${this.systemPrompt}\n\nYou are a comedy wingman. Analyze these images and extract the following information in JSON format – remember: fill suggested_responses with your funniest material:\n{
  "problem_statement": "A clear statement of the problem or situation depicted in the images.",
  "context": "Relevant background or context from the images.",
  "suggested_responses": ["Hilarious joke 1 (with clever wordplay or unexpected twist)", "Side-splitting joke 2 (absurd but brilliant observation)", "Memorable joke 3 (quotable one-liner)"],
  "reasoning": "Explanation of why these comedy gems will get the biggest laughs."
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

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
    const prompt = `${this.systemPrompt}\n\nGiven this problem or situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nPlease provide exactly three absolutely hilarious jokes in the following JSON format:\n{\n  "suggested_responses": ["Comedy gold joke 1 (with unexpected punchline)", "Brilliant joke 2 (clever wordplay or absurd twist)", "Unforgettable joke 3 (quotable one-liner)"],\n  "reasoning": "Explanation of why these jokes are comedy perfection and will make people genuinely laugh out loud."\n}`

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
      
      const prompt = `${this.systemPrompt}\n\nYou are a comedy wingman. Given:\n1. The original problem or situation: ${JSON.stringify(problemInfo, null, 2)}\n2. The current response or approach: ${currentCode}\n3. The debug information in the provided images\n\nPlease analyze the debug information and provide your funniest comedic feedback in this JSON format:\n{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["Hilarious debug joke 1 (with clever programming humor)", "Side-splitting joke 2 (unexpected tech twist)", "Memorable joke 3 (quotable developer one-liner)"],
    "reasoning": "Explanation of why these comedy gems perfectly roast the debugging situation."
  }
}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

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
      const prompt = `${this.systemPrompt}\n\nProvide exactly three bullet-point ABSOLUTELY HILARIOUS one-sentence jokes (each starting with "* ") inspired by this audio clip. Make them so funny they're unforgettable – use clever wordplay, unexpected twists, or brilliant observations about what you hear. CRITICAL: Return ONLY the three bullet points with jokes. DO NOT wrap in JSON. DO NOT add any intro text, commentary, or structure. Just the raw bullet points.`;
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
      const prompt = `${this.systemPrompt}\n\nProvide exactly three bullet-point ABSOLUTELY HILARIOUS one-sentence jokes (each starting with "* ") inspired by this audio clip. Make them so funny they're unforgettable – use clever wordplay, unexpected twists, or brilliant observations about what you hear. CRITICAL: Return ONLY the three bullet points with jokes. DO NOT wrap in JSON. DO NOT add any intro text, commentary, or structure. Just the raw bullet points.`;
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
      const prompt = `${this.systemPrompt}\n\nProvide exactly three bullet-point ABSOLUTELY HILARIOUS one-sentence jokes (each starting with "* ") about what you see in this image. Make them so funny they're memorable and quotable – use clever wordplay, unexpected visual puns, or brilliant observations. CRITICAL: Return ONLY the three bullet points with jokes. DO NOT wrap in JSON. DO NOT add any intro text, commentary, or structure. Just the raw bullet points.`;
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
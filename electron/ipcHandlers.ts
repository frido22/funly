// ipcHandlers.ts

import { ipcMain, app } from "electron"
import { AppState } from "./main"

export function initializeIpcHandlers(appState: AppState): void {
  ipcMain.handle(
    "update-content-dimensions",
    async (event, { width, height }: { width: number; height: number }) => {
      if (width && height) {
        appState.setWindowDimensions(width, height)
      }
    }
  )

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    return appState.deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      const preview = await appState.getImagePreview(screenshotPath)
      return { path: screenshotPath, preview }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    console.log({ view: appState.getView() })
    try {
      let previews = []
      if (appState.getView() === "queue") {
        previews = await Promise.all(
          appState.getScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      } else {
        previews = await Promise.all(
          appState.getExtraScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      }
      previews.forEach((preview: any) => console.log(preview.path))
      return previews
    } catch (error) {
      console.error("Error getting screenshots:", error)
      throw error
    }
  })

  ipcMain.handle("toggle-window", async () => {
    appState.toggleMainWindow()
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      appState.clearQueues()
      console.log("Screenshot queues have been cleared.")
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  // IPC handler for getting joke statistics
  ipcMain.handle("get-joke-stats", async () => {
    try {
      const stats = appState.processingHelper.getLLMHelper().getJokeStats()
      return stats
    } catch (error: any) {
      console.error("Error in get-joke-stats handler:", error)
      throw error
    }
  })

  // IPC handler for getting recent jokes
  ipcMain.handle("get-recent-jokes", async (event, limit: number = 10) => {
    try {
      const jokes = appState.processingHelper.getLLMHelper().getRecentJokes(limit)
      return jokes
    } catch (error: any) {
      console.error("Error in get-recent-jokes handler:", error)
      throw error
    }
  })

  // IPC handler for generating joke with memory
  ipcMain.handle("generate-joke-with-memory", async (event, context: string) => {
    try {
      const joke = await appState.processingHelper.getLLMHelper().generateJokeWithMemory(context)
      return joke
    } catch (error: any) {
      console.error("Error in generate-joke-with-memory handler:", error)
      throw error
    }
  })

  // IPC handler for finding similar jokes (RAG search)
  ipcMain.handle("find-similar-jokes", async (event, query: string, limit: number = 5) => {
    try {
      const jokes = await appState.processingHelper.getLLMHelper().findSimilarJokes(query, limit)
      return jokes
    } catch (error: any) {
      console.error("Error in find-similar-jokes handler:", error)
      throw error
    }
  })



  // IPC handler for getting embedding dimensions
  ipcMain.handle("get-embedding-dimensions", async () => {
    try {
      const dimensions = appState.processingHelper.getLLMHelper().getEmbeddingDimensions()
      return dimensions
    } catch (error: any) {
      console.error("Error in get-embedding-dimensions handler:", error)
      throw error
    }
  })

  ipcMain.handle("quit-app", () => {
    app.quit()
  })
}

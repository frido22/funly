"use strict";
// ipcHandlers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIpcHandlers = initializeIpcHandlers;
const electron_1 = require("electron");
function initializeIpcHandlers(appState) {
    electron_1.ipcMain.handle("update-content-dimensions", async (event, { width, height }) => {
        if (width && height) {
            appState.setWindowDimensions(width, height);
        }
    });
    electron_1.ipcMain.handle("delete-screenshot", async (event, path) => {
        return appState.deleteScreenshot(path);
    });
    electron_1.ipcMain.handle("take-screenshot", async () => {
        try {
            const screenshotPath = await appState.takeScreenshot();
            const preview = await appState.getImagePreview(screenshotPath);
            return { path: screenshotPath, preview };
        }
        catch (error) {
            console.error("Error taking screenshot:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("get-screenshots", async () => {
        console.log({ view: appState.getView() });
        try {
            let previews = [];
            if (appState.getView() === "queue") {
                previews = await Promise.all(appState.getScreenshotQueue().map(async (path) => ({
                    path,
                    preview: await appState.getImagePreview(path)
                })));
            }
            else {
                previews = await Promise.all(appState.getExtraScreenshotQueue().map(async (path) => ({
                    path,
                    preview: await appState.getImagePreview(path)
                })));
            }
            previews.forEach((preview) => console.log(preview.path));
            return previews;
        }
        catch (error) {
            console.error("Error getting screenshots:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("toggle-window", async () => {
        appState.toggleMainWindow();
    });
    electron_1.ipcMain.handle("reset-queues", async () => {
        try {
            appState.clearQueues();
            console.log("Screenshot queues have been cleared.");
            return { success: true };
        }
        catch (error) {
            console.error("Error resetting queues:", error);
            return { success: false, error: error.message };
        }
    });
    // IPC handler for analyzing audio from base64 data
    electron_1.ipcMain.handle("analyze-audio-base64", async (event, data, mimeType) => {
        try {
            const result = await appState.processingHelper.processAudioBase64(data, mimeType);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-audio-base64 handler:", error);
            throw error;
        }
    });
    // IPC handler for analyzing audio from file path
    electron_1.ipcMain.handle("analyze-audio-file", async (event, path) => {
        try {
            const result = await appState.processingHelper.processAudioFile(path);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-audio-file handler:", error);
            throw error;
        }
    });
    // IPC handler for analyzing image from file path
    electron_1.ipcMain.handle("analyze-image-file", async (event, path) => {
        try {
            const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-image-file handler:", error);
            throw error;
        }
    });
    // IPC handler for getting joke statistics
    electron_1.ipcMain.handle("get-joke-stats", async () => {
        try {
            const stats = appState.processingHelper.getLLMHelper().getJokeStats();
            return stats;
        }
        catch (error) {
            console.error("Error in get-joke-stats handler:", error);
            throw error;
        }
    });
    // IPC handler for getting recent jokes
    electron_1.ipcMain.handle("get-recent-jokes", async (event, limit = 10) => {
        try {
            const jokes = appState.processingHelper.getLLMHelper().getRecentJokes(limit);
            return jokes;
        }
        catch (error) {
            console.error("Error in get-recent-jokes handler:", error);
            throw error;
        }
    });
    // IPC handler for generating joke with memory
    electron_1.ipcMain.handle("generate-joke-with-memory", async (event, context) => {
        try {
            const joke = await appState.processingHelper.getLLMHelper().generateJokeWithMemory(context);
            return joke;
        }
        catch (error) {
            console.error("Error in generate-joke-with-memory handler:", error);
            throw error;
        }
    });
    // IPC handler for finding similar jokes (RAG search)
    electron_1.ipcMain.handle("find-similar-jokes", async (event, query, limit = 5) => {
        try {
            const jokes = await appState.processingHelper.getLLMHelper().findSimilarJokes(query, limit);
            return jokes;
        }
        catch (error) {
            console.error("Error in find-similar-jokes handler:", error);
            throw error;
        }
    });
    // IPC handler for getting embedding dimensions
    electron_1.ipcMain.handle("get-embedding-dimensions", async () => {
        try {
            const dimensions = appState.processingHelper.getLLMHelper().getEmbeddingDimensions();
            return dimensions;
        }
        catch (error) {
            console.error("Error in get-embedding-dimensions handler:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("quit-app", () => {
        electron_1.app.quit();
    });
}
//# sourceMappingURL=ipcHandlers.js.map
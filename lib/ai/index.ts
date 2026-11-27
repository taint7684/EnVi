// Barrel exports for AI
export { aiRouter, type GenerateInput, type GenerateResult, AiUnavailableError } from "./router";
export { callGroqChat } from "./groq";
export { callOllamaChat } from "./ollama";
export { callOpenRouterChat } from "./openrouter";
export { callGemini } from "./gemini";
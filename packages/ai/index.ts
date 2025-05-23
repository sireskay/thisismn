import { openai } from "@ai-sdk/openai";
import OpenAI from "openai";

export const textModel = openai("gpt-4o-mini");
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

// Export OpenAI client instance
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export * from "ai";
export * from "./lib";

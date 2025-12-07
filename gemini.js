import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';
import {SummaryToCleanText,QuizFormatter} from './formatter.js'

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ModelName = "gemini-2.5-flash";
//gets youtube videoID from thw whole url
function extractVideoId(urlOrId) {

  if (!urlOrId) return null;
  const match = urlOrId.match(/(?:v=|\/videos\/|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  return null;
}

/**
 * Executes the Python script and waits for the result
 */
function getTranscriptFromPython(videoId) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "transcript.py");
    
    // Use 'python' for Windows. 
    const pythonProcess = spawn("python", [scriptPath, videoId]);

    let dataBuffer = "";
    let errorBuffer = "";

    pythonProcess.stdout.on("data", (data) => {
      dataBuffer += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorBuffer += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${errorBuffer}`));
      } else {
        resolve(dataBuffer);
      }
    });
  });
}

export async function getResponse(videoUrlOrId) {
  // const apiKey = process.env.GEMINI_API_KEY; // OR your hardcoded key for testing
  
  // 1. Clean the ID first
  const videoId = extractVideoId(videoUrlOrId);
  if (!videoId) return "Invalid YouTube URL provided.";

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    console.log(`Fetching transcript for ID: ${videoId}...`);

    // 2. WAIT for Python to finish (The key fix)
    const fullText = await getTranscriptFromPython(videoId);

    if (!fullText || fullText.trim().length === 0) {
        return "No transcript found for this video.";
    }

    // const MAX_CHARS = 20000;
    // const trimmedText = fullText.slice(0, MAX_CHARS);
    const trimmedText = fullText;
    console.log(`Transcript received (${trimmedText.length} chars). Sending to Gemini...`);
    
    const prompt = `Summarize this YouTube video transcript into concise bullet points:\n\n${trimmedText}`;

    const result = await ai.models.generateContent({
      model: ModelName, // or gemini-1.5-flash
      contents: { role: 'user', parts: [{ text: prompt }] }, // Correct SDK format
    });

    // Handle different SDK response structures
    const responseText = result.text; 
    return SummaryToCleanText(responseText);

  } catch (error) {
    console.error("Error:", error);
    return `Error: ${error.message}`;
  }
}


export async function getDetailedResponse(videoUrlOrId) {
  // const apiKey = process.env.GEMINI_API_KEY; // OR your hardcoded key for testing
  
  // 1. Clean the ID first
  const videoId = extractVideoId(videoUrlOrId);
  if (!videoId) return "Invalid YouTube URL provided.";

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    console.log(`Fetching transcript for ID: ${videoId}...`);

    // 2. WAIT for Python to finish (The key fix)
    const fullText = await getTranscriptFromPython(videoId);

    if (!fullText || fullText.trim().length === 0) {
        return "No transcript found for this video.";
    }

    // const MAX_CHARS = 20000;
    // const trimmedText = fullText.slice(0, MAX_CHARS);
    const trimmedText = fullText;
    
    console.log(`Transcript received (${trimmedText.length} chars). Sending to Gemini...`);

    const prompt = `Summarize this YouTube video transcript into detailed bullet points, explain all the points explained in the video in detail:\n\n${trimmedText}`;

    const result = await ai.models.generateContent({
      model: ModelName, 
      contents: { role: 'user', parts: [{ text: prompt }] }, // Correct SDK format
    });

    // Handle different SDK response structures
    const responseText = result.text; 
    return SummaryToCleanText(responseText);

  } catch (error) {
    console.error("Error:", error);
    return `Error: ${error.message}`;
  }
}

export async function GetQuizz(videoUrlOrId,noOfQuestions) {
  // const apiKey = process.env.GEMINI_API_KEY; // OR your hardcoded key for testing
  
  // 1. Clean the ID first
  const videoId = extractVideoId(videoUrlOrId);
  if (!videoId) return "Invalid YouTube URL provided.";

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    console.log(`Fetching transcript for ID: ${videoId}...`);

    // 2. WAIT for Python to finish (The key fix)
    const fullText = await getTranscriptFromPython(videoId);

    if (!fullText || fullText.trim().length === 0) {
        return "No transcript found for this video.";
    }

    // const MAX_CHARS = 20000;
    // const trimmedText = fullText.slice(0, MAX_CHARS);
    const trimmedText = fullText;
    
    console.log(`Transcript received (${trimmedText.length} chars). Sending to Gemini...`);

    const prompt = `You are a quiz-question generator.

Your task: Read the content below and create ${noOfQuestions} high-quality medium-hard MCQs
based on deep understanding of the topic and any information the learner should remember.

## RULES  
- Each question must test real understanding (not trivial recall).  
- Each question must have exactly 4 answer options.  
- Only ONE option must be correct and make correct option random not like for all questions option 2 or 3 is the correct answer.  
- The <answer> tag must contain ONLY the correct option number (1–4).  
- The <explanation> must clearly explain *why* the correct option is correct.  
- Explanations should be short, clear, and useful for learning.  
- Do NOT include any text outside the XML format.  
- Output MUST follow the structure exactly.
- Make the questions hard and needs deep understanding of the topic
- Make the correct option random.

## OUTPUT FORMAT (STRICT XML)
<Quiz>
  <QuizQuestion>
    <question></question>
    <option1></option1>
    <option2></option2>
    <option3></option3>
    <option4></option4>
    <answer></answer>
    <explanation></explanation>
  </QuizQuestion>
  ...repeat for all questions...
</Quiz>

## CONTENT TO GENERATE QUESTIONS FROM
${trimmedText}`;

    const result = await ai.models.generateContent({
      model: ModelName, 
      contents: { role: 'user', parts: [{ text: prompt }] }, // Correct SDK format
    });

    // Handle different SDK response structures
    const responseText = result.text; 
    return QuizFormatter(responseText);

  } catch (error) {
    console.error("Error:", error);
    return `Error: ${error.message}`;
  }
}
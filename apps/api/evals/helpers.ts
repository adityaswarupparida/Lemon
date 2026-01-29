import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type EvalResult = {
    passed: boolean;
    score: number; // 0-10
    reason: string;
};

/**
 * LLM-as-judge evaluation helper
 * Uses Gemini to evaluate the quality of a response
 */
export async function llmJudge(
    criteria: string,
    input: string,
    output: string
): Promise<EvalResult> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an AI evaluator. Evaluate the following output based on the given criteria.

CRITERIA: ${criteria}

USER INPUT: ${input}

AI OUTPUT: ${output}

Respond in this exact JSON format:
{
    "score": <number 0-10>,
    "passed": <true if score >= 7, false otherwise>,
    "reason": "<brief explanation>"
}

Only respond with the JSON, nothing else.`,
    });

    try {
        const text = response.text?.trim() || "";
        // Remove markdown code blocks if present
        const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        return JSON.parse(jsonStr);
    } catch {
        return {
            passed: false,
            score: 0,
            reason: "Failed to parse evaluation response"
        };
    }
}

/**
 * Check if response meets length requirements
 */
export function checkLength(
    text: string,
    minLength: number,
    maxLength: number
): EvalResult {
    const length = text.length;
    const passed = length >= minLength && length <= maxLength;
    return {
        passed,
        score: passed ? 10 : 0,
        reason: passed
            ? `Length ${length} is within bounds [${minLength}, ${maxLength}]`
            : `Length ${length} is outside bounds [${minLength}, ${maxLength}]`
    };
}

/**
 * Check if response contains required elements
 */
export function checkContains(
    text: string,
    mustContain: string[],
    mustNotContain: string[]
): EvalResult {
    const missingRequired = mustContain.filter(s => !text.toLowerCase().includes(s.toLowerCase()));
    const hasForbidden = mustNotContain.filter(s => text.toLowerCase().includes(s.toLowerCase()));

    const passed = missingRequired.length === 0 && hasForbidden.length === 0;
    let reason = "";

    if (missingRequired.length > 0) {
        reason += `Missing required: ${missingRequired.join(", ")}. `;
    }
    if (hasForbidden.length > 0) {
        reason += `Contains forbidden: ${hasForbidden.join(", ")}. `;
    }
    if (passed) {
        reason = "All content checks passed";
    }

    return {
        passed,
        score: passed ? 10 : 0,
        reason
    };
}

/**
 * Measure streaming performance
 */
export type StreamingMetrics = {
    totalChunks: number;
    totalTime: number;
    averageChunkTime: number;
    firstChunkTime: number;
};

export function analyzeStreamingMetrics(
    metrics: StreamingMetrics,
    maxFirstChunkMs: number = 2000,
    maxAvgChunkMs: number = 500
): EvalResult {
    const firstChunkOk = metrics.firstChunkTime <= maxFirstChunkMs;
    const avgChunkOk = metrics.averageChunkTime <= maxAvgChunkMs;
    const passed = firstChunkOk && avgChunkOk;

    return {
        passed,
        score: passed ? 10 : (firstChunkOk || avgChunkOk ? 5 : 0),
        reason: `First chunk: ${metrics.firstChunkTime}ms (max: ${maxFirstChunkMs}ms), Avg chunk: ${metrics.averageChunkTime.toFixed(0)}ms (max: ${maxAvgChunkMs}ms)`
    };
}

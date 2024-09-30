import * as core from "@actions/core";
import OpenAI from "openai";
import { AICommentResponse } from "../type";

const OPENAI_API_KEY: string = core.getInput("OPENAI_API_KEY");
const OPENAI_API_MODEL: string = core.getInput("OPENAI_API_MODEL");
const RESPONSE_TOKENS = 1024;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function getAIResponse(
  prompt: string
): Promise<Array<AICommentResponse>> {
  core.info("Sending request to OpenAI API...");

  const queryConfig = {
    model: OPENAI_API_MODEL,
    temperature: 0.2,
    max_tokens: RESPONSE_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "json_object",
    } as const,
  };

  try {
    const response = await openai.chat.completions.create({
      ...queryConfig,
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("OpenAI API returned an invalid response");
    }

    core.info("Received response from OpenAI API.");
    const res = response.choices[0].message?.content?.trim() || "{}";

    // Remove any markdown formatting and ensure valid JSON
    const jsonString = res.replace(/^```json\s*|\s*```$/g, "").trim();

    try {
      let data = JSON.parse(jsonString);
      if (!Array.isArray(data?.comments)) {
        throw new Error("Invalid response from OpenAI API");
      }
      return data.comments;
    } catch (parseError) {
      core.error(`Failed to parse JSON: ${jsonString}`);
      core.error(`Parse error: ${parseError}`);
      throw parseError;
    }
  } catch (error: any) {
    core.error("Error Message:", error?.message || error);

    if (error?.response) {
      core.error("Response Data:", error.response.data);
      core.error("Response Status:", error.response.status);
      core.error("Response Headers:", error.response.headers);
    }

    if (error?.config) {
      core.error("Config:", error.config);
    }

    core.setFailed(`OpenAI API request failed: ${error.message}`);
    throw error;
  }
}

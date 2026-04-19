import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let ai;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const staticRoadmap = (eventTitle) => `### Preparation Roadmap for "${eventTitle}"

1. **Understand the Problem** — Read the event brief and all constraints carefully before writing a single line of code.
2. **Plan Your Approach** — Outline your solution and data structures on paper first.
3. **Implement** — Write clean, well-commented code. Prioritize correctness over speed.
4. **Test Edge Cases** — Run your solution against boundary inputs and invalid data.
5. **Review & Submit** — Double-check your submission before the deadline.`;

// Centralized helper to parse AI responses that might contain markdown or noise
const parseAIJSON = (text) => {
  try {
    let cleanText = text.trim();
    // Handle markdown code blocks
    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) cleanText = match[1];
    }
    
    // Find the first { and last } to strip conversational noise
    const start = cleanText.indexOf('{');
    const end = cleanText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      cleanText = cleanText.slice(start, end + 1);
    }
    
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('AI JSON Parse Error. Raw text:', text);
    throw new Error('Malformed AI response');
  }
};

export const generateEventRoadmap = async (eventTitle) => {
  if (!ai) return staticRoadmap(eventTitle);
  
  const prompt = `Generate a structured, step-by-step roadmap for a university event titled '${eventTitle}'. Include preparation steps, timeline, execution phases, and final submission guidance.`;
  
  const attemptGeneration = async (modelName) => {
    return await ai.models.generateContent({ model: modelName, contents: prompt });
  };

  try {
    let response;
    try {
      response = await attemptGeneration('gemini-3.1-flash-lite-preview');
    } catch (e) {
      if (e.status === 429 || e.status === 503 || e.status === 404) {
        console.log(`Primary model failed (${e.status}), falling back to gemini-1.5-flash-8b`);
        try {
          response = await attemptGeneration('gemini-1.5-flash-8b');
        } catch (e2) {
          console.warn('Backup model also failed or quota exhausted:', e2.status);
          return staticRoadmap(eventTitle);
        }
      } else {
        throw e;
      }
    }
    return response?.response?.text() || staticRoadmap(eventTitle);
  } catch (err) {
    console.error('Gemini roadmap error:', err.status || err.message);
    return staticRoadmap(eventTitle);
  }
};

export const evaluateSubmission = async (studentAnswer) => {
  if (!ai) return {
    score: 8,
    feedback: 'Mock Feedback: Please add GEMINI_API_KEY to .env. Good effort.',
    suggestions: 'Keep practicing!'
  };

  const prompt = `Evaluate the following student submission based on correctness, clarity, creativity, and completeness. Provide a score out of 10 and detailed constructive feedback.
  
Return the output EXACTLY in this JSON format:
{
  "score": <number>,
  "feedback": "<string>",
  "suggestions": "<string>"
}

Submission:
${studentAnswer}`;

  const attemptEvaluation = async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt
    });
  };

  try {
    let response;
    try {
      response = await attemptEvaluation('gemini-3.1-flash-lite-preview');
    } catch (e) {
      if (e.status === 429 || e.status === 503 || e.status === 404) {
        console.log(`Primary eval failed (${e.status}), falling back to gemini-1.5-flash-8b`);
        response = await attemptEvaluation('gemini-1.5-flash-8b');
      } else {
        throw e;
      }
    }
    let text = response?.response?.text() || '';
    return parseAIJSON(text);
  } catch (err) {
    console.error('Gemini evaluation error:', err);
    return {
      score: 5,
      feedback: 'AI Evaluation currently unavailable. Please try again or wait for coordinator review.',
      suggestions: 'Review your submission for clarity.'
    };
  }
};

export const evaluateStructuredSubmission = async (event, mcqAnswers, codeSubmissions) => {
  if (!ai) return { score: 10, feedback: 'Full mock score. Add GEMINI key.', suggestions: '' };

  let mcqFeedback = "MCQ Performance:\n";
  let earnedScore = 0;
  let totalScore = 0;
  const mcqs = event.mcqs || [];
  
  if (mcqs.length > 0) {
    const pointsPerMcq = 40 / mcqs.length;
    totalScore += 40;
    
    mcqs.forEach((mcq, idx) => {
      const studentAns = parseInt(mcqAnswers[idx], 10);
      const correctAns = parseInt(mcq.correctOptionIndex, 10);
      if (!isNaN(studentAns) && studentAns === correctAns) {
        earnedScore += pointsPerMcq;
        mcqFeedback += `- Q${idx+1}: ✓ Correct! (${mcq.options[correctAns]})\n`;
      } else {
        const studentOptText = !isNaN(studentAns) ? (mcq.options[studentAns] || 'Unknown') : 'No answer given';
        mcqFeedback += `- Q${idx+1}: ✗ Incorrect. Your answer: "${studentOptText}". Correct answer: "${mcq.options[correctAns]}"\n`;
      }
    });
  }

  const codingChallenges = event.codingChallenges || [];
  let codeFeedback = "\nCode Performance:\n";
  
  if (codingChallenges.length > 0) {
    totalScore += 60;
    
    const prompt = `Evaluate the following code submissions for a hackathon event titled "${event.title}".
Context/Event Rules: ${event.instructions || 'Standard programming rules apply.'}

You are acting as a strict automated Sandbox Execution Engine. I will provide the student's code alongside expected Test Cases.
You MUST mentally execute the code against EACH provided test case.
Your scoring logic:
1. For each problem, determine the ratio of passing test cases (e.g. 2/4 = 50% for that problem).
2. If NO test cases are provided, evaluate purely on logic, time complexity, and syntax.
3. Hardcoded solutions that bypass logic (e.g. if input=X return Y) MUST receive 0 score.

The student submitted the following solutions:
${codingChallenges.map((challenge, idx) => {
  const sub = codeSubmissions[idx] || { language: 'unanswered', code: 'No submission provided.' };
  let testCasesStr = 'No strict test cases provided. Evaluate purely via logic and code quality analysis.';
  if (challenge.testCases && challenge.testCases.length > 0) {
    testCasesStr = challenge.testCases.map((tc, i) => `Test Case ${i+1}:\nInput: ${tc.input}\nExpected: ${tc.expectedOutput}`).join('\n\n');
  }

  return `--- PROBLEM ${idx + 1}: ${challenge.questionTitle} ---
Statement: ${challenge.problemStatement}
Student's Language: ${sub.language}
Student Code:
${sub.code}

EVALUATION TEST CASES:
${testCasesStr}
`;
}).join('\n')}

Evaluate these code submissions collectively on a scale of 0 to 60. 
Return the output EXACTLY in this JSON format:
{
  "codeScore": <number between 0 and 60>,
  "codeFeedback": "<string detailing which test cases passed/failed and why>",
  "suggestions": "<string for improvement>"
}
`;

    const attemptEvaluation = async (modelName) => {
      return await ai.models.generateContent({ model: modelName, contents: prompt });
    };

    try {
      let response;
      try { response = await attemptEvaluation('gemini-3.1-flash-lite-preview'); }
      catch (e) {
        if (e.status === 429 || e.status === 503 || e.status === 404) response = await attemptEvaluation('gemini-1.5-flash-8b');
        else throw e;
      }
      
      let text = response?.response?.text() || '';
      console.log('--- AI RAW RESPONSE ---');
      console.log(text);
      console.log('-----------------------');
      
      const parsed = parseAIJSON(text);
      earnedScore += (parsed.codeScore || 0);
      codeFeedback += (parsed.codeFeedback || 'AI evaluated the code submissions.') + '\n';
      
      return {
        score: Math.min(10, Math.round((earnedScore / totalScore) * 10)),
        feedback: mcqFeedback + '\n' + codeFeedback,
        suggestions: parsed.suggestions || 'Keep practicing.'
      };
    } catch (err) {
      console.error('Code eval error:', err);
      codeFeedback += "Failed to auto-evaluate code cleanly via AI.\n";
      return {
        score: Math.round((earnedScore / totalScore) * 10) || 5,
        feedback: mcqFeedback + '\n' + codeFeedback,
        suggestions: 'Manually review code submissions.'
      };
    }
  }

  return {
    score: Math.min(10, Math.round((earnedScore / (totalScore || 10)) * 10)),
    feedback: mcqFeedback,
    suggestions: 'Review MCQ mistakes.'
  };
};

export const dryRunCode = async (challenge, language, code) => {
  if (!ai) return { error: 'AI service unavailable' };

  const testCasesStr = challenge.testCases?.map((tc, i) => 
    `Test Case ${i+1}:\nInput: ${tc.input}\nExpected: ${tc.expectedOutput}`
  ).join('\n\n') || 'No test cases provided.';

  const prompt = `Act as a strict, impartial code execution sandbox (Judge). 
Evaluate the following student code for the problem "${challenge.questionTitle}" against the provided test cases.

Language: ${language}
Problem Statement: ${challenge.problemStatement}

Student's Code:
${code}

TEST CASES:
${testCasesStr}

You MUST mentally execute the code against each test case. 
Return the evaluation EXACTLY in this JSON format:
{
  "totalCases": <number>,
  "passedCases": <number>,
  "diagnostic": "<brief summary of performance>",
  "results": [
    {
      "caseNumber": <number>,
      "status": "Passed" | "Failed",
      "actualOutput": "<what the code produced>",
      "expectedOutput": "<what was expected>",
      "message": "<reason for failure or 'Correct' if passed>"
    }
  ]
}
`;

  const attemptDryRun = async (modelName) => {
    return await ai.models.generateContent({ model: modelName, contents: prompt });
  };

  try {
    let response;
    try { response = await attemptDryRun('gemini-3.1-flash-lite-preview'); }
    catch (e) {
      if (e.status === 429 || e.status === 503 || e.status === 404) response = await attemptDryRun('gemini-1.5-flash-8b');
      else throw e;
    }

    let text = response?.response?.text() || '';
    return parseAIJSON(text);
  } catch (err) {
    console.error('Dry run error:', err);
    return { error: 'Failed to simulate code execution via AI.' };
  }
};

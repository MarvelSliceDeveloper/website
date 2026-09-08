import { generateContentWithAI } from './aiService';

/**
 * Clean JSON strings returned from LLM (removes markdown backticks if present)
 */
function parseLLMJson(text) {
  if (!text) return null;
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(clean);
  } catch (err) {
    // Try finding JSON array/object inside text
    const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/) || clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e) {
        console.error('Failed to parse matched JSON from AI:', e);
      }
    }
    console.error('Raw text could not be parsed as JSON:', clean);
    return null;
  }
}

/**
 * Fallback questions if AI API fails or is unconfigured
 */
function getFallbackQuestions(topic, count = 5) {
  const bank = [
    {
      question: "Which ratio measures a bank's liquidity risk by comparing liquid assets to short-term obligations under RBI guidelines?",
      options: ["Capital Adequacy Ratio (CAR)", "Liquidity Coverage Ratio (LCR)", "Net Interest Margin (NIM)", "Cash Reserve Ratio (CRR)"],
      answer_index: 1,
      explanation: "Liquidity Coverage Ratio (LCR) ensures banks maintain sufficient High-Quality Liquid Assets (HQLA) to survive a 30-day severe stress scenario."
    },
    {
      question: "A train running at 72 km/h crosses a 200m long platform in 25 seconds. What is the length of the train?",
      options: ["250 meters", "300 meters", "350 meters", "400 meters"],
      answer_index: 1,
      explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance covered in 25s = 20 * 25 = 500m. Train length = 500m - 200m = 300m."
    },
    {
      question: "Statements: All banks are financial institutions. Some financial institutions are NBFCs. Conclusion: I. Some banks are NBFCs. II. No bank is an NBFC.",
      options: ["Only I follows", "Only II follows", "Either I or II follows", "Neither I nor II follows"],
      answer_index: 2,
      explanation: "Since no direct relationship between Bank and NBFC is defined, both individual conclusions are uncertain, but they form a complementary pair (Either-Or)."
    },
    {
      question: "What is the maximum limit for UPI transaction per day set by NPCI for standard peer-to-peer transfers?",
      options: ["₹50,000", "₹1,000,000", "₹2,000,000", "₹5,000,000"],
      answer_index: 1,
      explanation: "The standard NPCI limit for normal UPI peer-to-peer transactions is ₹1 Lakh (₹100,000) per day."
    },
    {
      question: "In how many ways can 5 candidates be seated in a row such that 2 particular candidates never sit together?",
      options: ["48", "72", "96", "120"],
      answer_index: 1,
      explanation: "Total arrangements = 5! = 120. Arrangements where 2 candidates sit together = 4! * 2! = 48. Required = 120 - 48 = 72."
    }
  ];

  return Array.from({ length: count }, (_, i) => bank[i % bank.length]);
}

/**
 * Generate MCQ Questions using AI for Banking Mock Exams
 */
export async function generateMockExamQuestionsAI({ topic = 'Banking & Quantitative Aptitude', count = 5, difficulty = 'Medium' }) {
  const prompt = `You are an expert examiner preparing high-quality Banking Competitive Exam MCQ questions (like IBPS PO, SBI PO, RBI Grade B).
Generate exactly ${count} multiple-choice questions for topic: "${topic}" with difficulty level: "${difficulty}".

Output MUST be valid JSON only, formatted as an array of objects matching this exact structure:
[
  {
    "question": "Question text clear and detailed",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer_index": 0,
    "explanation": "Detailed step-by-step mathematical or logical explanation for why option A is correct."
  }
]

Requirements:
- Exactly 4 options per question.
- "answer_index" must be an integer between 0 and 3 corresponding to the correct option in "options".
- Include realistic numbers, financial terms, or logical puzzles suitable for Banking & Competitive exams.
- Return ONLY JSON string array, no extra intro or conversational text.`;

  try {
    const res = await generateContentWithAI(prompt, { temperature: 0.6 });
    const parsed = parseLLMJson(res.text);

    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate structure
      const valid = parsed.map(item => ({
        question: item.question || 'Untitled Question',
        options: Array.isArray(item.options) && item.options.length === 4
          ? item.options.map(String)
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        answer_index: typeof item.answer_index === 'number' && item.answer_index >= 0 && item.answer_index <= 3
          ? item.answer_index
          : 0,
        explanation: item.explanation || 'Solution step-by-step breakdown.'
      }));
      return { success: true, questions: valid, provider: res.provider, model: res.model };
    }
  } catch (err) {
    console.warn('AI question generation failed, using smart fallback:', err.message);
  }

  return {
    success: false,
    isFallback: true,
    questions: getFallbackQuestions(topic, count),
    message: 'AI provider unavailable or unconfigured. Applied offline question bank.'
  };
}

/**
 * Generate a subtle hint for a candidate taking a quiz
 */
export async function getQuestionHintAI({ question, options }) {
  const prompt = `You are an AI Banking Exam Tutor. A candidate is attempting this question:
Question: "${question}"
Options: ${options.map((opt, i) => `${String.fromCharCode(65 + i)}: ${opt}`).join(', ')}

Provide a concise, helpful 1-2 sentence hint or key formula to guide them toward solving this question.
CRITICAL RULE: DO NOT reveal the exact correct option letter or option index! Just guide their logic or mathematical steps.`;

  try {
    const res = await generateContentWithAI(prompt, { temperature: 0.5 });
    return { success: true, hint: res.text.trim() };
  } catch (err) {
    return {
      success: false,
      hint: "Focus on applying the core formula or eliminating obviously incorrect extremes."
    };
  }
}

/**
 * Generate detailed step-by-step explanation or answer student doubts
 */
export async function explainQuestionSolutionAI({ question, options, correctAnswerIndex, explanation, userQuestion = '' }) {
  const prompt = `You are a Senior Banking Exam Mentor explaining a solution to a student.

Question: "${question}"
Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}: ${opt}${i === correctAnswerIndex ? ' (CORRECT)' : ''}`).join('\n')}

Standard Solution Note: ${explanation}

${userQuestion ? `Student Specific Query: "${userQuestion}"` : 'Explain step-by-step why the correct answer is right and why the other options are wrong.'}

Provide a clear, encouraging, structured response in markdown. Use bullet points and step-by-step calculations if applicable.`;

  try {
    const res = await generateContentWithAI(prompt, { temperature: 0.6 });
    return { success: true, explanation: res.text.trim() };
  } catch (err) {
    return {
      success: false,
      explanation: `**Solution Explanation:**\n\nCorrect Option: **${String.fromCharCode(65 + (correctAnswerIndex || 0))}**\n\n${explanation || 'Review standard concepts for this topic.'}`
    };
  }
}

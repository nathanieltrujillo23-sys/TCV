import type { Lesson } from "./types";

export const emergencyFunds: Lesson = {
  id: "emergency-funds",
  number: 2,
  title: "Emergency funds",
  summary: "Why a cash cushion comes before most other goals, how large it might be, and where people usually keep it.",
  minutes: 7,
  tool: "savings",
  objectives: [
    "Explain what an emergency fund is for and what it is not for.",
    "Estimate a target from your essential monthly expenses.",
    "Describe why accessibility and safety matter more than return here.",
  ],
  sections: [
    {
      heading: "What it is for",
      paragraphs: [
        "An emergency fund is cash set aside for surprises that would otherwise go on a credit card or force you to sell investments at a bad time: a job loss, a medical bill, an urgent car or home repair.",
        "Planned costs, like holidays or an annual insurance premium, belong in a sinking fund instead. Keeping the two separate stops the emergency fund from quietly shrinking.",
      ],
    },
    {
      heading: "How much",
      paragraphs: [
        "A common guideline is three to six months of essential expenses: housing, utilities, food, insurance, transportation, and minimum debt payments. People with irregular income, a single income in the household, or dependents often aim for the higher end or beyond.",
        "Building it can take time. Many people start with a smaller first milestone, such as one month of essentials, then keep adding until they reach their full target.",
      ],
    },
    {
      heading: "Where it is kept",
      paragraphs: [
        "Because the money may be needed on short notice, it is usually kept somewhere stable and easy to reach, such as a savings account at a bank or credit union. Deposits at insured banks are protected by the FDIC, and at insured credit unions by the NCUA, up to set limits.",
        "Investments like stocks can fall in value right when you need the cash, so they are generally not used for this purpose. The goal of an emergency fund is safety and access, not growth.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: uneven freelance income",
    paragraphs: [
      "Priya is a freelance designer whose income varies month to month. Her essential expenses are $2,400 a month, so she sets a six month target: 6 x $2,400 = $14,400.",
      "She already has $2,000 saved. To reach $14,400 in 24 months without counting interest, she needs about $516.67 a month. In busy months she saves more, and in slow months she saves less but never skips entirely.",
    ],
  },
  keyTerms: [
    { term: "Emergency fund", definition: "Cash reserved for unexpected, necessary expenses or a loss of income." },
    { term: "Essential expenses", definition: "Costs you must keep paying no matter what, such as housing, food, and insurance." },
    { term: "Liquidity", definition: "How quickly an asset can be turned into cash without losing value." },
    { term: "FDIC insurance", definition: "Federal protection for deposits at insured banks, up to $250,000 per depositor, per insured bank, per ownership category." },
  ],
  quiz: [
    {
      question: "Essential expenses are $2,000 a month. What is a three month emergency fund target?",
      options: ["$2,000", "$4,000", "$6,000", "$24,000"],
      answer: 2,
      explanation: "Three months of essentials: 3 x $2,000 = $6,000.",
    },
    {
      question: "Which is generally considered best suited for holding an emergency fund?",
      options: ["A single company's stock", "An insured savings account", "Cryptocurrency", "A collectible"],
      answer: 1,
      explanation: "An insured savings account keeps the money stable and available when you need it.",
    },
    {
      question: "Which of these is an emergency fund expense?",
      options: ["Holiday gifts", "An annual streaming subscription", "An unexpected job loss", "Concert tickets"],
      answer: 2,
      explanation: "A job loss is unexpected and necessary to cover. The others are planned or optional.",
    },
  ],
};

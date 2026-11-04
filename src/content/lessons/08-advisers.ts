import type { Lesson } from "./types";

export const advisers: Lesson = {
  id: "working-with-an-adviser",
  number: 8,
  title: "How to work with a licensed professional",
  summary: "The different kinds of financial professionals, how to check their background, how they are paid, and what to ask.",
  minutes: 9,
  objectives: [
    "Tell investment advisers, brokers, and planners apart.",
    "Look up a professional's background using free public tools.",
    "Prepare questions about services, fees, and conflicts.",
  ],
  sections: [
    {
      heading: "Who does what",
      paragraphs: ["Titles vary, so registration and licensing matter more than a job title."],
      bullets: [
        "Investment advisers and their representatives are registered with the SEC or a state and owe clients a fiduciary duty.",
        "Brokers (registered representatives of broker-dealers) are registered with FINRA and must act in a retail customer's best interest when making recommendations, under the SEC's Regulation Best Interest.",
        "Certified Financial Planner (CFP) professionals hold a certification from the CFP Board, which sets its own standards.",
        "Accountants (CPAs) handle tax questions, and attorneys handle legal matters such as wills and trusts.",
      ],
    },
    {
      heading: "Check before you hire",
      paragraphs: [
        "Free tools show registrations, employment history, and disciplinary records: FINRA BrokerCheck for brokers, the SEC's Investment Adviser Public Disclosure site for advisers, and the CFP Board's verification tool for CFP professionals.",
      ],
    },
    {
      heading: "How they are paid",
      paragraphs: [
        "Common models include a flat or hourly fee, a percentage of assets managed, and commissions on products sold. Each creates different incentives. Firms that serve retail investors must give you a short relationship summary, Form CRS, describing services, fees, and conflicts of interest. Advisers also provide a brochure, Form ADV Part 2.",
      ],
    },
    {
      heading: "Questions to ask, and red flags",
      paragraphs: ["Useful questions include: Are you a fiduciary at all times? How are you paid, in dollars? What conflicts do you have? What happens if I want to leave?"],
      bullets: [
        "Promises of guaranteed or unusually high returns.",
        "Pressure to decide quickly.",
        "No registration you can verify.",
        "Vague answers about fees.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: choosing between two professionals",
    paragraphs: [
      "Jamie meets two professionals. Before the second meeting, Jamie looks both up: one appears on the SEC adviser site with a clean record, and the other appears on BrokerCheck with a disclosed customer complaint.",
      "Jamie asks each for their Form CRS and a written estimate of yearly costs in dollars, then compares services and conflicts side by side before deciding.",
    ],
  },
  keyTerms: [
    { term: "Fiduciary", definition: "Someone legally required to act in your best interest." },
    { term: "Form CRS", definition: "A short relationship summary of services, fees, and conflicts for retail investors." },
    { term: "Form ADV", definition: "An adviser's registration filing; Part 2 is the plain-language brochure." },
    { term: "BrokerCheck", definition: "FINRA's free tool for researching brokers and firms." },
    { term: "Conflict of interest", definition: "A situation where a professional could benefit from advice that is not best for you." },
  ],
  quiz: [
    {
      question: "Where can you check a broker's background for free?",
      options: ["FINRA BrokerCheck", "A social media profile", "A business card", "An online ad"],
      answer: 0,
      explanation: "BrokerCheck shows registrations, history, and disclosures.",
    },
    {
      question: "Which is a red flag?",
      options: ["Explaining fees in writing", "Guaranteeing high returns", "Giving you a Form CRS", "Answering questions about conflicts"],
      answer: 1,
      explanation: "No legitimate professional can guarantee high investment returns.",
    },
    {
      question: "What does Form CRS summarize?",
      options: ["Your credit score", "Services, fees, and conflicts of interest", "Tax brackets", "Stock prices"],
      answer: 1,
      explanation: "Form CRS is a short summary of the relationship, including costs and conflicts.",
    },
  ],
};

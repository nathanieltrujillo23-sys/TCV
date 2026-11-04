import type { Lesson } from "./types";

export const objectives: Lesson = {
  id: "financial-objectives",
  number: 7,
  title: "Setting financial objectives",
  summary: "Turning vague hopes into specific objectives with numbers and dates, and deciding what comes first.",
  minutes: 7,
  tool: "savings",
  objectives: [
    "Write an objective with an amount, a date, and a monthly plan.",
    "Group objectives by time horizon.",
    "Explain why objectives need regular review.",
  ],
  sections: [
    {
      heading: "From wish to objective",
      paragraphs: [
        "\"Save more\" is a wish. \"Save $6,000 for a car down payment by next June\" is an objective you can plan around. A common checklist is SMART: specific, measurable, achievable, relevant, and time-bound.",
      ],
    },
    {
      heading: "Sort by time horizon",
      paragraphs: ["The time until you need the money changes how people usually plan for it."],
      bullets: [
        "Short term, within about a year: an emergency fund, a trip, a new laptop.",
        "Medium term, one to five years: a car, a move, a wedding.",
        "Long term, more than five years: retirement, a home, education.",
      ],
    },
    {
      heading: "Decide what comes first",
      paragraphs: [
        "Most people have more objectives than money. Many frameworks put stability first, such as a starter emergency fund and high-interest debt, before longer-term goals. Writing down the trade-offs makes them visible instead of accidental.",
      ],
    },
    {
      heading: "Review and adjust",
      paragraphs: [
        "Income, costs, and priorities change. A short review every few months, or after a big life event, keeps objectives realistic. Adjusting a date or amount is part of the plan, not a failure.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: a down payment",
    paragraphs: [
      "Taylor wants $6,000 for a car down payment in 24 months. Ignoring interest, that is $6,000 / 24 = $250 a month.",
      "Taylor sets an automatic $250 transfer on each payday into a separate savings account and checks progress every quarter. When a raise arrives, the transfer goes up to $300, moving the finish date earlier.",
    ],
  },
  keyTerms: [
    { term: "SMART objective", definition: "Specific, measurable, achievable, relevant, and time-bound." },
    { term: "Time horizon", definition: "How long until you need the money." },
    { term: "Trade-off", definition: "Choosing one use of money means not using it for another." },
    { term: "Net worth", definition: "What you own minus what you owe." },
  ],
  quiz: [
    {
      question: "Which is a SMART objective?",
      options: ["Save more money", "Be better with money this year", "Save $3,000 for a trip by August", "Spend less on things"],
      answer: 2,
      explanation: "It has an amount and a deadline, so it can be planned and measured.",
    },
    {
      question: "To save $6,000 in 24 months without interest, how much per month?",
      options: ["$200", "$250", "$300", "$500"],
      answer: 1,
      explanation: "$6,000 / 24 = $250.",
    },
    {
      question: "Why review objectives regularly?",
      options: ["Because income, costs, and priorities change", "To make them harder", "It is required by banks", "Objectives never need review"],
      answer: 0,
      explanation: "Life changes, so objectives need adjusting to stay realistic.",
    },
  ],
};

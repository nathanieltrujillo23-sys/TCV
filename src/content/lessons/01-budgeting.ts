import type { Lesson } from "./types";

export const budgeting: Lesson = {
  id: "budgeting-cash-flow",
  number: 1,
  title: "Budgeting and cash flow",
  summary: "How money moves in and out each month, why tracking it matters, and a simple way to build a budget you can keep.",
  minutes: 8,
  publicSample: true,
  objectives: [
    "Calculate your monthly cash flow from income and expenses.",
    "Sort expenses into fixed, variable, and occasional costs.",
    "Build a starting budget and a routine to review it.",
  ],
  sections: [
    {
      heading: "Start with cash flow",
      paragraphs: [
        "Cash flow is the money left after expenses: net income (your pay after taxes and deductions) minus everything you spend in a month. Positive cash flow gives you room to save, invest, or pay down debt. Negative cash flow means you are covering the gap with savings or borrowing.",
        "Before setting any limits, track one full month of spending. Most people find that a few categories are larger than they expected. A budget built on real numbers is far easier to keep than one built on guesses.",
      ],
    },
    {
      heading: "Three kinds of expenses",
      paragraphs: ["Grouping expenses makes it clear which ones you can change quickly and which ones take longer to adjust."],
      bullets: [
        "Fixed: the same amount each month, such as rent, insurance, or a loan payment.",
        "Variable: changes month to month, such as groceries, fuel, and dining out.",
        "Occasional: predictable but not monthly, such as car registration, gifts, or annual subscriptions. Setting aside a little each month for these is called a sinking fund.",
      ],
    },
    {
      heading: "A starting framework",
      paragraphs: [
        "One widely used starting point is the 50/30/20 split: about half of net income to needs, about 30% to wants, and about 20% to savings and extra debt payments. It is a framework, not a rule. Cost of living, income, and goals change what works for each person.",
        "Whatever split you choose, decide on your savings amount first and move it automatically on payday. Spending from what remains is simpler than trying to save what is left at the end of the month.",
      ],
    },
    {
      heading: "Make it stick",
      paragraphs: [
        "Review the budget once a month. Compare what you planned with what happened, adjust the categories that were unrealistic, and look for one change to try next month. Small, repeated adjustments tend to last longer than drastic cuts.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: a first salaried job",
    paragraphs: [
      "Jordan, 22, takes home $3,200 a month. Fixed costs (rent, phone, insurance, transit pass) total $1,700, and a month of tracking shows variable spending of $900. Monthly cash flow is $3,200 - $1,700 - $900 = $600.",
      "The tracking also shows $310 a month across four streaming subscriptions and frequent food delivery. Jordan keeps two subscriptions, sets a weekly delivery limit, and moves $400 to savings on each payday, keeping the rest of the $600 as a buffer for occasional costs.",
    ],
  },
  keyTerms: [
    { term: "Net income", definition: "Pay after taxes and other deductions; the amount that reaches your account." },
    { term: "Cash flow", definition: "Net income minus expenses over a period, usually a month." },
    { term: "Fixed expense", definition: "A cost that stays the same from month to month." },
    { term: "Variable expense", definition: "A cost that changes depending on what you use or buy." },
    { term: "Sinking fund", definition: "Money set aside in small amounts for a known future expense." },
  ],
  quiz: [
    {
      question: "Your net pay is $3,000 a month and your expenses are $2,750. What is your monthly cash flow?",
      options: ["$250", "$3,000", "-$250", "$5,750"],
      answer: 0,
      explanation: "Cash flow is income minus expenses: $3,000 - $2,750 = $250.",
    },
    {
      question: "Which of these is usually a fixed expense?",
      options: ["Groceries", "Rent", "Dining out", "Fuel"],
      answer: 1,
      explanation: "Rent is typically the same each month. The others change with how much you use.",
    },
    {
      question: "Why track a full month of spending before setting a budget?",
      options: ["Banks require it", "To see where money actually goes", "To remove every want", "To raise your income"],
      answer: 1,
      explanation: "Real numbers show which categories matter, so the budget fits how you actually live.",
    },
  ],
};

import type { Lesson } from "./types";

export const debt: Lesson = {
  id: "debt",
  number: 3,
  title: "Understanding debt",
  summary: "What interest really costs, why minimum payments take so long, and two common ways people organize paying debt down.",
  minutes: 9,
  tool: "debt",
  objectives: [
    "Read an APR and estimate a month of interest.",
    "Explain why paying only the minimum keeps balances alive for years.",
    "Compare the avalanche and snowball payoff methods.",
  ],
  sections: [
    {
      heading: "Interest is the price of borrowing",
      paragraphs: [
        "The annual percentage rate (APR) is the yearly cost of borrowing. For a rough monthly figure, divide by 12: a 24% APR is about 2% a month, so a $1,000 balance adds about $20 of interest in a month.",
        "Each payment first covers that month's interest, and only the rest reduces the principal, the amount you actually borrowed. The smaller the payment, the more of it goes to interest.",
      ],
    },
    {
      heading: "The minimum payment trap",
      paragraphs: [
        "Card minimums are designed to keep the account current, not to clear it quickly. On high-rate balances, a payment close to the minimum can stretch repayment over years and add up to a large share of the original balance in interest.",
      ],
    },
    {
      heading: "Two common payoff methods",
      paragraphs: ["Both start the same way: make every minimum payment on time, then direct any extra money to one debt at a time."],
      bullets: [
        "Avalanche: put extra money toward the highest interest rate first. This keeps total interest as low as possible.",
        "Snowball: put extra money toward the smallest balance first. Clearing whole accounts quickly can help people stay motivated.",
      ],
    },
    {
      heading: "Credit basics",
      paragraphs: [
        "Payment history and how much of your available credit you use (utilization) are two of the biggest factors in common credit scoring models. Paying on time and keeping balances low relative to limits both help over time.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: one card, two payment choices",
    paragraphs: [
      "Marcus has $1,200 on a card at 24% APR and stops adding new charges. Paying $40 a month, it takes 47 months to clear and costs $650.93 in interest.",
      "Paying $100 a month instead, it clears in 14 months with $185.98 of interest. The extra $60 a month saves more than $460 and almost three years. (Figures from the Debt payoff tool, assuming interest is charged monthly at APR/12.)",
    ],
  },
  keyTerms: [
    { term: "APR", definition: "Annual percentage rate; the yearly cost of borrowing, including some fees." },
    { term: "Principal", definition: "The amount borrowed, not counting interest." },
    { term: "Minimum payment", definition: "The smallest payment that keeps an account in good standing." },
    { term: "Avalanche method", definition: "Paying extra toward the highest interest rate first." },
    { term: "Snowball method", definition: "Paying extra toward the smallest balance first." },
    { term: "Credit utilization", definition: "Balances owed as a share of total available credit." },
  ],
  quiz: [
    {
      question: "The avalanche method puts extra payments toward which debt first?",
      options: ["The smallest balance", "The highest interest rate", "The newest account", "The lowest interest rate"],
      answer: 1,
      explanation: "Avalanche targets the highest rate first, which minimizes total interest.",
    },
    {
      question: "Roughly how much interest does $1,000 at 24% APR add in one month?",
      options: ["$2", "$20", "$24", "$240"],
      answer: 1,
      explanation: "24% a year is about 2% a month, and 2% of $1,000 is $20.",
    },
    {
      question: "What usually happens when you pay only the minimum on a high-rate card?",
      options: ["The debt clears within a year", "Most of each payment goes to interest and payoff takes much longer", "The rate drops automatically", "Interest stops growing"],
      answer: 1,
      explanation: "Small payments mostly cover interest, so the principal shrinks slowly.",
    },
  ],
};

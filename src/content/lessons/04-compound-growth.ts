import type { Lesson } from "./types";

export const compoundGrowth: Lesson = {
  id: "compound-growth",
  number: 4,
  title: "How compound growth works",
  summary: "How growth builds on itself over time, why time matters as much as the amount, and how to read a compound growth chart.",
  minutes: 8,
  tool: "compound",
  publicSample: true,
  objectives: [
    "Explain the difference between simple and compound growth.",
    "Use the rule of 72 to estimate doubling time.",
    "Describe how time, rate, and inflation shape results.",
  ],
  sections: [
    {
      heading: "Growth on top of growth",
      paragraphs: [
        "With simple interest, you earn only on the original amount. With compounding, earnings are added to the balance, and future earnings are calculated on that larger balance. Over long periods the difference becomes large.",
        "That is why compound growth charts curve upward: early years look flat, and later years rise faster because the base keeps getting bigger.",
      ],
    },
    {
      heading: "The rule of 72",
      paragraphs: [
        "A quick estimate of how long it takes money to double: divide 72 by the annual rate. At 6%, about 12 years. At 8%, about 9 years. It is an approximation, and it assumes the rate stays the same, which real investments do not guarantee.",
      ],
    },
    {
      heading: "Time often matters most",
      paragraphs: [
        "Starting earlier gives each dollar more years to compound. Increasing the amount you save also helps, but extra years at the end of a long period add more than extra years at the start, because the balance is largest then.",
      ],
    },
    {
      heading: "Inflation and real growth",
      paragraphs: [
        "Inflation is the general rise in prices over time. If a balance grows 6% in a year while prices rise 3%, its purchasing power grew by roughly 3%. That difference is called the real return. Returns on investments vary from year to year and can be negative.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: ten years earlier",
    paragraphs: [
      "Two people each save $200 a month at an assumed 6% annual return, compounded monthly. One starts at 25, the other at 35, and both stop at 65.",
      "The earlier saver contributes $96,000 over 40 years and ends with about $398,298. The later saver contributes $72,000 over 30 years and ends with about $200,903. An extra $24,000 of deposits produced almost twice the ending balance. (Illustration from the Compound growth tool; actual returns are not fixed or guaranteed.)",
    ],
  },
  keyTerms: [
    { term: "Compound growth", definition: "Earning returns on both your deposits and the returns already earned." },
    { term: "Simple interest", definition: "Interest earned only on the original amount." },
    { term: "Rule of 72", definition: "72 divided by the annual rate estimates the years to double." },
    { term: "Inflation", definition: "The general rise in prices, which lowers what a dollar can buy." },
    { term: "Real return", definition: "Return after accounting for inflation." },
  ],
  quiz: [
    {
      question: "Using the rule of 72, how long does money take to double at 8% a year?",
      options: ["About 6 years", "About 9 years", "About 12 years", "About 18 years"],
      answer: 1,
      explanation: "72 / 8 = 9 years, as an estimate.",
    },
    {
      question: "What does compounding mean?",
      options: ["Earning returns on previous returns as well as deposits", "Earning a fixed amount each year", "Paying interest twice", "Avoiding all risk"],
      answer: 0,
      explanation: "Compounding adds earnings to the base, so later earnings grow on a larger amount.",
    },
    {
      question: "A balance grows 5% in a year while prices rise 3%. Roughly what is the real return?",
      options: ["8%", "5%", "2%", "-3%"],
      answer: 2,
      explanation: "Real return is roughly the nominal return minus inflation: 5% - 3% = 2%.",
    },
  ],
};

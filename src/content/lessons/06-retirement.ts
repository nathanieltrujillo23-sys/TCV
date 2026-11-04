import type { Lesson } from "./types";

export const retirement: Lesson = {
  id: "retirement-accounts",
  number: 6,
  title: "Retirement account basics",
  summary: "How workplace plans and IRAs differ, what traditional and Roth mean for taxes, and how an employer match works.",
  minutes: 10,
  tool: "retirement",
  objectives: [
    "Tell the difference between workplace plans and IRAs.",
    "Compare traditional and Roth tax treatment.",
    "Calculate an employer match from a plan's formula.",
  ],
  sections: [
    {
      heading: "Two families of accounts",
      paragraphs: [
        "Workplace plans, such as a 401(k) or 403(b), are offered through an employer and funded by payroll deductions. Individual retirement accounts (IRAs) are opened on your own at a financial institution.",
        "The account is a container with tax rules. The investments inside it, such as funds, are chosen separately, and their value can rise or fall.",
      ],
    },
    {
      heading: "Traditional and Roth",
      paragraphs: ["Many plans and IRAs come in two tax versions."],
      bullets: [
        "Traditional: contributions are generally made before tax or may be deductible, growth is tax-deferred, and withdrawals are taxed as income.",
        "Roth: contributions are made with after-tax money, and qualified withdrawals, including growth, are tax-free.",
      ],
    },
    {
      heading: "Employer match",
      paragraphs: [
        "Some employers add money based on what you contribute. A common formula is \"50% of your contributions up to 6% of salary\". Matched money may follow a vesting schedule, meaning you keep it in full only after a certain length of employment.",
      ],
    },
    {
      heading: "Limits and early withdrawals",
      paragraphs: [
        "The IRS sets annual contribution limits, and they change over time, so check irs.gov for the current year. Withdrawals before age 59½ may be taxed and face an additional 10% tax unless an exception applies. Tax rules are detailed; a tax professional can explain how they apply to you.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: reading a match formula",
    paragraphs: [
      "Sam earns $50,000. The employer matches 50% of contributions up to 6% of salary.",
      "If Sam contributes 6% ($3,000), the employer adds 50% of that, $1,500. If Sam contributes 3% ($1,500), the match is $750. Contributing 10% ($5,000) still earns a $1,500 match, because the match stops at 6% of salary.",
    ],
  },
  keyTerms: [
    { term: "401(k)", definition: "A workplace retirement plan funded through payroll deductions." },
    { term: "IRA", definition: "An individual retirement account you open yourself." },
    { term: "Traditional account", definition: "Contributions generally pre-tax or deductible; withdrawals taxed as income." },
    { term: "Roth account", definition: "After-tax contributions; qualified withdrawals are tax-free." },
    { term: "Employer match", definition: "Money an employer adds based on your contributions, under a set formula." },
    { term: "Vesting", definition: "The schedule for when employer contributions become fully yours." },
  ],
  quiz: [
    {
      question: "In a Roth account, how are qualified withdrawals generally taxed?",
      options: ["As ordinary income", "They are tax-free", "At a flat 10%", "Only the contributions are taxed"],
      answer: 1,
      explanation: "Roth contributions use after-tax money, so qualified withdrawals are tax-free.",
    },
    {
      question: "Salary $40,000, match is 50% up to 6%, you contribute 6%. What is the match?",
      options: ["$600", "$1,200", "$2,400", "$3,600"],
      answer: 1,
      explanation: "6% of $40,000 is $2,400, and 50% of that is $1,200.",
    },
    {
      question: "Where should you check the current annual contribution limits?",
      options: ["A social media post", "The IRS at irs.gov", "Last year's tax return", "They never change"],
      answer: 1,
      explanation: "The IRS publishes the limits, and they change over time.",
    },
  ],
};

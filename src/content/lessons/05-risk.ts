import type { Lesson } from "./types";

export const risk: Lesson = {
  id: "risk-diversification",
  number: 5,
  title: "Risk and diversification",
  summary: "What investment risk means, how different kinds of assets behave, and why spreading money out changes outcomes.",
  minutes: 9,
  objectives: [
    "Describe risk as uncertainty and volatility, not just loss.",
    "Explain the general relationship between risk and potential return.",
    "Explain what diversification does and what it cannot do.",
  ],
  sections: [
    {
      heading: "What risk means",
      paragraphs: [
        "In investing, risk is the chance that results differ from what you expect, including the chance of losing money. Volatility describes how much and how quickly a value moves up and down.",
        "Historically, assets with the potential for higher long-term returns have also tended to swing more in the short term. There is no investment with high expected returns and no risk.",
      ],
    },
    {
      heading: "Broad types of assets",
      paragraphs: ["Each type behaves differently. These are general patterns, not promises."],
      bullets: [
        "Cash and insured savings: stable value, lower expected growth, and exposure to inflation.",
        "Bonds: loans to governments or companies that pay interest; prices move with interest rates and credit quality.",
        "Stocks: partial ownership of companies; higher long-term growth potential with larger and more frequent swings.",
      ],
    },
    {
      heading: "Diversification",
      paragraphs: [
        "Diversification means spreading money across many investments, sectors, or asset types so that one problem has a smaller effect on the whole. Funds that hold hundreds of companies are one common way people diversify.",
        "Diversification lowers the impact of any single investment, but it does not remove the risk of the overall market falling and it does not guarantee a profit.",
      ],
    },
    {
      heading: "Time horizon and tolerance",
      paragraphs: [
        "Time horizon is when you will need the money. Risk tolerance is how much fluctuation you can accept, both financially and emotionally. Money needed within months is exposed to short-term swings in a way that money needed decades from now is not. A licensed professional can help match choices to your own situation.",
      ],
    },
  ],
  caseStudy: {
    title: "Case: everything in one company",
    paragraphs: [
      "Alex works at a fast-growing company and has put all savings into its stock. Alex's paycheck, bonus, and savings now depend on the same company.",
      "If the company has a bad year, Alex could face lower savings and a job risk at the same time. That overlap is called concentration risk. Holding a mix of investments is one way people reduce it.",
    ],
  },
  keyTerms: [
    { term: "Volatility", definition: "How much and how quickly a value moves up and down." },
    { term: "Asset class", definition: "A broad group of investments that behave similarly, such as stocks, bonds, or cash." },
    { term: "Diversification", definition: "Spreading money across many investments to reduce the impact of any one." },
    { term: "Concentration risk", definition: "Risk from having too much depend on a single investment or source." },
    { term: "Time horizon", definition: "How long until the money is needed." },
  ],
  quiz: [
    {
      question: "What does diversification do?",
      options: ["Guarantees a profit", "Removes all market risk", "Reduces the impact of any single investment", "Raises returns every year"],
      answer: 2,
      explanation: "Diversification limits the damage from one holding, but market-wide risk and losses remain possible.",
    },
    {
      question: "Money needed within six months is generally considered best kept where?",
      options: ["A single growth stock", "Cash or an insured savings account", "A long-term bond fund", "Options contracts"],
      answer: 1,
      explanation: "Short time horizons leave little time to recover from a drop, so stable, accessible places are common.",
    },
    {
      question: "Which is an example of concentration risk?",
      options: ["Holding a broad index fund", "Keeping all savings in your employer's stock", "Having an emergency fund", "Paying debts on time"],
      answer: 1,
      explanation: "Your job and savings would both depend on one company.",
    },
  ],
};

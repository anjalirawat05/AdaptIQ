// 15 hand-labeled interview answers used to evaluate scoreAnswer() against human judgment.
// humanScore reflects what a reasonable human interviewer would give on the same 1-5 rubric
// used by the AI (correctness, depth, communication). Deliberately spans strong, weak,
// off-topic, confidently-wrong, generic, and rambling answers so the eval isn't cherry-picked.
module.exports = [
  {
    id: 1,
    question: "Explain how React's virtual DOM improves performance.",
    candidateAnswer:
      "React keeps a virtual DOM and diffs it against the previous tree using reconciliation, batching the minimal real DOM mutations needed instead of re-rendering everything. This avoids expensive layout/reflow on every change, though the diffing itself has a cost, so large lists still need keys and windowing.",
    humanScore: { correctness: 5, depth: 5, communication: 5 }
  },
  {
    id: 2,
    question: "Explain how React's virtual DOM improves performance.",
    candidateAnswer: "It makes React faster because it's virtual and doesn't touch the real DOM as much.",
    humanScore: { correctness: 2, depth: 1, communication: 2 }
  },
  {
    id: 3,
    question: "Explain how React's virtual DOM improves performance.",
    candidateAnswer: "I really like pizza and I think React is a cool word. Not sure what DOM means honestly.",
    humanScore: { correctness: 1, depth: 1, communication: 1 }
  },
  {
    id: 4,
    question: "What is the difference between var, let, and const in JavaScript?",
    candidateAnswer: "var is function-scoped and can be redeclared, let and const are block-scoped, and const can't be reassigned.",
    humanScore: { correctness: 4, depth: 2, communication: 3 }
  },
  {
    id: 5,
    question: "Tell me about a time you disagreed with a teammate and how you resolved it.",
    candidateAnswer:
      "During a group project, a teammate wanted to skip writing tests to hit the deadline faster. I disagreed because we'd already been burned by a regression the previous sprint. I proposed we write tests only for the two riskiest modules instead of all of them, as a compromise, and showed him the previous incident log to make the case concrete. He agreed, we shipped on time, and caught a bug in one of those two modules before release.",
    humanScore: { correctness: 5, depth: 5, communication: 4 }
  },
  {
    id: 6,
    question: "Tell me about a time you disagreed with a teammate and how you resolved it.",
    candidateAnswer: "I don't really remember a specific time, I usually just go along with the team.",
    humanScore: { correctness: 2, depth: 1, communication: 2 }
  },
  {
    id: 7,
    question: "Explain closures in JavaScript.",
    candidateAnswer:
      "A closure is when a function is stored in a global variable so it can be accessed from anywhere in the file, which makes it faster because the browser doesn't have to look up the scope chain each time.",
    humanScore: { correctness: 1, depth: 2, communication: 4 }
  },
  {
    id: 8,
    question: "How would you optimize a slow SQL query?",
    candidateAnswer:
      "so like first you check if indexes exist and stuff and then also maybe the query is doing a join that's bad so you rewrite it or you cache it somewhere idk depends honestly there's a lot of ways like EXPLAIN can show you stuff too and then you fix whatever it says roughly",
    humanScore: { correctness: 3, depth: 3, communication: 1 }
  },
  {
    id: 9,
    question: "Describe a time you took ownership of a project or led a team.",
    candidateAnswer:
      "In my final year project, our original tech lead dropped the course, so I took over coordinating the remaining three members. I split the backend into clear API contracts everyone could build against in parallel, ran short daily check-ins to catch blockers early, and personally took the riskiest integration piece (payment webhook handling) since I had the most context. We delivered a week early and I documented the API so the next batch of students could extend it.",
    humanScore: { correctness: 5, depth: 4, communication: 5 }
  },
  {
    id: 10,
    question: "What is the time complexity of binary search, and why?",
    candidateAnswer: "It's O(log n) because you cut the search space in half each time.",
    humanScore: { correctness: 4, depth: 2, communication: 4 }
  },
  {
    id: 11,
    question: "Why do you want to work here?",
    candidateAnswer: "I'm a hard worker, a team player, and I'm passionate about technology and making an impact.",
    humanScore: { correctness: 2, depth: 1, communication: 3 }
  },
  {
    id: 12,
    question: "How does garbage collection work in JavaScript's V8 engine?",
    candidateAnswer:
      "V8 uses generational GC: a young generation (Scavenger, using Cheney's semi-space copying algorithm) for short-lived objects promoted after surviving two minor GC cycles, and a mark-compact old generation collector with incremental and concurrent marking plus lazy sweeping to reduce main-thread pause times, further optimized by write barriers tracking old-to-young references.",
    humanScore: { correctness: 5, depth: 5, communication: 2 }
  },
  {
    id: 13,
    question: "Tell me about a mistake you made at work and what you learned from it.",
    candidateAnswer:
      "I once pushed a schema migration directly to production without a staging test because I was confident it was a trivial change - it locked a heavily-used table for several minutes during peak traffic. I learned to never skip staging regardless of how small a change looks, and afterward I set up a required staging-deploy step in our CI pipeline so it couldn't happen again even if someone forgot.",
    humanScore: { correctness: 5, depth: 4, communication: 4 }
  },
  {
    id: 14,
    question: "What is the difference between == and === in JavaScript?",
    candidateAnswer: "== compares values after type coercion, === compares both value and type without coercion.",
    humanScore: { correctness: 4, depth: 2, communication: 4 }
  },
  {
    id: 15,
    question: "How would you design a rate limiter for an API?",
    candidateAnswer: "I don't know.",
    humanScore: { correctness: 1, depth: 1, communication: 1 }
  }
]

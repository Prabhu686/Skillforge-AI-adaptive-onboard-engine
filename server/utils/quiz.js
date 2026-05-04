// Question bank keyed by skill (lowercase)
const QUESTION_BANK = {
  // JavaScript
  "javascript": [
    { q: "What is the difference between let, const, and var in JavaScript?", a: "var is function-scoped and hoisted. let and const are block-scoped. const cannot be reassigned after declaration." },
    { q: "What is a closure in JavaScript?", a: "A closure is a function that retains access to its outer scope variables even after the outer function has returned." },
    { q: "What is the event loop in JavaScript?", a: "The event loop is a mechanism that handles asynchronous callbacks by continuously checking the call stack and the callback queue, executing tasks when the stack is empty." },
    { q: "What is the difference between == and === in JavaScript?", a: "== checks value equality with type coercion. === checks both value and type without coercion." },
  ],
  "react": [
    { q: "What is the virtual DOM in React?", a: "The virtual DOM is a lightweight in-memory representation of the real DOM. React uses it to compute the minimal set of changes needed before updating the actual DOM." },
    { q: "What is the difference between state and props in React?", a: "Props are read-only inputs passed from parent to child. State is mutable data managed within a component that triggers re-renders when changed." },
    { q: "What are React hooks?", a: "Hooks are functions like useState and useEffect that let you use state and lifecycle features in functional components without writing a class." },
    { q: "What is useEffect used for in React?", a: "useEffect is used to perform side effects in functional components such as data fetching, subscriptions, or manually changing the DOM after render." },
  ],
  "node.js": [
    { q: "What is the Node.js event-driven architecture?", a: "Node.js uses a single-threaded event loop with non-blocking I/O. Instead of waiting for operations to complete, it registers callbacks and continues executing other code." },
    { q: "What is the difference between require and import in Node.js?", a: "require is CommonJS syntax used in Node.js by default. import is ES module syntax. Both load modules but have different scoping and loading behaviour." },
    { q: "What is middleware in Express.js?", a: "Middleware are functions that have access to the request and response objects and the next function. They can execute code, modify the request or response, or end the request-response cycle." },
  ],
  "python": [
    { q: "What is the difference between a list and a tuple in Python?", a: "Lists are mutable and defined with square brackets. Tuples are immutable and defined with parentheses. Tuples are faster and used for fixed data." },
    { q: "What are Python decorators?", a: "Decorators are functions that wrap another function to extend its behaviour without modifying it. They use the @ syntax." },
    { q: "What is the GIL in Python?", a: "The Global Interpreter Lock is a mutex that allows only one thread to execute Python bytecode at a time, limiting true multi-threading for CPU-bound tasks." },
  ],
  "sql": [
    { q: "What is the difference between INNER JOIN and LEFT JOIN?", a: "INNER JOIN returns only rows where there is a match in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right, with NULLs where there is no match." },
    { q: "What is database indexing?", a: "An index is a data structure that improves the speed of data retrieval on a table at the cost of additional storage and slower writes." },
    { q: "What is the difference between WHERE and HAVING?", a: "WHERE filters rows before grouping. HAVING filters groups after a GROUP BY clause has been applied." },
  ],
  "mongodb": [
    { q: "What is the difference between SQL and MongoDB?", a: "SQL is a relational database using tables and rows with a fixed schema. MongoDB is a NoSQL document database storing JSON-like documents with a flexible schema." },
    { q: "What is an index in MongoDB?", a: "An index in MongoDB is a special data structure that stores a small portion of the collection's data in an easy-to-traverse form to speed up queries." },
  ],
  "docker": [
    { q: "What is the difference between a Docker image and a container?", a: "An image is a read-only template with instructions for creating a container. A container is a runnable instance of an image." },
    { q: "What is a Dockerfile?", a: "A Dockerfile is a text file containing instructions to build a Docker image, specifying the base image, dependencies, and commands to run." },
  ],
  "aws": [
    { q: "What is the difference between EC2 and Lambda?", a: "EC2 provides virtual machines where you manage the server. Lambda is serverless and runs code in response to events without managing infrastructure." },
    { q: "What is S3 used for?", a: "S3 is Amazon's object storage service used to store and retrieve any amount of data such as files, images, backups, and static website assets." },
  ],
  "machine learning": [
    { q: "What is the difference between supervised and unsupervised learning?", a: "Supervised learning trains on labelled data to predict outputs. Unsupervised learning finds patterns in unlabelled data without predefined outputs." },
    { q: "What is overfitting in machine learning?", a: "Overfitting occurs when a model learns the training data too well including noise, causing poor performance on new unseen data." },
    { q: "What is the bias-variance tradeoff?", a: "Bias is error from wrong assumptions causing underfitting. Variance is error from sensitivity to training data causing overfitting. The tradeoff is finding the right model complexity." },
  ],
  "typescript": [
    { q: "What is the difference between TypeScript and JavaScript?", a: "TypeScript is a superset of JavaScript that adds static type checking. It compiles to plain JavaScript and helps catch errors at compile time rather than runtime." },
    { q: "What are TypeScript generics?", a: "Generics allow you to write reusable functions and classes that work with any type while still maintaining type safety." },
  ],
  "git": [
    { q: "What is the difference between git merge and git rebase?", a: "Merge combines branches by creating a new merge commit preserving history. Rebase moves commits onto another branch creating a linear history." },
    { q: "What is git stash?", a: "Git stash temporarily saves uncommitted changes so you can switch branches and come back to your work later." },
  ],
  "css": [
    { q: "What is the CSS box model?", a: "The box model describes how elements are rendered with content, padding, border, and margin layers from inside to outside." },
    { q: "What is the difference between flexbox and CSS grid?", a: "Flexbox is one-dimensional for laying out items in a row or column. Grid is two-dimensional for creating complex layouts with rows and columns simultaneously." },
  ],
  "java": [
    { q: "What is the difference between an abstract class and an interface in Java?", a: "An abstract class can have method implementations and state. An interface defines a contract with only abstract methods, though Java 8 allows default methods." },
    { q: "What is garbage collection in Java?", a: "Garbage collection is the automatic process of reclaiming memory occupied by objects that are no longer referenced, managed by the JVM." },
  ],
  "devops": [
    { q: "What is CI/CD?", a: "CI stands for Continuous Integration, automatically building and testing code on every commit. CD stands for Continuous Delivery or Deployment, automatically releasing tested code to production." },
    { q: "What is infrastructure as code?", a: "Infrastructure as code is the practice of managing and provisioning infrastructure through machine-readable configuration files rather than manual processes." },
  ],
  "general": [
    { q: "What is REST API?", a: "REST is an architectural style for APIs using HTTP methods like GET, POST, PUT, DELETE to perform operations on resources identified by URLs." },
    { q: "What is the difference between synchronous and asynchronous programming?", a: "Synchronous code executes line by line and blocks until each operation completes. Asynchronous code allows other operations to run while waiting for a task to finish." },
    { q: "What is object-oriented programming?", a: "OOP is a programming paradigm based on objects that contain data and methods. Its four pillars are encapsulation, inheritance, polymorphism, and abstraction." },
    { q: "What is a RESTful API?", a: "A RESTful API follows REST principles using stateless HTTP requests, standard methods, and resource-based URLs to enable communication between client and server." },
  ],
};

// Normalise skill name to bank key
function normaliseSkill(skill) {
  const s = skill.toLowerCase().trim();
  if (s.includes("react"))      return "react";
  if (s.includes("node"))       return "node.js";
  if (s.includes("javascript") || s === "js") return "javascript";
  if (s.includes("typescript") || s === "ts") return "typescript";
  if (s.includes("python"))     return "python";
  if (s.includes("sql") && !s.includes("nosql")) return "sql";
  if (s.includes("mongo"))      return "mongodb";
  if (s.includes("docker"))     return "docker";
  if (s.includes("aws") || s.includes("amazon")) return "aws";
  if (s.includes("machine learning") || s.includes("ml")) return "machine learning";
  if (s.includes("git"))        return "git";
  if (s.includes("css"))        return "css";
  if (s.includes("java") && !s.includes("javascript")) return "java";
  if (s.includes("devops") || s.includes("ci/cd")) return "devops";
  return null;
}

// Pick N unique questions from matched skills + fallback to general
function generateQuiz(skills = [], count = 10) {
  const used = new Set();
  const questions = [];

  // Shuffle helper
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  // Collect from matched skills first
  const keys = skills.map(normaliseSkill).filter(Boolean);
  const uniqueKeys = [...new Set(keys)];

  for (const key of shuffle(uniqueKeys)) {
    const pool = QUESTION_BANK[key] || [];
    for (const item of shuffle([...pool])) {
      const id = key + item.q;
      if (!used.has(id)) {
        used.add(id);
        questions.push({ skill: key, question: item.q, answer: item.a });
        if (questions.length >= count) break;
      }
    }
    if (questions.length >= count) break;
  }

  // Fill remaining from general
  if (questions.length < count) {
    for (const item of shuffle([...QUESTION_BANK.general])) {
      const id = "general" + item.q;
      if (!used.has(id)) {
        used.add(id);
        questions.push({ skill: "general", question: item.q, answer: item.a });
        if (questions.length >= count) break;
      }
    }
  }

  return questions.slice(0, count);
}

// Evaluate answer — keyword overlap scoring
function evaluateAnswer(userAnswer, correctAnswer) {
  if (!userAnswer || userAnswer.trim().length < 3) return { correct: false, score: 0 };

  const keywords = correctAnswer.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3);

  const userWords = userAnswer.toLowerCase();
  const hits = keywords.filter(k => userWords.includes(k)).length;
  const score = keywords.length > 0 ? Math.round((hits / keywords.length) * 100) : 0;
  const correct = score >= 35;

  return { correct, score };
}

module.exports = { generateQuiz, evaluateAnswer };

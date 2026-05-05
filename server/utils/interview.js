const { detectDomain } = require("./insights");

const QUESTION_BANK = {
  Frontend: [
    { skill: "React", difficulty: "Easy", question: "What is the virtual DOM and why does React use it?", idealAnswer: "The virtual DOM is a lightweight copy of the actual DOM. React uses it to optimize updates by comparing changes and only updating what's necessary, improving performance." },
    { skill: "JavaScript", difficulty: "Medium", question: "Explain closures in JavaScript with an example.", idealAnswer: "A closure is when a function retains access to variables from its outer scope even after the outer function has returned. Example: function outer() { let count = 0; return function() { return ++count; } }" },
    { skill: "CSS", difficulty: "Easy", question: "What is the difference between flexbox and grid?", idealAnswer: "Flexbox is one-dimensional (row or column), ideal for component layouts. Grid is two-dimensional (rows and columns), better for page-level layouts." },
    { skill: "TypeScript", difficulty: "Hard", question: "What are generics in TypeScript and when would you use them?", idealAnswer: "Generics allow you to write reusable code that works with multiple types. Example: function identity<T>(arg: T): T { return arg; }. Used for type-safe collections and utilities." },
  ],
  Backend: [
    { skill: "Node.js", difficulty: "Easy", question: "What is the event loop in Node.js?", idealAnswer: "The event loop handles asynchronous operations by processing callbacks from the event queue, allowing non-blocking I/O operations." },
    { skill: "Express", difficulty: "Medium", question: "How do you handle errors in Express middleware?", idealAnswer: "Use error-handling middleware with 4 parameters: (err, req, res, next). Place it after all routes. Call next(err) to pass errors to it." },
    { skill: "REST API", difficulty: "Medium", question: "What are the main HTTP methods and their purposes?", idealAnswer: "GET (retrieve), POST (create), PUT (update/replace), PATCH (partial update), DELETE (remove). GET and DELETE are idempotent." },
    { skill: "Authentication", difficulty: "Hard", question: "Explain JWT authentication flow.", idealAnswer: "User logs in → server validates credentials → generates JWT with payload and secret → client stores token → client sends token in Authorization header → server verifies signature and extracts payload." },
  ],
  Database: [
    { skill: "SQL", difficulty: "Easy", question: "What is the difference between INNER JOIN and LEFT JOIN?", idealAnswer: "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table and matching rows from the right, with NULLs for non-matches." },
    { skill: "MongoDB", difficulty: "Medium", question: "What is the difference between SQL and NoSQL databases?", idealAnswer: "SQL uses structured tables with fixed schemas and ACID transactions. NoSQL uses flexible documents/key-value pairs, scales horizontally, and prioritizes availability over consistency." },
    { skill: "Indexing", difficulty: "Hard", question: "How do database indexes improve query performance?", idealAnswer: "Indexes create a sorted data structure (like B-tree) that allows fast lookups without scanning the entire table. Trade-off: faster reads but slower writes and more storage." },
  ],
  DevOps: [
    { skill: "Docker", difficulty: "Easy", question: "What is the difference between a Docker image and a container?", idealAnswer: "An image is a read-only template with application code and dependencies. A container is a running instance of an image with its own filesystem and processes." },
    { skill: "Kubernetes", difficulty: "Hard", question: "Explain the role of a Kubernetes Pod.", idealAnswer: "A Pod is the smallest deployable unit in Kubernetes, containing one or more containers that share network and storage. It represents a single instance of an application." },
    { skill: "CI/CD", difficulty: "Medium", question: "What are the key stages of a CI/CD pipeline?", idealAnswer: "Build (compile code), Test (run automated tests), Deploy (push to staging/production), Monitor (track performance and errors)." },
  ],
  AI: [
    { skill: "Machine Learning", difficulty: "Easy", question: "What is overfitting and how do you prevent it?", idealAnswer: "Overfitting is when a model learns training data too well, including noise, and performs poorly on new data. Prevent with regularization, cross-validation, and more training data." },
    { skill: "Neural Networks", difficulty: "Hard", question: "Explain backpropagation in neural networks.", idealAnswer: "Backpropagation calculates gradients of the loss function with respect to each weight by applying the chain rule backward through the network, enabling gradient descent optimization." },
    { skill: "NLP", difficulty: "Medium", question: "What is the attention mechanism in transformers?", idealAnswer: "Attention allows the model to focus on relevant parts of the input when processing each token, computing weighted relationships between all tokens rather than processing sequentially." },
  ],
  General: [
    { skill: "Algorithms", difficulty: "Easy", question: "What is Big-O notation?", idealAnswer: "Big-O describes the upper bound of an algorithm's time or space complexity as input size grows. Example: O(n) is linear, O(n²) is quadratic." },
    { skill: "Data Structures", difficulty: "Medium", question: "When would you use a hash map vs an array?", idealAnswer: "Use hash map for fast key-based lookups (O(1) average). Use array for ordered data, iteration, or when memory efficiency matters." },
    { skill: "System Design", difficulty: "Hard", question: "How would you design a URL shortener?", idealAnswer: "Generate unique short codes (base62 encoding), store mapping in database with index on short code, handle collisions, add caching layer (Redis), use load balancer for scale." },
  ],
};

function generateQuestions(skills, domain, count) {
  const pool = QUESTION_BANK[domain] || QUESTION_BANK.General;
  const relevant = pool.filter(q => skills.some(s => s.toLowerCase().includes(q.skill.toLowerCase())));
  const selected = relevant.length >= count ? relevant : [...relevant, ...pool];
  return selected.slice(0, count).map(q => ({ ...q }));
}

function evaluateAnswer(question, idealAnswer, userAnswer) {
  const ideal = idealAnswer.toLowerCase();
  const user = userAnswer.toLowerCase();
  
  const keywords = ideal.split(/\s+/).filter(w => w.length > 4);
  const matched = keywords.filter(k => user.includes(k)).length;
  const score = Math.min(Math.round((matched / keywords.length) * 100), 100);
  
  const correct = score >= 50;
  const feedback = correct 
    ? "Your answer covers the key concepts well."
    : "Your answer is missing some important details.";
  
  const strongPoints = matched > 0 
    ? `You mentioned ${matched} key concepts correctly.`
    : null;
  
  const improvements = score < 70
    ? "Try to include more technical details and examples."
    : null;
  
  return { score, correct, feedback, strongPoints, improvements };
}

module.exports = { generateQuestions, evaluateAnswer };

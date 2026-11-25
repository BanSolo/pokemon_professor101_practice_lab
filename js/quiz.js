export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function filterQuestions(questions, { books, topic, mode }, history) {
  return questions.filter(
    (q) =>
      books.includes(q.book) &&
      (!topic || q.topic === topic) &&
      (mode !== "wrong" || (history[q.id] && !history[q.id].last)) &&
      (mode !== "new" || !history[q.id]),
  );
}
export function buildQueue(pool, books, limit, mixed) {
  if (!mixed) return shuffle(pool).slice(0, limit);
  const groups = books.map((book) =>
    shuffle(pool.filter((q) => q.book === book)),
  );
  const queue = [];
  while (queue.length < limit && groups.some((g) => g.length)) {
    for (const group of shuffle(groups)) {
      if (group.length && queue.length < limit) queue.push(group.pop());
    }
  }
  return shuffle(queue);
}
export function isCorrect(question, optionIndex) {
  return optionIndex === question.correctIndex;
}

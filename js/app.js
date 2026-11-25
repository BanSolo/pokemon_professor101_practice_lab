import { shuffle, filterQuestions, buildQueue, isCorrect } from "./quiz.js";
import { ProgressStore } from "./storage.js";
import {
  $,
  setupBooks,
  selection,
  updateControls,
  updateAvailable,
  renderStats,
  renderQuestion,
  renderAnswer,
} from "./ui.js";
const books = [
  "Standards of Conduct",
  "Pokémon TCG Rulebook",
  "Penalty Guidelines",
  "TCG Tournament Handbook",
  "Tournament Rules Handbook",
];
const files = [
  "standards-of-conduct",
  "pokemon-tcg-rulebook",
  "penalty-guidelines",
  "tcg-tournament-handbook",
  "tournament-rules-handbook",
];
async function loadQuestions() {
  const groups = await Promise.all(
    files.map(async (file, book) => {
      const response = await fetch(
        new URL(`../data/${file}.json`, import.meta.url),
      );
      if (!response.ok)
        throw new Error(`Could not load ${file}: ${response.status}`);
      return (await response.json()).map((q) => ({ ...q, book }));
    }),
  );
  return groups.flat();
}
async function init() {
  $("start").disabled = true;
  $("question").textContent = "Loading questions…";
  const questions = await loadQuestions();
  const store = new ProgressStore(questions);
  let queue = [],
    pos = 0,
    score = 0,
    options = [],
    locked = false;
  const pool = () => filterQuestions(questions, selection(), store.history);
  const available = () => updateAvailable(pool().length);
  function stats() {
    renderStats(questions, books, store);
    available();
  }
  function controls() {
    updateControls(questions);
    available();
  }
  function start() {
    const a = pool(),
      config = selection();
    const limit = config.limit || (config.mode === "exam" ? 20 : a.length);
    queue = buildQueue(a, config.books, limit, config.mixed);
    if (queue.length < limit)
      $("available").textContent +=
        " · The round will be shorter because fewer questions match your filters.";
    pos = score = 0;
    show();
  }
  function show() {
    locked = pos >= queue.length;
    options = locked ? [] : shuffle([0, 1, 2, 3]);
    renderQuestion({ queue, pos, score, options }, books, answer);
  }
  function answer(i) {
    if (locked || pos >= queue.length || i < 0 || i >= options.length) return;
    locked = true;
    const q = queue[pos],
      ok = isCorrect(q, options[i]);
    store.record(q.id, ok);
    score += Number(ok);
    renderAnswer(q, options, i, ok, books, pos + 1 === queue.length);
    stats();
  }
  setupBooks(books, available);
  $("book").onchange = controls;
  $("topic").onchange = available;
  $("mode").onchange = () => {
    if ($("mode").value === "exam" && $("limit").value === "0")
      $("limit").value = "20";
    available();
  };
  $("limit").onchange = available;
  $("start").onclick = start;
  $("next").onclick = () => {
    if (pos >= queue.length) start();
    else {
      pos++;
      show();
    }
  };
  $("reset").onclick = () => {
    if (confirm("Reset all practice statistics?")) {
      store.reset();
      stats();
      start();
    }
  };
  document.addEventListener("keydown", (e) => {
    if (["SELECT", "INPUT"].includes(document.activeElement?.tagName)) return;
    if (/^[1-4]$/.test(e.key)) answer(+e.key - 1);
    if (
      e.key === "Enter" &&
      !$("next").hidden &&
      document.activeElement?.tagName !== "BUTTON"
    )
      $("next").click();
  });
  controls();
  stats();
  start();
}
init().catch((error) => {
  console.error(error);
  $("question").textContent =
    "Unable to load questions. Please reload or check the data files.";
  $("start").disabled = true;
});

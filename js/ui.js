export const $ = (id) => document.getElementById(id);
export function setupBooks(books, onChange) {
  books.forEach((book, i) => $("book").add(new Option(book, i)));
  $("book").add(new Option("Mixed – select sources", "mix"));
  books.forEach((book, i) => {
    const label = document.createElement("label");
    label.className = "source-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.value = i;
    input.onchange = onChange;
    label.append(input, document.createTextNode(" " + book));
    $("sources").append(label);
  });
}
export function selection() {
  const mixed = $("book").value === "mix";
  return {
    mixed,
    books: mixed
      ? [...$("sources").querySelectorAll("input:checked")].map((x) => +x.value)
      : [+$("book").value],
    topic: mixed ? "" : $("topic").value,
    mode: $("mode").value,
    limit: +$("limit").value,
  };
}
export function updateControls(questions) {
  const { mixed, books } = selection();
  $("sources").hidden = !mixed;
  $("topic").hidden = mixed;
  $("topic").replaceChildren(new Option("All topics", ""));
  if (!mixed)
    [
      ...new Set(
        questions.filter((q) => q.book === books[0]).map((q) => q.topic),
      ),
    ].forEach((t) => $("topic").add(new Option(t, t)));
  $("limit").options[0].disabled = mixed;
  if (mixed && $("limit").value === "0") $("limit").value = "20";
}
export function updateAvailable(n) {
  $("available").textContent = n + " questions available";
  $("start").disabled = !n;
}
export function renderStats(questions, books, store) {
  const h = questions.map((q) => store.history[q.id]).filter(Boolean);
  const n = h.reduce((s, x) => s + x.n, 0),
    c = h.reduce((s, x) => s + x.c, 0);
  $("seen").textContent = h.length + "/" + questions.length;
  $("accuracy").textContent = n ? Math.round((c / n) * 100) + "%" : "—";
  $("missed").textContent = h.filter((x) => !x.last).length;
  $("storage").textContent = store.persistent
    ? "Progress is saved in this browser."
    : "Persistent storage is unavailable.";
  $("breakdown").replaceChildren();
  books.forEach((book, i) => {
    const d = document.createElement("details"),
      sum = document.createElement("summary");
    const rs = questions.filter((q) => q.book === i);
    const correct = (a) => a.filter((q) => store.history[q.id]?.last).length;
    sum.textContent = book + " · " + correct(rs) + "/" + rs.length;
    d.append(sum);
    [...new Set(rs.map((q) => q.topic))].forEach((t) => {
      const a = rs.filter((q) => q.topic === t),
        p = document.createElement("p");
      p.textContent =
        t + ": " + correct(a) + "/" + a.length + " correct on last attempt";
      d.append(p);
    });
    $("breakdown").append(d);
  });
}
export function renderQuestion(
  { queue, pos, score, options },
  books,
  onAnswer,
) {
  $("feedback").textContent = "";
  $("answers").replaceChildren();
  $("next").hidden = true;
  $("fill").style.width = (queue.length ? (pos / queue.length) * 100 : 0) + "%";
  if (pos >= queue.length) {
    $("category").textContent = "";
    $("count").textContent = "";
    $("question").textContent = queue.length
      ? "Round complete!"
      : "No questions match this selection.";
    if (queue.length) {
      $("feedback").textContent =
        "Score: " +
        score +
        "/" +
        queue.length +
        " (" +
        Math.round((score / queue.length) * 100) +
        "%).";
      $("next").textContent = "New round";
      $("next").hidden = false;
    }
    return;
  }
  const q = queue[pos];
  $("category").textContent = books[q.book] + " · " + q.topic;
  $("count").textContent = pos + 1 + " / " + queue.length;
  $("question").textContent = q.question;
  options.forEach((o, i) => {
    const b = document.createElement("button"),
      s = document.createElement("span");
    s.className = "letter";
    s.textContent = "ABCD"[i];
    b.append(s, document.createTextNode(q.answers[o]));
    b.onclick = () => onAnswer(i);
    $("answers").append(b);
  });
}
export function renderAnswer(q, options, i, ok, books, last) {
  Array.from($("answers").children).forEach((b, j) => {
    b.disabled = true;
    if (options[j] === q.correctIndex) b.classList.add("good");
    else if (j === i) b.classList.add("bad");
  });
  $("feedback").textContent =
    (ok ? "✓ Correct!" : "✗ Correct answer: " + q.answers[q.correctIndex]) +
    " · Source: " +
    books[q.book] +
    ", page " +
    q.page +
    ".";
  $("next").textContent = last ? "Results →" : "Next →";
  $("next").hidden = false;
}

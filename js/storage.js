const KEY = "prof101-v2";
const LEGACY_KEY = "prof101-v1";
export class ProgressStore {
  history = {};
  persistent = true;
  constructor(questions) {
    try {
      this.history = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}");
      for (const q of questions.filter((q) => q.book === 0)) {
        const previous = legacy[q.id.split("-")[1]];
        if (!this.history[q.id] && previous) this.history[q.id] = previous;
      }
    } catch {
      this.persistent = false;
    }
  }
  record(id, correct) {
    const entry = this.history[id] || { n: 0, c: 0 };
    entry.n++;
    entry.c += Number(correct);
    entry.last = correct;
    this.history[id] = entry;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.history));
    } catch {
      this.persistent = false;
    }
  }
  reset() {
    this.history = {};
    try {
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(KEY, "{}");
    } catch {
      this.persistent = false;
    }
  }
}

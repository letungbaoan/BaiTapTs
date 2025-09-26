interface Card {
  id: string;
  value: string;
  flipped: boolean;
  matched: boolean;
}

type Theme = "emoji" | "animals" | "fruits";

const themes: Record<Theme, string[]> = {
  emoji: [
    "😀",
    "😁",
    "😂",
    "🤣",
    "😃",
    "😄",
    "😅",
    "😆",
    "😉",
    "😊",
    "😋",
    "😎",
    "😍",
    "😘",
    "😗",
    "😙",
    "😚",
    "🙂",
    "🤗",
    "🤩",
  ],
  animals: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🦆",
    "🦉",
    "🐴",
    "🦄",
    "🐢",
  ],
  fruits: [
    "🍎",
    "🍌",
    "🍇",
    "🍉",
    "🍍",
    "🥭",
    "🍓",
    "🍒",
    "🥥",
    "🍑",
    "🍋",
    "🍐",
    "🍊",
    "🥝",
    "🍈",
    "🍏",
    "🍆",
    "🥕",
    "🌽",
    "🥦",
    "🥒",
    "🌶️",
    "🧄",
    "🧅",
  ],
};

const levelConfig = {
  easy: 8,
  medium: 18,
  hard: 32,
};

class MemoryGame {
  private boardEl: HTMLElement;
  private scoreEl: HTMLElement;
  private bestEl: HTMLElement;
  private timerEl: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private levelSelect: HTMLSelectElement;
  private themeSelect: HTMLSelectElement;

  private cards: Card[] = [];
  private firstPick: Card | null = null;
  private secondPick: Card | null = null;
  private lockBoard: boolean = false;
  private score: number = 0;
  private finalScore: number = 0;
  private timer: number = 0;
  private timerInterval: number | null = null;
  private bestKey = "memory_best_score";

  constructor() {
    this.boardEl = document.getElementById("game-board")!;
    this.scoreEl = document.getElementById("score")!;
    this.bestEl = document.getElementById("bestScore")!;
    this.timerEl = document.getElementById("timer")!;
    this.resetBtn = document.getElementById("restartBtn") as HTMLButtonElement;
    this.levelSelect = document.getElementById(
      "levelSelect"
    ) as HTMLSelectElement;
    this.themeSelect = document.getElementById(
      "themeSelect"
    ) as HTMLSelectElement;

    this.resetBtn.addEventListener("click", () => this.startGame());
    this.levelSelect.addEventListener("change", () => this.startGame());
    this.themeSelect.addEventListener("change", () => this.startGame());

    this.loadBest();
    this.startGame();
  }

  private loadBest() {
    const best = localStorage.getItem(this.bestKey);
    this.bestEl.textContent = best ?? "0";
  }

  private saveBest() {
    const old = localStorage.getItem(this.bestKey);
    if (!old || this.finalScore > Number(old)) {
      localStorage.setItem(this.bestKey, String(this.finalScore));
      this.bestEl.textContent = String(this.finalScore);
    }
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timer = 0;
    this.timerEl.textContent = "0";
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.timerEl.textContent = this.timer.toString();
    }, 1000) as number;
  }

  private startGame() {
    this.firstPick = null;
    this.secondPick = null;
    this.lockBoard = false;
    this.score = 0;
    this.finalScore = 0;
    this.scoreEl.textContent = "0";

    const level = this.levelSelect.value as keyof typeof levelConfig;
    const theme = this.themeSelect.value as Theme;
    const pairs = levelConfig[level];

    this.cards = this.createCards(pairs, theme);
    this.shuffle(this.cards);
    this.render();

    if (pairs === 8) this.boardEl.className = "grid grid-cols-4 gap-8";
    else if (pairs === 18) this.boardEl.className = "grid grid-cols-6 gap-8";
    else this.boardEl.className = "grid grid-cols-8 gap-8";

    this.startTimer();
  }

  private createCards(pairs: number, theme: Theme): Card[] {
    const icons = [...themes[theme]];
    const chosen = icons.slice(0, pairs);
    const cards: Card[] = [];
    chosen.forEach((val, idx) => {
      const a: Card = {
        id: `c-${idx}-a`,
        value: val,
        flipped: false,
        matched: false,
      };
      const b: Card = {
        id: `c-${idx}-b`,
        value: val,
        flipped: false,
        matched: false,
      };
      cards.push(a, b);
    });
    return cards;
  }

  private shuffle(array: Card[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private render() {
    this.boardEl.innerHTML = "";
    this.cards.forEach((card) => {
      const cardEl = document.createElement("button");
      cardEl.className =
        "card relative rounded-lg";
      cardEl.innerHTML = `
        <div class="card-inner w-full h-full">
          <div class="card-back">❓</div>
          <div class="card-front">${card.value}</div>
        </div>
      `;
      cardEl.dataset.id = card.id;
      this.updateCardElement(cardEl, card);
      cardEl.addEventListener("click", () => this.handleCardClick(card));
      this.boardEl.appendChild(cardEl);
    });
  }

  private updateCardElement(el: HTMLElement, card: Card) {
    if (card.matched) {
      el.classList.add("flipped", "opacity-80");
      el.setAttribute("aria-disabled", "true");
    } else if (card.flipped) {
      el.classList.add("flipped");
    } else {
      el.classList.remove("flipped");
    }
  }

  private handleCardClick(card: Card) {
    if (this.lockBoard || card.flipped || card.matched) return;
    card.flipped = true;
    this.syncDomForCard(card);

    if (!this.firstPick) {
      this.firstPick = card;
      return;
    }
    this.secondPick = card;
    this.checkForMatch();
  }

  private syncDomForCard(card: Card) {
    const el = this.boardEl.querySelector(
      `[data-id='${card.id}']`
    ) as HTMLElement | null;
    if (el) this.updateCardElement(el, card);
  }

  private checkForMatch() {
    if (!this.firstPick || !this.secondPick) return;

    const isMatch = this.firstPick.value === this.secondPick.value;

    if (isMatch) {
      this.firstPick.matched = true;
      this.secondPick.matched = true;
      this.score++;
      this.scoreEl.textContent = this.score.toString();
      this.syncDomForCard(this.firstPick);
      this.syncDomForCard(this.secondPick);
      this.firstPick = null;
      this.secondPick = null;

      if (this.cards.every((c) => c.matched)) {
        this.onWin();
      }
    } else {
      this.lockBoard = true;
      setTimeout(() => {
        if (this.firstPick) this.firstPick.flipped = false;
        if (this.secondPick) this.secondPick.flipped = false;
        if (this.firstPick) this.syncDomForCard(this.firstPick);
        if (this.secondPick) this.syncDomForCard(this.secondPick);
        this.firstPick = null;
        this.secondPick = null;
        this.lockBoard = false;
      }, 900);
    }
  }

  private onWin() {
    clearInterval(this.timerInterval!);

    this.finalScore = this.score * 1000 - this.timer * 10;
    if (this.finalScore < 0) this.finalScore = 0;

    this.saveBest();

    alert(`You Win!`);

    setTimeout(() => this.startGame(), 1000);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new MemoryGame();
});

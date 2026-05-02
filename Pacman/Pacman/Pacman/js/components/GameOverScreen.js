const STYLE_ID = "gameover-component-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .go-neon-grid {
      background-image: linear-gradient(to right, rgba(0, 227, 253, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 227, 253, 0.05) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .go-crt-scanline {
      background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.2) 50%);
      background-size: 100% 4px;
      pointer-events: none;
    }
    .go-glitch-text {
      text-shadow: 2px 0 #ff7351, -2px 0 #00e3fd;
    }
  `;
  document.head.appendChild(style);
}

function buildMarkup() {
  return `
    <section id="gameover-screen" class="hidden fixed inset-0 z-[80] bg-background text-on-surface font-body overflow-hidden">
      <main class="relative h-screen flex flex-col items-center justify-center pl-0 overflow-hidden">
        <div class="absolute inset-0 z-0 go-neon-grid opacity-20"></div>
        <div class="absolute inset-0 z-10 opacity-10 bg-center bg-no-repeat bg-contain blur-sm grayscale" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCieds7hHSoROsAKttCtihJDT3vsQue9aprpcfTiLrbil3u9YZiXEmyA8DH7RiFPzyeQ46xntggcUg3oWkVpIfz1pJUyU_MyeIpq1SJW7v6bymPyarL39f4K7Y-BC0aaYkCEnblgMD8XK8PW0Z2WL8oucad7Xs-98d0rxma06-X8hHeZ-sYfsLKTsB1PWYRsMST9NYYO2CGycBiQNUKD-Rqq1gK54wEztWHX93c6ajY8i3_YGCboiVEDkEdAfar7YIMByIPX5-4CQwa');"></div>
        <div class="absolute inset-0 z-20 go-crt-scanline"></div>
        <div class="relative z-30 text-center max-w-4xl px-6">
          <div class="mb-2"><span class="font-headline text-secondary text-sm tracking-[0.4em] uppercase font-bold">PARTIDA TERMINADA</span></div>
          <h1 class="font-headline text-7xl md:text-9xl font-black text-primary go-glitch-text tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(255,254,172,0.6)]">GAME OVER</h1>
          <div class="flex flex-col gap-12 items-center">
            <div class="text-center">
              <div class="font-headline text-white/40 text-xs tracking-[0.3em] uppercase mb-4">PUNTUACIÓN FINAL</div>
              <div data-role="go-final-score" class="font-headline text-6xl md:text-8xl font-extrabold text-on-surface tracking-tight tabular-nums">0</div>
              <div class="mt-4 inline-flex items-center gap-2 px-4 py-1 bg-surface-container-highest border border-outline-variant/30">
                <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1">star</span>
                <span data-role="go-pb-score" class="font-headline text-[10px] text-white/60 tracking-widest uppercase">MEJOR PUNTUACIÓN: 0</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-1 w-full max-w-2xl bg-outline-variant/10">
              <div class="bg-surface-container-low p-6 flex flex-col items-center justify-center relative">
                <div class="absolute top-0 right-0 w-1 h-1 bg-primary"></div>
                <span class="font-headline text-secondary text-[10px] tracking-widest uppercase mb-2">NIVEL ALCANZADO</span>
                <span data-role="go-level" class="font-headline text-3xl font-bold">1</span>
              </div>
              <div class="bg-surface-container-low p-6 flex flex-col items-center justify-center relative">
                <div class="absolute top-0 right-0 w-1 h-1 bg-primary"></div>
                <span class="font-headline text-secondary text-[10px] tracking-widest uppercase mb-2">FANTASMAS COMIDOS</span>
                <span data-role="go-ghosts" class="font-headline text-3xl font-bold">0</span>
              </div>
              <div class="bg-surface-container-low p-6 flex flex-col items-center justify-center relative">
                <div class="absolute top-0 right-0 w-1 h-1 bg-primary"></div>
                <span class="font-headline text-secondary text-[10px] tracking-widest uppercase mb-2">POTENCIADORES</span>
                <span data-role="go-powerups" class="font-headline text-3xl font-bold">0</span>
              </div>
            </div>
            <div class="flex flex-col w-full max-w-md gap-4">
              <button data-action="gameover-replay" class="group relative w-full bg-primary py-6 overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(255,254,172,0.3)]">
                <div class="relative z-10 flex items-center justify-center gap-3">
                  <span class="material-symbols-outlined text-on-primary font-bold">replay</span>
                  <span class="font-headline font-black text-on-primary text-xl tracking-[0.2em] uppercase">REINICIAR PARTIDA</span>
                </div>
                <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <div class="grid grid-cols-2 gap-4">
                <button data-action="gameover-menu" class="flex items-center justify-center gap-2 py-4 border border-secondary/40 text-secondary font-headline text-xs tracking-widest uppercase hover:bg-secondary/5 transition-colors"><span class="material-symbols-outlined text-sm">home</span>MENU PRINCIPAL</button>
                <button data-action="gameover-rankings" class="flex items-center justify-center gap-2 py-4 border border-secondary/40 text-secondary font-headline text-xs tracking-widest uppercase hover:bg-secondary/5 transition-colors"><span class="material-symbols-outlined text-sm">format_list_numbered</span>RANKING</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </section>
  `;
}

export function createGameOverScreen({ onReplay, onMenu, onRankings }) {
  ensureStyles();
  const host = document.createElement("div");
  host.innerHTML = buildMarkup();
  const root = host.firstElementChild;
  document.body.appendChild(root);

  root.querySelectorAll('[data-action="gameover-replay"]').forEach((btn) => btn.addEventListener("click", onReplay));
  root.querySelectorAll('[data-action="gameover-menu"]').forEach((btn) => btn.addEventListener("click", onMenu));
  root.querySelectorAll('[data-action="gameover-rankings"]').forEach((btn) => btn.addEventListener("click", onRankings));

  const refs = {
    finalScore: root.querySelector('[data-role="go-final-score"]'),
    pbScore: root.querySelector('[data-role="go-pb-score"]'),
    level: root.querySelector('[data-role="go-level"]'),
    ghosts: root.querySelector('[data-role="go-ghosts"]'),
    powerUps: root.querySelector('[data-role="go-powerups"]'),
  };

  return {
    show(data) {
      refs.finalScore.textContent = Number(data.finalScore ?? 0).toLocaleString("en-US");
      refs.pbScore.textContent = `PB: ${Number(data.pbScore ?? 0).toLocaleString("en-US")}`;
      refs.level.textContent = String(data.levelReached ?? 1);
      refs.ghosts.textContent = String(data.ghostsEaten ?? 0);
      refs.powerUps.textContent = String(data.powerUps ?? 0);
      root.classList.remove("hidden");
    },
    hide() {
      root.classList.add("hidden");
    },
  };
}

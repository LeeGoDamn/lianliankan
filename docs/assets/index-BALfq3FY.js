(function(){const l=document.createElement("link").relList;if(l&&l.supports&&l.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))e(o);new MutationObserver(o=>{for(const t of o)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&e(r)}).observe(document,{childList:!0,subtree:!0});function i(o){const t={};return o.integrity&&(t.integrity=o.integrity),o.referrerPolicy&&(t.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?t.credentials="include":o.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function e(o){if(o.ep)return;o.ep=!0;const t=i(o);fetch(o.href,t)}})();const M=["🍎","🍊","🍋","🍇","🍓","🍑","🥝","🍒","🌸","🌺","🌻","🌹","🌼","💐","🌿","🍀","🐶","🐱","🐼","🦊","🐰","🐨","🐯","🦁","🚀","✈️","🚗","🚲","⛵","🛸","🚁","🏍️","⭐","🌙","☀️","🌈","❄️","🔥","💎","🎵"],n={board:[],rows:8,cols:10,selectedCell:null,moves:0,matches:0,totalPairs:0,startTime:null,elapsedTime:0,timerInterval:null,difficulty:"medium",isWon:!1,isAnimating:!1},I={easy:{rows:6,cols:8},medium:{rows:8,cols:10},hard:{rows:10,cols:12}};function x(s){const l=[...s];for(let i=l.length-1;i>0;i--){const e=Math.floor(Math.random()*(i+1));[l[i],l[e]]=[l[e],l[i]]}return l}function $(){const{rows:s,cols:l}=n,e=s*l/2;n.totalPairs=e;const o=x(M).slice(0,e),t=[...o,...o],r=x(t),c=[];let a=0;for(let f=0;f<s;f++){const d=[];for(let m=0;m<l;m++)d.push({id:a++,emoji:r[f*l+m],row:f,col:m,isMatched:!1});c.push(d)}return c}function y(s){const l=Math.floor(s/60),i=s%60;return`${l.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`}function u(s,l,i){if(l.row===i.row){const e=Math.min(l.col,i.col),o=Math.max(l.col,i.col);for(let t=e+1;t<o;t++)if(s[l.row][t]!==null)return!1;return!0}if(l.col===i.col){const e=Math.min(l.row,i.row),o=Math.max(l.row,i.row);for(let t=e+1;t<o;t++)if(s[t][l.col]!==null)return!1;return!0}return!1}function E(s,l,i){const e={row:l.row,col:i.col},o={row:i.row,col:l.col};return(s[e.row][e.col]===null||e.row===l.row&&e.col===l.col||e.row===i.row&&e.col===i.col)&&u(s,l,e)&&u(s,e,i)?e:(s[o.row][o.col]===null||o.row===l.row&&o.col===l.col||o.row===i.row&&o.col===i.col)&&u(s,l,o)&&u(s,o,i)?o:null}function j(s,l,i){const{rows:e,cols:o}=n;for(let t=-1;t<=o;t++){if(t===l.col||t===i.col)continue;const r={row:l.row,col:t},c={row:i.row,col:t},a=t<0||t>=o||s[r.row][r.col]===null,f=t<0||t>=o||s[c.row][c.col]===null;if(a&&f&&u(s,l,r)&&u(s,r,c)&&u(s,c,i))return[r,c]}for(let t=-1;t<=e;t++){if(t===l.row||t===i.row)continue;const r={row:t,col:l.col},c={row:t,col:i.col},a=t<0||t>=e||s[r.row][r.col]===null,f=t<0||t>=e||s[c.row][c.col]===null;if(a&&f&&u(s,l,r)&&u(s,r,c)&&u(s,c,i))return[r,c]}return null}function p(s,l,i){if(u(s,l,i))return{canConnect:!0,path:[l,i]};const e=E(s,l,i);if(e)return{canConnect:!0,path:[l,e,i]};const o=j(s,l,i);return o?{canConnect:!0,path:[l,o[0],o[1],i]}:{canConnect:!1,path:[]}}function b(){const{board:s,rows:l,cols:i}=n,e=[];for(let o=0;o<l;o++)for(let t=0;t<i;t++)s[o][t]&&!s[o][t].isMatched&&e.push(s[o][t]);for(let o=0;o<e.length;o++)for(let t=o+1;t<e.length;t++)if(e[o].emoji===e[t].emoji&&p(s,e[o],e[t]).canConnect)return[e[o],e[t]];return null}function T(){return b()!==null}function B(s){const l=document.getElementById("board-container");if(!l)return;const e=l.querySelectorAll(".cell")[0];if(!e)return;const o=e.offsetWidth,t=e.offsetHeight,r=8;for(let c=0;c<s.length-1;c++){const a=s[c],f=s[c+1],d=document.createElement("div");d.className="match-line";const m=a.col*(o+r)+o/2,v=a.row*(t+r)+t/2,g=f.col*(o+r)+o/2,C=f.row*(t+r)+t/2;a.row===f.row?(d.style.width=`${Math.abs(g-m)}px`,d.style.height="4px",d.style.left=`${Math.min(m,g)}px`,d.style.top=`${v-2}px`):(d.style.width="4px",d.style.height=`${Math.abs(C-v)}px`,d.style.left=`${m-2}px`,d.style.top=`${Math.min(v,C)}px`),l.appendChild(d),setTimeout(()=>{d.remove()},300)}}function h(){const s=document.getElementById("app"),{board:l,cols:i}=n;s.innerHTML=`
    <div class="min-h-screen p-2 md:p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-4">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
            🔗 连连看
          </h1>
          <p class="text-gray-400 text-sm">找出相同图案，用不超过两个拐点的线连接消除</p>
        </div>

        <!-- Stats -->
        <div class="flex justify-center gap-3 mb-4 flex-wrap">
          <div class="stats-card text-center">
            <div class="text-xl font-bold text-white">${n.moves}</div>
            <div class="text-xs text-gray-400">步数</div>
          </div>
          <div class="stats-card text-center">
            <div class="text-xl font-bold text-white">${y(n.elapsedTime)}</div>
            <div class="text-xs text-gray-400">时间</div>
          </div>
          <div class="stats-card text-center">
            <div class="text-xl font-bold text-white">${n.matches}/${n.totalPairs}</div>
            <div class="text-xs text-gray-400">配对</div>
          </div>
        </div>

        <!-- Difficulty -->
        <div class="flex justify-center gap-2 mb-4">
          ${["easy","medium","hard"].map(e=>`
            <button 
              class="btn ${n.difficulty===e?"ring-2 ring-white ring-offset-2 ring-offset-transparent":"opacity-70"}"
              data-difficulty="${e}"
            >
              ${e==="easy"?"简单":e==="medium"?"中等":"困难"}
            </button>
          `).join("")}
        </div>

        <!-- Game Board -->
        <div 
          id="board-container"
          class="relative grid gap-2 mb-4"
          style="grid-template-columns: repeat(${i}, minmax(0, 1fr));"
        >
          ${l.map((e,o)=>e.map((t,r)=>t?`
              <div 
                class="cell ${t.isMatched?"matched":""} ${n.selectedCell?.id===t.id?"selected":""}"
                data-id="${t.id}"
                data-row="${t.row}"
                data-col="${t.col}"
              >
                ${t.emoji}
              </div>
            `:`
              <div class="cell opacity-0 pointer-events-none"></div>
            `).join("")).join("")}
        </div>

        <!-- Buttons -->
        <div class="flex justify-center gap-2">
          <button class="btn" id="resetBtn">🔄 重新开始</button>
          <button class="btn" id="hintBtn">💡 提示</button>
        </div>
      </div>
    </div>

    <!-- Win Modal -->
    ${n.isWon?`
      <div class="win-modal fixed inset-0 flex items-center justify-center z-50">
        <div class="win-content text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-3xl font-bold text-white mb-4">恭喜通关！</h2>
          <div class="text-gray-300 mb-6">
            <p>用时：<span class="text-white font-bold">${y(n.elapsedTime)}</span></p>
            <p>步数：<span class="text-white font-bold">${n.moves}</span></p>
          </div>
          <button class="btn" id="playAgainBtn">🎮 再玩一次</button>
        </div>
      </div>
    `:""}

    <!-- No Moves Modal -->
    <div id="noMovesModal" class="win-modal fixed inset-0 flex items-center justify-center z-50 hidden">
      <div class="win-content text-center">
        <div class="text-6xl mb-4">😅</div>
        <h2 class="text-2xl font-bold text-white mb-4">没有可消除的配对了</h2>
        <p class="text-gray-300 mb-6">棋盘将重新洗牌</p>
        <button class="btn" id="shuffleBtn">🔀 洗牌</button>
      </div>
    </div>
  `,document.querySelectorAll(".cell:not(.matched)").forEach(e=>{e.addEventListener("click",()=>A(e))}),document.querySelectorAll("[data-difficulty]").forEach(e=>{e.addEventListener("click",()=>{n.difficulty=e.getAttribute("data-difficulty"),w()})}),document.getElementById("resetBtn")?.addEventListener("click",w),document.getElementById("playAgainBtn")?.addEventListener("click",w),document.getElementById("hintBtn")?.addEventListener("click",L),document.getElementById("shuffleBtn")?.addEventListener("click",S)}function A(s){if(n.isAnimating)return;const l=parseInt(s.getAttribute("data-row")),i=parseInt(s.getAttribute("data-col")),e=n.board[l][i];if(!e||e.isMatched)return;if(n.startTime||(n.startTime=Date.now(),n.timerInterval=window.setInterval(P,1e3)),!n.selectedCell){n.selectedCell=e,h();return}if(n.selectedCell.id===e.id){n.selectedCell=null,h();return}if(n.selectedCell.emoji!==e.emoji){n.selectedCell=e,h();return}const o=p(n.board,{row:n.selectedCell.row,col:n.selectedCell.col},{row:e.row,col:e.col});o.canConnect?(n.moves++,n.isAnimating=!0,B(o.path),setTimeout(()=>{n.selectedCell.isMatched=!0,e.isMatched=!0,n.board[n.selectedCell.row][n.selectedCell.col]=null,n.board[e.row][e.col]=null,n.matches++,n.selectedCell=null,n.isAnimating=!1,n.matches===n.totalPairs?(n.isWon=!0,n.timerInterval&&clearInterval(n.timerInterval)):T()||setTimeout(()=>{const t=document.getElementById("noMovesModal");t&&t.classList.remove("hidden")},300),h()},300)):(n.selectedCell=e,h())}function L(){const s=b();if(s){const[l,i]=s;document.querySelectorAll(".cell").forEach(o=>{const t=parseInt(o.getAttribute("data-id"));(t===l.id||t===i.id)&&(o.classList.add("hint"),setTimeout(()=>o.classList.remove("hint"),1500))})}}function S(){const{board:s,rows:l,cols:i}=n,e=[];for(let c=0;c<l;c++)for(let a=0;a<i;a++)s[c][a]&&e.push(s[c][a].emoji);const o=x(e);let t=0;for(let c=0;c<l;c++)for(let a=0;a<i;a++)s[c][a]&&(s[c][a].emoji=o[t++]);const r=document.getElementById("noMovesModal");r&&r.classList.add("hidden"),h()}function P(){if(n.startTime){n.elapsedTime=Math.floor((Date.now()-n.startTime)/1e3);const s=document.querySelector(".stats-card:nth-child(2) .text-xl");s&&(s.textContent=y(n.elapsedTime))}}function w(){n.timerInterval&&clearInterval(n.timerInterval);const s=I[n.difficulty];n.rows=s.rows,n.cols=s.cols,n.board=$(),n.selectedCell=null,n.moves=0,n.matches=0,n.startTime=null,n.elapsedTime=0,n.timerInterval=null,n.isWon=!1,n.isAnimating=!1,h()}w();

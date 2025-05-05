import { KeywordAnalysis } from "./keyword_analysis.js";

const disallowedTags = ['script', 'style', 'noscript', 'textarea', 'aside'];
const allowedTags = ['p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const disallowedInlineTags = ['A', 'BUTTON', 'label'];
let i = 0;
let fullText = "";
let metaKeywords = [];
let userKeywords = [];
let displayMetaKeywords = [];
let displayUserKeywords = [];
let currentMetaPage = 1;
let currentUserPage = 1;
const pageSize = 5;
let totalWords = 0;
let totalUniqueWords = 0;
let metaKeywordsSortMode = "sort-by-name";
let userKeywordsSortMode = "sort-by-name";
let metaKeywordsSortDirection = "";
let userKeywordsSortDirection = "";
let metaKeywordsFilterQuery = "";
let userKeywordsFilterQuery = "";

function isValidInlineElement(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  if (disallowedInlineTags.includes(node.tagName)) return false;
  const display = window.getComputedStyle(node).display;
  return display.startsWith('inline');
}

function checkNode(prevNode, node) {
  return getValidParent(prevNode) === getValidParent(node); 
}

function getParentName(node) {
  while ((node = node.parentNode)) {
    if (allowedTags.includes(node.nodeName.toLowerCase())) {
      return node.nodeName;
    }
  }
  return document.body.nodeName;
}

function getValidParent(node) {
  while ((node = node.parentNode)) {
    if (!isValidInlineElement(node)) {
      return node;
    }
  }
  return document.body;
}

function isAllParentsValid(node) {
  while ((node = node.parentNode)) {
    if (disallowedTags.includes(node.nodeName.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function createTreeWalker() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!isAllParentsValid(node)) return NodeFilter.FILTER_REJECT;
        //if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  return walker;
}

const walker = createTreeWalker();
function treeWalker() {
  const node = walker.nextNode();
  document.getElementById("result").innerHTML += `
    ${walker.currentNode.nodeType}&emsp;
    ${walker.currentNode.nodeName}&emsp;
    ${walker.currentNode.nodeValue}<br>`;
  
  fullText += node.nodeValue + " \n\n";

  if (/[\p{L}\p{N}_\-./]$/u.test(node.nodeValue)) {
    const nextNode = walker.nextNode();

    if (nextNode && /^[\p{L}\p{N}_\-./]/u.test(nextNode.nodeValue) && checkNode(node, nextNode)) {
      fullText = fullText.slice(0, -3);
    }
    walker.previousNode();
  } 

  document.getElementById("fullText").innerHTML = fullText;
}

window.treeWalker = treeWalker;
window.createTreeWalker = createTreeWalker;
window.walker = walker;

function countWords() {
  const walker = createTreeWalker();
  //const pattern = /[\p{L}\p{N}](?:[\p{L}\p{N}\-_.]*[\p{L}\p{N}])?/gu;
  //const pattern = /[\p{L}\p{N}]+(?:[\p{L}\p{N}\-_.]*[\p{L}\p{N}]|['’][\p{L}\p{N}]*)?/gu;
  const pattern = /[\p{L}\p{N}]+(?:['’\-_.][\p{L}\p{N}]+)*['’]?/gu;
  let node;
  let words = [];
  while ((node = walker.nextNode())) {
    const matches = node.nodeValue.toLowerCase().match(pattern) || [];
    words = [...words, ...matches];
    totalWords += matches.length;
  }
  return words;
}

function loadKeywordsAnalysisOverview() {
  const words = countWords();
  document.getElementById("words-content").querySelector("p").innerHTML = totalWords;

  totalUniqueWords = new Set(words).size;
  document.getElementById("unique-words-content").querySelector("p").innerHTML = totalUniqueWords;

  const metaTagKeywords = document.querySelector("meta[name='keywords' i]");
  const metaTagKeywordsContent = metaTagKeywords?.content;
  document.getElementById("keywords-content").querySelector("p").innerHTML = metaTagKeywordsContent ?? "Missing";
  if (metaTagKeywordsContent) {
    const pattern = new RegExp(",\\s*", "gi");
    const keywords = metaTagKeywordsContent.split(pattern);
    metaKeywords = keywords.map((keyword) => {
      return new KeywordAnalysis(keyword, walker, totalWords);
    });
    displayMetaKeywords = [...metaKeywords];
  }

  const lang = document.documentElement.lang;
  document.getElementById("lang-content").querySelector("p").innerHTML = lang || 'Missing';
}

function toggleTooltip(event) {
  const tooltipText = event.target.closest(".tooltip")?.querySelector("span");
  tooltipText.classList.toggle("visible");
  tooltipText.classList.toggle("not-visible");
}

function removeHighlight() {
  const highlightedKeywords = document.querySelectorAll('.highlight-keyword');
  highlightedKeywords.forEach((element) => {
    const newTextNode = document.createTextNode(element.textContent);
    element.parentNode.replaceChild(newTextNode, element);
  });
}

function highlightKeyword(keyword) {
  removeHighlight();

  const walker = createTreeWalker();
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  const pattern = new RegExp(`(${keyword})`, "i");

  textNodes.forEach((node) => {
    if (pattern.test(node.nodeValue)) {
      const fragment = document.createDocumentFragment();
      const parts = node.nodeValue.split(pattern);
      const parent = getParentName(node);
      
      parts.forEach((part) => {
        if (part !== "" && pattern.test(part)) {
          const span = document.createElement("span");
          span.classList.add("highlight-keyword");
          span.style.setProperty('--highlight-bg-color', getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${parent.toLowerCase()}-bg-color`));
          span.style.setProperty('--highlight-color', getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${parent.toLowerCase()}-color`));
          span.style.setProperty('--highlight-border', getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${parent.toLowerCase()}-border-color`));
          if (parent.length <= 2) {
            span.style.setProperty('--highlight-label', `"${parent}"`);
          }
          span.innerHTML = part;
          fragment.appendChild(span);
        } else if (part !== "") {
          const newTextNode = document.createTextNode(part);
          fragment.appendChild(newTextNode);
        }
      });

      node.parentNode.replaceChild(fragment, node);
    }
  });
}

function toggleHighlight(event) {
  const keyword = document.getElementById("insert-keyword")?.value.trim();
  if (!keyword || keyword.length <= 0) return;
  if (event.target.checked) {
    highlightKeyword(keyword);
  } else {
    removeHighlight();
  }
}

/* function addMetaKeywordsElement(keyword) {
  keyword = keyword.trim();
  const keywordsList = document.querySelector(".meta-keywords-container ul");
  let item = document.createElement("li");
  const itemContent = `
    <h3>${keyword}</h3>
    <div class="keyword-actions">
      <button class="highlight">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="icon"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M315 315l158.4-215L444.1 70.6 229 229 315 315zm-187 5s0 0 0 0l0-71.7c0-15.3 7.2-29.6 19.5-38.6L420.6 8.4C428 2.9 437 0 446.2 0c11.4 0 22.4 4.5 30.5 12.6l54.8 54.8c8.1 8.1 12.6 19 12.6 30.5c0 9.2-2.9 18.2-8.4 25.6L334.4 396.5c-9 12.3-23.4 19.5-38.6 19.5L224 416l-25.4 25.4c-12.5 12.5-32.8 12.5-45.3 0l-50.7-50.7c-12.5-12.5-12.5-32.8 0-45.3L128 320zM7 466.3l63-63 70.6 70.6-31 31c-4.5 4.5-10.6 7-17 7L24 512c-13.3 0-24-10.7-24-24l0-4.7c0-6.4 2.5-12.5 7-17z"/></svg>
      </button>
      <button class="view-details">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="icon"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
      </button>
    </div>
  `;
  item.innerHTML = itemContent;
  keywordsList.appendChild(item);
  item.querySelector(".highlight").addEventListener("click", () => {
    highlightKeyword(keyword);
  });
}

 function toggleMetaKeywords(page = 0) {
  start = page * offset;
  end = start + offset;
  const items = document.querySelectorAll(".meta-keywords-container ul li");
  items.forEach(item => item.classList.add("hidden"));
  for (let i = start; i < end && i < keywords.length; i++) {
    items[i].classList.remove("hidden");
  }
} */

function renderKeywords(keywordsContainer, keywords, currentPage = 1) {
  let page = currentPage - 1;
  let start = page * pageSize;
  let end = start + pageSize;
  const visibleKeywords = keywords.slice(start, end);
  const keywordsList = keywordsContainer.querySelector("ul");
  keywordsList.innerHTML = "";
  visibleKeywords.forEach(keywordObj => {
    let item = document.createElement("li");
    item.dataset.keywordIndex = keywords.indexOf(keywordObj);
    item.innerHTML = `
      <h3>${keywordObj.keyword}</h3>
      <div class="keyword-actions"></div>
    `;
    const keywordActionsContainer = item.querySelector(".keyword-actions");
    keywordActionsContainer.innerHTML = `
      <button class="highlight">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="icon"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M315 315l158.4-215L444.1 70.6 229 229 315 315zm-187 5s0 0 0 0l0-71.7c0-15.3 7.2-29.6 19.5-38.6L420.6 8.4C428 2.9 437 0 446.2 0c11.4 0 22.4 4.5 30.5 12.6l54.8 54.8c8.1 8.1 12.6 19 12.6 30.5c0 9.2-2.9 18.2-8.4 25.6L334.4 396.5c-9 12.3-23.4 19.5-38.6 19.5L224 416l-25.4 25.4c-12.5 12.5-32.8 12.5-45.3 0l-50.7-50.7c-12.5-12.5-12.5-32.8 0-45.3L128 320zM7 466.3l63-63 70.6 70.6-31 31c-4.5 4.5-10.6 7-17 7L24 512c-13.3 0-24-10.7-24-24l0-4.7c0-6.4 2.5-12.5 7-17z"/></svg>
      </button>
    `;
    if (keywordObj.status === 'analyzing') {
      keywordActionsContainer.innerHTML += `
        <div class="spinner-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon spinner"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M222.7 32.1c5 16.9-4.6 34.8-21.5 39.8C121.8 95.6 64 169.1 64 256c0 106 86 192 192 192s192-86 192-192c0-86.9-57.8-160.4-137.1-184.1c-16.9-5-26.6-22.9-21.5-39.8s22.9-26.6 39.8-21.5C434.9 42.1 512 140 512 256c0 141.4-114.6 256-256 256S0 397.4 0 256C0 140 77.1 42.1 182.9 10.6c16.9-5 34.8 4.6 39.8 21.5z"/></svg>
        </button>
        `;
    } else {
      keywordActionsContainer.innerHTML += `
      <button class="view-details">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="icon"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
      </button>
    `;
    }
    keywordsList.appendChild(item);
  });
}

function renderMetaKeywordsContainer() {
  if (displayMetaKeywords.length <= 0) return;

  const metaKeywordsContainer = document.querySelector(".meta-keywords-container");
  metaKeywordsContainer.innerHTML = `
    <h2>Meta keywords</h2>
    <div class="filters-container">
      <div class="search-container">
        <div class="input-wrapper">
          <span class="prefix">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon icon-small">
              <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" />
            </svg>
          </span>
          <input type="text" id="search-meta-keyword" name="search-keyword" class="search-keyword" placeholder="Search keyword...">
        </div>
      </div>
      <div class="sort-container">
        <button class="sort-btn" data-sort="desc">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon">
            <path fill-rule="evenodd" d="M2 2.75A.75.75 0 0 1 2.75 2h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 2 2.75ZM2 6.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 2 6.25Zm0 3.5A.75.75 0 0 1 2.75 9h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 2 9.75ZM14.78 11.47a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 1 1 1.06-1.06l.97.97V6.75a.75.75 0 0 1 1.5 0v5.69l.97-.97a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="sort-btn" data-sort="asc">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon">
            <path fill-rule="evenodd" d="M2 2.75A.75.75 0 0 1 2.75 2h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 2 2.75ZM2 6.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 2 6.25Zm0 3.5A.75.75 0 0 1 2.75 9h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 2 9.75ZM9.22 9.53a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1-1.06 1.06l-.97-.97v5.69a.75.75 0 0 1-1.5 0V8.56l-.97.97a.75.75 0 0 1-1.06 0Z" clip-rule="evenodd" />
          </svg>
        </button>
        <select id="sort-meta-keywords-dropdown" name="sort-dropdown" class="sort-dropdown">
          <option value="sort-by-name">Sort by name</option>
          <option value="sort-by-score">Sort by score</option>
        </select>
        <button class="remove-filters">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
            <path d="M16.284,14.87l5.716-5.881v-3.989c0-1.654-1.346-3-3-3H4c-.179,0-.355,.025-.529,.057L1.457,.043,.043,1.457,22.543,23.957l1.414-1.414-7.673-7.673Zm-1.284,4.386v4.744l-6-4.5v-3.309L2,8.989v-2.813l13,13.079Z"/>
          </svg>
        </button>
      </div>
    </div>
    <ul></ul>
  `;

  renderKeywords(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
  renderPages(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
  displayMetaKeywords.forEach(async (metaKeyword) => {
    await metaKeyword.analyze();
    metaKeyword.status = "done";
    if (isItemVisible(displayMetaKeywords, metaKeyword, currentMetaPage)) {
      renderKeywords(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
      renderPages(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
    }
  }); 

  metaKeywordsContainer.querySelector(".sort-dropdown").addEventListener("change", (event) => {
    metaKeywordsSortMode = event.target.value;
  });

  metaKeywordsContainer.querySelector(".search-keyword").addEventListener("input", (event) => {
    metaKeywordsFilterQuery = event.target.value;
    updateVisibleKeywords(displayMetaKeywords, metaKeywords, metaKeywordsFilterQuery, metaKeywordsSortMode, metaKeywordsSortDirection);
    renderKeywords(metaKeywordsContainer, displayMetaKeywords);
    renderPages(metaKeywordsContainer, displayMetaKeywords);
  });

  metaKeywordsContainer.addEventListener("click", (event) => {
    if (event.target.closest(".sort-container .sort-btn")) {
      event.target.closest(".sort-container").querySelectorAll(".sort-btn").forEach((element) => {
        element.classList.remove("active");
      });
      const sortBtn = event.target.closest(".sort-container .sort-btn");
      sortBtn.classList.add("active");
      metaKeywordsSortDirection = sortBtn.dataset.sort;
      sortKeywords(displayMetaKeywords, metaKeywordsSortMode, metaKeywordsSortDirection);
      renderKeywords(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
      renderPages(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
    }

    if (event.target.closest(".sort-container .remove-filters")) {
      displayMetaKeywords = [...metaKeywords];
      metaKeywordsFilterQuery = "";
      metaKeywordsSortMode = "sort-by-name";
      metaKeywordsSortDirection = "";
      event.target.closest(".filters-container").querySelectorAll(".sort-btn").forEach((element) => {
        element.classList.remove("active");
      });
      event.target.closest(".filters-container").querySelector(".sort-dropdown").value = metaKeywordsSortMode;
      event.target.closest(".filters-container").querySelector(".search-keyword").value = metaKeywordsFilterQuery;
      renderKeywords(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
      renderPages(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
    }

    if (event.target.closest(".highlight")) {
      const keywordIndex = event.target.closest("li")?.dataset.keywordIndex;
      uncheckHighlightKeywordCheckbox();
      highlightKeyword(displayMetaKeywords[keywordIndex].keyword);
    }

    if (event.target.closest(".view-details")) {
      const keywordIndex = event.target.closest("li")?.dataset.keywordIndex;
      renderDetailsPage(displayMetaKeywords, keywordIndex);
    }

    if (event.target.closest("ol.pages-container button:not(.active)")) {
      currentMetaPage = parseInt(event.target.dataset.page);
      renderKeywords(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
      renderPages(metaKeywordsContainer, displayMetaKeywords, currentMetaPage);
    }
  });
}

function renderUserKeywordsContainer() {
  const userKeywordsContainer = document.querySelector(".user-keywords-container");
  userKeywordsContainer.innerHTML = `
    <h2>User keywords</h2>
    <div class="filters-container">
      <div class="search-container">
        <div class="input-wrapper">
          <span class="prefix">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon icon-small">
              <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" />
            </svg>
          </span>
          <input type="text" id="search-user-keyword" name="search-keyword" class="search-keyword" placeholder="Search keyword...">
        </div>
      </div>
      <div class="sort-container">
        <button class="sort-btn" data-sort="desc">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon">
            <path fill-rule="evenodd" d="M2 2.75A.75.75 0 0 1 2.75 2h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 2 2.75ZM2 6.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 2 6.25Zm0 3.5A.75.75 0 0 1 2.75 9h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 2 9.75ZM14.78 11.47a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 1 1 1.06-1.06l.97.97V6.75a.75.75 0 0 1 1.5 0v5.69l.97-.97a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="sort-btn" data-sort="asc">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="icon">
            <path fill-rule="evenodd" d="M2 2.75A.75.75 0 0 1 2.75 2h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 2 2.75ZM2 6.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 2 6.25Zm0 3.5A.75.75 0 0 1 2.75 9h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 2 9.75ZM9.22 9.53a.75.75 0 0 1 0-1.06l2.25-2.25a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1-1.06 1.06l-.97-.97v5.69a.75.75 0 0 1-1.5 0V8.56l-.97.97a.75.75 0 0 1-1.06 0Z" clip-rule="evenodd" />
          </svg>
        </button>
        <select id="sort-user-keywords-dropdown" name="sort-dropdown" class="sort-dropdown">
          <option value="sort-by-name">Sort by name</option>
          <option value="sort-by-score">Sort by score</option>
        </select>
        <button class="remove-filters">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
            <path d="M16.284,14.87l5.716-5.881v-3.989c0-1.654-1.346-3-3-3H4c-.179,0-.355,.025-.529,.057L1.457,.043,.043,1.457,22.543,23.957l1.414-1.414-7.673-7.673Zm-1.284,4.386v4.744l-6-4.5v-3.309L2,8.989v-2.813l13,13.079Z"/>
          </svg>
        </button>
      </div>
    </div>
    <ul></ul>
  `;

  userKeywordsContainer.querySelector(".sort-dropdown").addEventListener("change", (event) => {
    userKeywordsSortMode = event.target.value;
  });

  userKeywordsContainer.querySelector(".search-keyword").addEventListener("input", (event) => {
    userKeywordsFilterQuery = event.target.value;
    updateVisibleKeywords(displayUserKeywords, userKeywords, userKeywordsFilterQuery, userKeywordsSortMode, userKeywordsSortDirection);
    renderKeywords(userKeywordsContainer, displayUserKeywords);
    renderPages(userKeywordsContainer, displayUserKeywords);
  });

  userKeywordsContainer.addEventListener("click", (event) => {
    if (event.target.closest(".sort-container .sort-btn")) {
      event.target.closest(".sort-container").querySelectorAll(".sort-btn").forEach((element) => {
        element.classList.remove("active");
      });
      const sortBtn = event.target.closest(".sort-container .sort-btn");
      sortBtn.classList.add("active");
      userKeywordsSortDirection = sortBtn.dataset.sort;
      sortKeywords(displayUserKeywords, userKeywordsSortMode, userKeywordsSortDirection);
      renderKeywords(userKeywordsContainer, displayUserKeywords, currentUserPage);
      renderPages(userKeywordsContainer, displayUserKeywords, currentUserPage);
    }

    if (event.target.closest(".sort-container .remove-filters")) {
      displayUserKeywords = [...userKeywords];
      userKeywordsFilterQuery = "";
      userKeywordsSortMode = "sort-by-name";
      userKeywordsSortDirection = "";
      event.target.closest(".filters-container").querySelectorAll(".sort-btn").forEach((element) => {
        element.classList.remove("active");
      });
      event.target.closest(".filters-container").querySelector(".sort-dropdown").value = userKeywordsSortMode;
      event.target.closest(".filters-container").querySelector(".search-keyword").value = userKeywordsFilterQuery;
      renderKeywords(userKeywordsContainer, displayUserKeywords, currentUserPage);
      renderPages(userKeywordsContainer, displayUserKeywords, currentUserPage);
    }

    if (event.target.closest(".highlight")) {
      const keywordIndex = event.target.closest("li")?.dataset.keywordIndex;
      uncheckHighlightKeywordCheckbox();
      highlightKeyword(displayUserKeywords[keywordIndex].keyword);
    }

    if (event.target.closest(".view-details")) {
      const keywordIndex = event.target.closest("li")?.dataset.keywordIndex;
      renderDetailsPage(displayUserKeywords, keywordIndex);
    }

    if (event.target.closest("ol.pages-container button:not(.active)")) {
      currentUserPage = parseInt(event.target.dataset.page);
      renderKeywords(userKeywordsContainer, displayUserKeywords, currentUserPage);
      renderPages(userKeywordsContainer, displayUserKeywords, currentUserPage);
    }
  });
}

function sortKeywords(keywords, sortMode, sortDirection) {
  keywords.sort((a, b) => {
    let compare;
    if (sortMode === "sort-by-score") {
      compare = a.relevanceScore - b.relevanceScore;
    } else if(sortMode === "sort-by-name") {
      compare = a.keyword.localeCompare(b.keyword, undefined, { sensitivity: 'base' });
    }
    return (sortDirection === "asc") ? compare : -compare;
  });
}

function filterKeywords(keywords, filterQuery) {
  const pattern = new RegExp(`${filterQuery}`, "i");
  const filteredKeywords = keywords.filter((keywordObj) => {
    return pattern.test(keywordObj.keyword);
  });
  return filteredKeywords;
}

function updateVisibleKeywords(displayKeywords, keywords, filterQuery, sortMode, sortDirection) {
  const result = filterQuery ? filterKeywords(keywords, filterQuery) : [...keywords];

  if (sortMode && sortDirection) {
    sortKeywords(result, sortMode, sortDirection);
  }

  displayKeywords.splice(0, displayKeywords.length, ...result);
}

/* function showPages() {
  const pages = document.createElement("ol");
  pages.classList.add("pages-container");
  const totalPages = Math.ceil(keywords.length / offset);
  for (let i = 0; i < totalPages; i++) {
    const page = document.createElement("li");
    page.innerHTML = `
      <button class="${i === 0 ? 'active' : ''}">${i + 1}</button>
    `;
    page.querySelector("button").addEventListener("click", togglePages);
    pages.appendChild(page);
  }
  document.querySelector(".meta-keywords-container").appendChild(pages);
}

function togglePages(event) {
  const page = event.target;
  if (page.classList.contains("active")) return;
  toggleMetaKeywords(page.textContent.trim() - 1);
  const pages = document.querySelectorAll(".pages-container li button");
  pages.forEach(page => page.classList.remove("active"));
  page.classList.add("active");
} */

function renderPages(keywordsContainer, keywords, currentPage = 1) {
  const pagesList = document.createElement("ol");
  pagesList.classList.add("pages-container");
  const totalPages = Math.ceil(keywords.length / pageSize);
  const range = Array.from({length: 5}, (_, i) => currentPage - 2 + i);
  const pages = [...new Set([1, ...range, totalPages].filter(p => p >= 1 && p <= totalPages))];
  pages.forEach((page, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <button class="${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>
    `;
    pagesList.appendChild(item);
    const nextPage = pages[index + 1] ?? null;
    if (nextPage && nextPage !== page + 1) {
      const item = document.createElement("li");
      item.classList.add("placeholder-page");
      item.textContent = "...";
      pagesList.appendChild(item);
    }
  });
  const existingPagesList = keywordsContainer.querySelector("ol.pages-container");
  if (existingPagesList) {
    keywordsContainer.replaceChild(pagesList, existingPagesList);
  } else {
    keywordsContainer.appendChild(pagesList);
  }
} 

function renderDetailsPage(keywords, keywordIndex) {
  const detailsView = document.getElementById("detailsView");
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  detailsView.classList.remove("hidden");
  const keywordObj = keywords[keywordIndex];
  detailsView.innerHTML = `
    <h1>Keyword analysis results</h1>
    <div class="analysis-container">
      <h2>Keyword:</h2>
      <p>${keywordObj.keyword}</p>
    </div>
    <div class="analysis-container">
      <div class="detailed-information">
        <h2>Structural importance score:</h2>
        <div class="tooltip" tabindex="0" aria-describedby="tooltip-text">
          <div class="tooltip-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon icon-micro">
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
            </svg>    
            <span id="tooltip-text" class="not-visible">The structural importance score highlights the impact of a keyword in strategic points of the page (title, meta description, H1-H6 tags, links, image alt attribute).</span>
          </div>                            
        </div>
      </div>  
      <div class="score-container">
        <p class="${
          keywordObj.relevanceScore < 50 ? 'low-score' : 
          keywordObj.relevanceScore < 80 ? 'medium-score' :
          'high-score'
        }">${keywordObj.relevanceScore}</p>
      </div>
    </div>
    <div class="analysis-container">
      <h2>Frequency:</h2>
      <p>${keywordObj.frequency}</p>
    </div>
    <div class="analysis-container">
      <h2>Density:</h2>
      <p>${keywordObj.density}%</p>
    </div>
    <div class="analysis-container">
      <h2>Tag occurrences:</h2>
      <ul>
        ${Object.entries(keywordObj.tagData)
          .map(([key, value]) => `<li><h3>${key.toUpperCase()}</h3><p>${value.keywordOccurrences}</p></li>`)
          .join('')}
      </ul>
    </div>
  `;
  const anchor = document.getElementById("sidebar-header");
  if (anchor) {
    anchor.scrollIntoView();
  }
  const tooltip = detailsView.querySelectorAll(".tooltip-content");
  tooltip.forEach((element) => {
    element.addEventListener("mouseover", toggleTooltip);
  });
  tooltip.forEach((element) => {
    element.addEventListener("mouseout", toggleTooltip);
  });
}

function isItemVisible(keywords, keywordObj, currentPage = 1) {
  let page = currentPage - 1;
  let start = page * pageSize;
  let end = start + pageSize;
  const visibleKeywords = keywords.slice(start, end);
  return visibleKeywords.includes(keywordObj);
}

async function analyzeKeyword(event) {
  const keyword = document.getElementById("insert-keyword")?.value.trim();
  const userKeywordsContainer = document.querySelector(".user-keywords-container");
  if (!keyword || keyword.length <= 0) return; 
  const keywordObj = new KeywordAnalysis(keyword, walker, totalWords);
  userKeywords.push(keywordObj);
  if (userKeywords.slice(0, -1).length <= 0) {
    renderUserKeywordsContainer();
  }
  displayUserKeywords = [...userKeywords];
  if (isItemVisible(displayUserKeywords, keywordObj, currentUserPage)) {
    renderKeywords(userKeywordsContainer, displayUserKeywords, currentUserPage);
    renderPages(userKeywordsContainer, displayUserKeywords, currentUserPage);
  }
  await keywordObj.analyze();
  if (isItemVisible(displayUserKeywords, keywordObj, currentUserPage)) {
    renderKeywords(userKeywordsContainer, displayUserKeywords, currentUserPage);
    renderPages(userKeywordsContainer, displayUserKeywords, currentUserPage);
  }
}

function updateHighlightBg(event) {
  const tag = event.target.closest('.keywords-highlight-colors-container ul li')?.querySelector('h3').textContent.trim();
  const value = event.target.value;
  document.documentElement.style.setProperty(`--highlight-${tag}-bg-color`, value);
}

function updateHighlightColor(event) {
  const tag = event.target.closest('.keywords-highlight-colors-container ul li')?.querySelector('h3').textContent.trim();
  const value = event.target.value;
  document.documentElement.style.setProperty(`--highlight-${tag}-color`, value);
}

function updateHighlightBorder(event) {
  const tag = event.target.closest('.keywords-highlight-colors-container ul li')?.querySelector('h3').textContent.trim();
  const value = event.target.value;
  document.documentElement.style.setProperty(`--highlight-${tag}-border-color`, value);
}

function addHighlightColorElement(element) {
  const highlightColorsList = document.querySelector(".keywords-highlight-colors-container ul");
  let item = document.createElement("li");
  const highlightBg = getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${element}-bg-color`);
  const highlightColor = getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${element}-color`);
  const highlightBorder = getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${element}-border-color`);
  const itemContent = `
    <h3>${element}</h3>
    <div class="change-color">
      <label for="highlight-bg-${element}">Background color</label>
      <input type="color" id="highlight-bg-${element}" name="highlight-bg" value="${highlightBg}">
    </div>
    <div class="change-color">
      <label for="highlight-color-${element}">Text Color</label>
      <input type="color" id="highlight-color-${element}" name="highlight-color" value="${highlightColor}">
    </div>
    <div class="change-color">
      <label for="highlight-border-${element}">Border color</label>
      <input type="color" id="highlight-border-${element}" name="highlight-border" value="${highlightBorder}">
    </div>
  `;
  item.innerHTML = itemContent;
  highlightColorsList.appendChild(item);
  document.getElementById(`highlight-bg-${element}`).addEventListener("change", updateHighlightBg);
  document.getElementById(`highlight-color-${element}`).addEventListener("change", updateHighlightColor);
  document.getElementById(`highlight-border-${element}`).addEventListener("change", updateHighlightBorder);
}

function toggleSettingsView() {
  const settingsView = document.getElementById("settingsView");
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  settingsView.classList.remove("hidden");
}

function toggleDashboardView() {
  const dashboardView = document.getElementById("dashboardView");
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  dashboardView.classList.remove("hidden");
}

function toggleSidebar() {
  const sidebar = document.getElementById("keywords-seo-sidebar");
  sidebar.classList.toggle("not-transparent");
  sidebar.classList.toggle("transparent");
  sidebar.classList.toggle("visible");
  sidebar.classList.toggle("not-visible");
  sidebar.classList.toggle("translate-x-0");
  sidebar.classList.toggle("translate-x-100");
  sidebar.classList.toggle("flex-0");
}

function uncheckHighlightKeywordCheckbox() {
  const highlightInputKeyword = document.getElementById("highlight-input-keyword");
  highlightInputKeyword.checked = false;
}

window.addEventListener("load", function() {
  loadKeywordsAnalysisOverview();

  const tooltip = document.querySelectorAll(".tooltip-content");
  tooltip.forEach((element) => {
    element.addEventListener("mouseover", toggleTooltip);
  });
  tooltip.forEach((element) => {
    element.addEventListener("mouseout", toggleTooltip);
  });

  allowedTags.forEach(addHighlightColorElement);

  //keywords.forEach(addMetaKeywordsElement);
  //toggleMetaKeywords();
  //showPages();
  renderMetaKeywordsContainer();

  const logo = document.getElementById("logo");
  logo.addEventListener("click", toggleDashboardView);

  const settingsBtn = document.getElementById("settings-button");
  settingsBtn.addEventListener("click", toggleSettingsView);

  const closeBtn = document.getElementById("close-button");
  closeBtn.addEventListener("click", toggleSidebar);

  const openBtn = document.getElementById("open-button");
  openBtn.addEventListener("click", toggleSidebar);

  const highlightKeywordCheckbox = document.getElementById("highlight-input-keyword");
  highlightKeywordCheckbox.addEventListener("change", toggleHighlight);

  const insertKeywordInput = document.getElementById("insert-keyword");
  insertKeywordInput.addEventListener("focus", uncheckHighlightKeywordCheckbox);

  const analyzeKeywordBtn = document.getElementById("analyze-keyword-btn");
  analyzeKeywordBtn.addEventListener("click", analyzeKeyword);
});
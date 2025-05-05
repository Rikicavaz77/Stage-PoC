//import stopwords from 'https://cdn.jsdelivr.net/gh/stdlib-js/datasets-stopwords-en@esm/index.mjs';

const disallowedTags = ['script', 'style', 'noscript', 'textarea', 'button', 'aside'];
const allowedTags = ['p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const disallowedInlineTags = ['a', 'button', 'label'];

function isValidInlineElement(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  if (disallowedInlineTags.includes(node.tagName.toLowerCase())) return false;
  const display = window.getComputedStyle(node).display;
  return display.startsWith("inline");
}

function isAllParentsValid(node) {
  while ((node = node.parentNode)) {
    if (disallowedTags.includes(node.nodeName.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function getValidParent(node) {
  while ((node = node.parentNode)) {
    if (!isValidInlineElement(node)) {
      return node;
    }
  }
  return document.body;
}

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

/* function highlightKeyword(keyword) {
  const textNodes = [];
  let node;
  while((node = walker.nextNode())) {
    textNodes.push(node);
  }

  keyword = keyword.trim();
  const keywordParts = keyword.split(/\s+/);
  keyword = keywordParts.join(" ");
  const pattern = new RegExp(`${keyword}`, "gi");
  let relatedTagsMap = [];
  let virtualText = "";
  textNodes.forEach((node, index) => {
    const nodeStart = virtualText.length + (node.nodeValue.length - node.nodeValue.trimStart().length);
    relatedTagsMap.push({
      node: node,
      start: nodeStart,
      end: nodeStart + node.nodeValue.trim().length
    }); 
    virtualText += node.nodeValue;
    const nextNode = textNodes[index + 1];
    if (keywordParts.length > 1 && nextNode && getValidParent(node) === getValidParent(nextNode)) {
      virtualText += " ";
    } else {
      console.log(virtualText);
      virtualText = virtualText.trim().split(/\s+/).join(" ");
      const matches = [...virtualText.matchAll(pattern)].map((match) => ({
        matchStart: match.index,
        matchEnd: match.index + match[0].length
      }));
      console.log(matches);
      if (matches.length > 0) {
        if (relatedTagsMap.length > 1) {
          console.log(relatedTagsMap);
          relatedTagsMap.forEach(({ node, start, end }) => {
            const validMatches = matches
              .filter(({ matchStart, matchEnd }) => {
                return (matchStart < end && matchEnd > start); // match overlaps this node
              })
              .map(({ matchStart, matchEnd }) => {
                return {
                  matchStart: Math.max(0, matchStart - start),
                  matchEnd: Math.min(end - start, matchEnd - start)
                };
              });
            highlightMatches(node, validMatches);
          });
        } else {
          highlightMatches(node, matches);
        }
      }
      virtualText = "";
      relatedTagsMap = [];
    }
  });
}

function highlightMatches(node, matches) {
  if (!matches || matches.length === 0 || !node.parentNode) return;

  const text = node.nodeValue;
  const parent = node.parentNode;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach(({ matchStart, matchEnd }) => {
    if (matchStart > lastIndex) {
      const newTextNode = document.createTextNode(text.slice(lastIndex, matchStart));
      fragment.appendChild(newTextNode);
    }

    const span = document.createElement("span");
    span.style.backgroundColor = "yellow";
    span.classList.add("highlight-keyword");
    span.textContent = text.slice(matchStart, matchEnd);
    fragment.appendChild(span);

    lastIndex = matchEnd;
  });

  if (lastIndex < text.length) {
    const newTextNode = document.createTextNode(text.slice(lastIndex));
    fragment.appendChild(newTextNode);
  }

  parent.replaceChild(fragment, node);  
} */

/* function highlightKeyword(keyword) {
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Normalizza la keyword
  keyword = keyword.trim().replace(/\s+/g, " ");
  const pattern = new RegExp(keyword, "gi");

  // Costruisci testo virtuale e mappa
  let fullText = "";
  const map = []; // ogni elemento: { node, startIndex, endIndex }

  textNodes.forEach((n) => {
    const startIndex = fullText.length;
    fullText += n.nodeValue;
    const endIndex = fullText.length;
    map.push({ node: n, startIndex, endIndex });
  });

  const matches = [...fullText.matchAll(pattern)];

  for (const { index: matchStart } of matches) {
    const matchEnd = matchStart + keyword.length;

    // Trova i nodi che contengono questa porzione
    for (const { node, startIndex, endIndex } of map) {
      if (matchEnd <= startIndex) break;
      if (matchStart >= endIndex) continue;

      const localStart = Math.max(0, matchStart - startIndex);
      const localEnd = Math.min(node.nodeValue.length, matchEnd - startIndex);

      highlightInNode(node, localStart, localEnd);
    }
  }
}

function highlightInNode(node, start, end) {
  const text = node.nodeValue;
  const parent = node.parentNode;
  if (!parent) return;

  const fragment = document.createDocumentFragment();

  if (start > 0) {
    fragment.appendChild(document.createTextNode(text.slice(0, start)));
  }

  const span = document.createElement("span");
  span.style.backgroundColor = "yellow";
  span.className = "highlight-keyword";
  span.textContent = text.slice(start, end);
  fragment.appendChild(span);

  if (end < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(end)));
  }

  parent.replaceChild(fragment, node);
} */


/* function highlightKeyword(keyword) {
  const keywordParts = keyword.trim().split(/\s+/);
  const normalizedKeyword = keywordParts.join(" ");
  const pattern = new RegExp(normalizedKeyword, "gi");

  const groupedNodes = [];
  let currentGroup = [];
  let currentParent = null;

  let node;
  while ((node = walker.nextNode())) {
    const parent = getValidParent(node);
    if (parent !== currentParent) {
      if (currentGroup.length > 0) {
        groupedNodes.push({ nodes: currentGroup, parent: currentParent });
      }
      currentGroup = [node];
      currentParent = parent;
    } else {
      currentGroup.push(node);
    }
  }
  if (currentGroup.length > 0) {
    groupedNodes.push({ nodes: currentGroup, parent: currentParent });
  }

  groupedNodes.forEach(({ nodes }) => {
    let virtualText = "";
    const map = [];

    nodes.forEach((n) => {
      const start = virtualText.length;
      virtualText += n.nodeValue;
      const end = virtualText.length;
      map.push({ node: n, start, end });
    });

    const matches = [...virtualText.matchAll(pattern)];

    matches.forEach(({ index }) => {
      const matchStart = index;
      const matchEnd = matchStart + normalizedKeyword.length;

      map.forEach(({ node, start, end }) => {
        if (matchEnd <= start || matchStart >= end) return;

        const localStart = Math.max(0, matchStart - start);
        const localEnd = Math.min(node.nodeValue.length, matchEnd - start);
        highlightInNode(node, localStart, localEnd);
      });
    });
  });
}

function highlightInNode(node, start, end) {
  if (start >= end) return;
  const text = node.nodeValue;
  const parent = node.parentNode;
  if (!parent) return;

  const fragment = document.createDocumentFragment();

  if (start > 0) {
    fragment.appendChild(document.createTextNode(text.slice(0, start)));
  }

  const span = document.createElement("span");
  span.style.backgroundColor = "yellow";
  span.classList.add("highlight-keyword");
  span.textContent = text.slice(start, end);
  fragment.appendChild(span);

  if (end < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(end)));
  }

  parent.replaceChild(fragment, node);
} */

function highlightKeyword(keyword) {
  const keywordParts = keyword.trim().split(/\s+/);
  const flexiblePattern = keywordParts.join("\\s+");
  const pattern = new RegExp(flexiblePattern, "gi");

  const groupedNodes = [];
  let currentGroup = [];
  let currentParent = null;
  let node;
  walker.currentNode = walker.root;
  while ((node = walker.nextNode())) {
    const parent = getValidParent(node);
    if (parent !== currentParent) {
      if (currentGroup.length > 0) {
        groupedNodes.push({ nodes: currentGroup, parent: currentParent });
      }
      currentGroup = [node];
      currentParent = parent;
    } else {
      currentGroup.push(node);
    }
  }
  if (currentGroup.length > 0) {
    groupedNodes.push({ nodes: currentGroup, parent: currentParent });
  }

  groupedNodes.forEach(({ nodes }) => {
    let virtualText = "";
    const map = [];

    nodes.forEach((n) => {
      if (!n.nodeValue.trim()) {
        console.log(n.nodeValue);
        const text = n.nodeValue.replace(/\s+/, " ");
        virtualText += text;
      } else {
        const start = virtualText.length;
        virtualText += n.nodeValue;
        const end = virtualText.length;
        map.push({ node: n, start, end });
      }
    });

    const matches = [...virtualText.matchAll(pattern)];

    map.forEach(({ node, start, end }) => {
      const nodeMatches = matches
        .filter((match) => {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;
          return matchEnd > start && matchStart < end;
        })
        .map((match) => {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;
          return {
            matchStart: Math.max(0, matchStart - start),
            matchEnd: Math.min(node.nodeValue.length, matchEnd - start)
          };
        });

      if (nodeMatches.length > 0) {
        highlightMatches(node, nodeMatches);
      }
    });
  });
}

function highlightMatches(node, matches) {
  const text = node.nodeValue;
  const parent = node.parentNode;
  if (!parent) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.sort((a, b) => a.matchStart - b.matchStart);

  for (const { matchStart, matchEnd } of matches) {
    if (matchStart > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
    }

    const span = document.createElement("span");
    span.classList.add("highlight-keyword");
    span.style.backgroundColor = "yellow";
    span.textContent = text.slice(matchStart, matchEnd);
    fragment.appendChild(span);

    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  parent.replaceChild(fragment, node);
}

function countKeyword(keyword) {
  // 1) ricostruisci virtualText e map
  // 2) crea pattern e trova matches
  let counts = {};
  for (const match of virtualText.matchAll(pattern)) {
    const matchStart = match.index;
    const entry = map.find(({ start, end }) =>
      matchStart >= start && matchStart < end
    );
    const tag = findContainerTag(entry.node);
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

function findTwoWordsKeyphrases() {
  const groupedNodes = [];
  let currentGroup = [];
  let currentParent = null;
  let node;
  walker.currentNode = walker.root;
  while ((node = walker.nextNode())) {
    const parent = getValidParent(node);
    if (parent !== currentParent) {
      if (currentGroup.length > 0) {
        groupedNodes.push({ nodes: currentGroup, parent: currentParent });
      }
      currentGroup = [node];
      currentParent = parent;
    } else {
      currentGroup.push(node);
    }
  }
  if (currentGroup.length > 0) {
    groupedNodes.push({ nodes: currentGroup, parent: currentParent });
  }

  const twoWordsMap = new Map();
  groupedNodes.forEach(({ nodes }) => {
    let virtualText = "";

    nodes.forEach((n) => {
      if (!n.nodeValue.trim()) {
        const text = n.nodeValue.replace(/\s+/, " ");
        virtualText += text;
      } else {
        virtualText += n.nodeValue;
      }
    });

    const pattern = /[\p{L}\p{N}]+(?:['’\-_.][\p{L}\p{N}]+)*['’]?/gu;
    const matches = [...virtualText.toLowerCase().matchAll(pattern)].map((match) => {
      return match[0]
    });
    //const filteredWords = [...sw.removeStopwords(matches, [...sw.eng])];
    //const stopWords = stopwords();
    matches.forEach((word, index) => {
      const nextWord = matches[index + 1];
      if (word && nextWord && [...sw.removeStopwords([word, nextWord], [...sw.eng])].length === 2) {
        const words = word + " " + nextWord;
        if (!twoWordsMap.has(words)) {
          twoWordsMap.set(words, 1);
        } else {
          twoWordsMap.set(words, twoWordsMap.get(words) + 1);
        }
      }
    });
  });
  //const stopWords = stopwords();
  //const filteredWords = words.filter(word => !stopWords.includes(word));
  console.log(twoWordsMap);
  const relevantWords = [...twoWordsMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(relevantWords);
}
window.findTwoWordsKeyphrases = findTwoWordsKeyphrases;

window.addEventListener("load", function() {
  findTwoWordsKeyphrases();
});
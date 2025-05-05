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

function highlightKeyword(keyword) {
  const textNodes = [];
  let node;
  while((node = walker.nextNode())) {
    textNodes.push(node);
  }

  keyword = keyword.trim();
  const pattern = new RegExp(`${keyword}`, "gi");
  //const keywordParts = keyword.split(/([ ._-])/);
  //const keywordParts = keyword.split(/\s+/);
  const keywordParts = keyword.split(/(\s+)/);
  const relatedTagsMap = new Map();
  textNodes.forEach((node, index) => {
    if (node.nodeValue.trim()) {
      const matches = buildMatchesForNode(textNodes, index, pattern, keywordParts, relatedTagsMap);
      highlightMatches(node, matches);
    }
  });
}

function buildMatchesForNode(textNodes, index, pattern, keywordParts, relatedTagsMap) {
  const node = textNodes[index];
  const matches = [...node.nodeValue.matchAll(pattern)].map((match) => ({
    matchStart: match.index,
    matchEnd: match.index + match[0].length
  }));

  const nextNode = textNodes[index + 1];
  const sameParent = nextNode && getValidParent(node) === getValidParent(nextNode);
  if (keywordParts.length > 1 && sameParent) {
    const crossTagMatches = getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, 0, keywordParts.length - 1);
    for (const [matchedNode, matchList] of crossTagMatches) {
      if (!relatedTagsMap.has(matchedNode)) {
        relatedTagsMap.set(matchedNode, matchList);
      } else {
        relatedTagsMap.get(matchedNode).push(...matchList);
      }
    }
  }

  if (relatedTagsMap.has(node)) {
    matches.push(...relatedTagsMap.get(node));
    matches.sort((a, b) => a.matchStart - b.matchStart);
    console.log(matches);
  }
  
  return matches;
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
}

/* function getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, start, end) {
  const map = new Map();
  const node = textNodes[index];

  if (!node || end <= start) return map;

  let pattern;
  if (start === 0) {
    pattern = new RegExp(`${keywordParts.slice(start, end).join(' ')}[ ]*`, "gi");
  } else {
    if (end < keywordParts) {
      pattern = new RegExp(`[ ]*${keywordParts.slice(start, end).join(' ')}[]*`, "gi");
    } else {
      pattern = new RegExp(`[ ]*${keywordParts.slice(start, end).join(' ')}`, "gi");
    }
  }
  const pattern = new RegExp(`${keywordParts.slice(start, end).join(' ')}`, "gi");
  const matches = [...node.nodeValue.matchAll(pattern)];

  if (matches.length === 0) {
    return getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, start, end - 1);
  }

  const match = start === 0 ? matches.at(-1) : matches.at(0);
  const matchStart = match.index;
  const matchEnd = match.index + match[0].length;

  const isFullMatch = matchStart === 0 && matchEnd === node.nodeValue.length;
  const endsAtNodeBoundary = matchEnd === node.nodeValue.length;
  const isEndReached = end === keywordParts.length;

  if (start !== 0 && matchStart === 0 && isEndReached) {
    addMatchToMap(map, node, match);
    return map;
  } else if (start === 0 && endsAtNodeBoundary && isEndReached) {
    return map;
  } else if ((start === 0 && endsAtNodeBoundary) || (start !== 0 && isFullMatch)) {
    const nextNode = textNodes[index + 1];
    if (!nextNode || getValidParent(node) !== getValidParent(nextNode)) {
      return map;
    }
    const nextMatchesMap = getKeywordMatchesAcrossMultipleTags(textNodes, index + 1, keywordParts, end, keywordParts.length);
    if (nextMatchesMap.size > 0) {
      addMatchToMap(map, node, match);
      for (const [key, value] of nextMatchesMap) {
        map.set(key, value);
      }
    }
    return map;
  }
  return getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, start, end - 1);
} */

function getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, start, end) {
  const map = new Map();
  const node = textNodes[index];

  if (!node || end <= start) return map;

  const isEndReached = end === keywordParts.length;
  let pattern;
  if (start === 0) {
    //pattern = new RegExp(`${keywordParts.slice(start, end).join(' ')}(?=[\\s]*$)`, "i");
    pattern = new RegExp(`${keywordParts.slice(start, end).join('')}(?=[\\s]*$)`, "i");
  } else {
    if (!isEndReached) {
      pattern = new RegExp(`(?<=^[\\s]*)${keywordParts.slice(start, end).join('')}(?=[\\s]*$)`, "i");
    } else {
      pattern = new RegExp(`(?<=^[\\s]*)${keywordParts.slice(start, end).join('')}`, "i");
    }
  }
  
  let match;
  if (!node.nodeValue.trim()) {
    match = node.nodeValue.replace(/\s+/g, " ").match(pattern) || [];
  } else {
    match = node.nodeValue.match(pattern) || [];
  }

  if (!node.nodeValue.trim()) {
    if (match.length === 0 && keywordParts.length > 1) {
      return getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, start, end - 1);
    }
    const nextNode = textNodes[index + 1];
    if (!nextNode || getValidParent(node) !== getValidParent(nextNode)) {
      return map;
    }
    if (match.length === 0) {
      return getKeywordMatchesAcrossMultipleTags(textNodes, index + 1, keywordParts, start, end);
    } else {
      return getKeywordMatchesAcrossMultipleTags(textNodes, index + 1, keywordParts, end, keywordParts.length);
    }
  }

  if (match.length === 0) {
    return getKeywordMatchesAcrossMultipleTags(textNodes, index, keywordParts, start, end - 1);
  }

  if (start !== 0 && isEndReached) {
    addMatchToMap(map, node, match);
    return map;
  } else if (start === 0 && isEndReached) {
    return map;
  } else {
    const nextNode = textNodes[index + 1];
    if (!nextNode || getValidParent(node) !== getValidParent(nextNode)) {
      return map;
    }
    const nextMatchesMap = getKeywordMatchesAcrossMultipleTags(textNodes, index + 1, keywordParts, end, keywordParts.length);
    if (nextMatchesMap.size > 0) {
      addMatchToMap(map, node, match);
      for (const [key, value] of nextMatchesMap) {
        map.set(key, value);
      }
    }
    return map;
  }
}

function addMatchToMap(map, node, match) {
  const entry = {
    matchStart: match.index,
    matchEnd: match.index + match[0].length
  };
  if (!map.has(node)) {
    map.set(node, [entry]);
  } else {
    map.get(node).push(entry);
  }
}

export class KeywordAnalysis {
  constructor(keyword, treeWalker, totalWords, status = "analyzing") {
    this.keyword = keyword;
    this.treeWalker = treeWalker;
    this.totalWords = totalWords;
    this.status = status;
    this.frequency = 0;
    this.density = 0;
    this.tagData = {
      title:      { keywordOccurrences: 0, weight: 10, tagOccurrences: 0 },
      description:{ keywordOccurrences: 0, weight: 6, tagOccurrences: 0 },
      keywords:   { keywordOccurrences: 0, weight: 0, tagOccurrences: 0 },
      h1:         { keywordOccurrences: 0, weight: 5, tagOccurrences: 0 },
      h2:         { keywordOccurrences: 0, weight: 4, tagOccurrences: 0 },
      h3:         { keywordOccurrences: 0, weight: 3, tagOccurrences: 0 },
      h4:         { keywordOccurrences: 0, weight: 2, tagOccurrences: 0 },
      h5:         { keywordOccurrences: 0, weight: 2, tagOccurrences: 0 },
      h6:         { keywordOccurrences: 0, weight: 2, tagOccurrences: 0 },
      p:          { keywordOccurrences: 0, weight: 0, tagOccurrences: 0 },
      a:          { keywordOccurrences: 0, weight: 1.5, tagOccurrences: 0 },
      alt:        { keywordOccurrences: 0, weight: 2.5, tagOccurrences: 0 }
    };
    this.pattern = this.definePattern();
    this.relevanceScore = 0;
    /* this.weights = {
      title: 10,
      description: 6,
      keywords: 4,     
      p: 1.5,
      h1: 5,
      h2: 4,
      h3: 3,
      h4: 2,
      h5: 2,
      h6: 2,
      a: 1.5,
      alt: 2.5,
      frequency: 1,
      density: 2
    };
    this.relevanceScore = 0;
    this.idealTagOccurrences = {
      title: 1,
      description: 1,
      keywords: 1,     
      p: this.totalWords / 100,
      h1: 1,
      h2: this.totalWords / 350,
      h3: this.totalWords / 500,
      h4: this.totalWords / 500,
      h5: this.totalWords / 500,
      h6: this.totalWords / 500,
      a: this.totalWords / 200,
      alt: this.totalWords / 300
    };
    this.idealDensity = 1.5;
    this.idealFrequency = this.idealDensity * this.totalWords;
    this.idealScore = 0;
    this.calculateIdealScore(); */
  }

  /* calculateIdealScore() {
    let tagWeightSum = 0;
    Object.entries(this.idealTagOccurrences).forEach(([tag, occurrences]) => {
      const weight = this.weights[tag] || 0;
      tagWeightSum += occurrences * weight;
    });
    this.idealScore = (this.weights.frequency * this.idealFrequency) + (this.weights.density * this.idealDensity) + tagWeightSum;
  }
  
  calculateRelevanceScore() {
    let tagWeightSum = 0;
    Object.entries(this.tagOccurrences).forEach(([tag, occurrences]) => {
      const weight = this.weights[tag] || 0;
      tagWeightSum += occurrences * weight;
    });
    this.relevanceScore = (this.weights.frequency * this.frequency) + (this.weights.density * this.density) + tagWeightSum;
    this.relevanceScore = Math.min(100, Math.max(0, (this.relevanceScore / this.idealScore) * 100));
  } */

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  definePattern() {
    return new RegExp(`(?<![\\p{L}\\p{N}]|[\\p{L}\\p{N}][\-_.])${this.escapeRegExp(this.keyword)}(?![\\p{L}\\p{N}]|[\-_.][\\p{L}\\p{N}])`, 'giu');
  }

  calculateFrequency() {
    this.treeWalker.currentNode = this.treeWalker.root;
    let node;
    while ((node = this.treeWalker.nextNode())) {
      const matches = node.nodeValue.match(this.pattern) || [];
      this.frequency += matches.length;
    }
  }

  countOccurrencesInTag(tagName) {
    const tags = Array.from(document.querySelectorAll(`${tagName}`)).filter(tag => {
      return !tag.closest("aside");
    });
    this.tagData[tagName].tagOccurrences = tags.length;
    tags.forEach((tag) => {
      const tagContent = tag.innerText;
      const matches = tagContent.match(this.pattern) || [];
      this.tagData[tagName].keywordOccurrences += matches.length;
    });
  }

  countOccurrencesInMetaTag(tagName) {
    const tag = document.querySelector(`meta[name='${tagName}' i]`);
    this.tagData[tagName].tagOccurrences = tag ? 1 : 0;
    const tagContent = tag?.content;
    if (tagContent) {
      const matches = tagContent.match(this.pattern) || [];
      this.tagData[tagName].keywordOccurrences = matches.length;
    }
  } 

  countOccurrencesInAltAttributes() {
    const tags = Array.from(document.querySelectorAll("img[alt]")).filter(tag => {
      return !tag.closest("aside");
    });
    this.tagData.alt.tagOccurrences = tags.length;
    tags.forEach((tag) => {
      const tagContent = tag.alt;
      const matches = tagContent.match(this.pattern) || [];
      this.tagData.alt.keywordOccurrences += matches.length;
    });
  } 

  calculateRelevanceScore() {
    let score = 0;
    let maxScore = 0;
    Object.entries(this.tagData).forEach(([_, data]) => {
      if (data.weight && data.tagOccurrences > 0) {
        score += (data.keywordOccurrences / data.tagOccurrences) * data.weight;
        maxScore += data.weight;
      }
    });
    this.relevanceScore = Math.ceil((score / maxScore) * 100);
  }

  async analyze() {
    this.calculateFrequency();
    this.density = ((this.frequency / Math.max(1, this.totalWords)) * 100).toFixed(2);
    this.countOccurrencesInTag("title");
    this.countOccurrencesInMetaTag("description");
    this.countOccurrencesInMetaTag("keywords");
    for (let i = 1; i <= 6; i++) {
      this.countOccurrencesInTag(`h${i}`);
    }
    this.countOccurrencesInTag("p");
    this.countOccurrencesInTag("a");
    this.countOccurrencesInAltAttributes();
    this.calculateRelevanceScore();
    this.status = "done";
  }
}
export class KeywordAnalysis {
  constructor(keyword, treeWalker, totalWords, status = "analyzing") {
    this.keyword = keyword;
    this.treeWalker = treeWalker;
    this.totalWords = totalWords;
    this.status = status;
    this.frequency = 0;
    this.density = 0;
    this.tagOccurrences = {
      title: 0,
      description: 0,
      keywords: 0,     
      p: 0,
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
      a: 0,
      alt: 0
    };
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

  countOccurrencesInTags(tagName) {
    const tags = document.querySelectorAll("title");
    tags.forEach((tag) => {
      const tagContent = tag.innerText;
      const pattern = this.definePattern();
      const matches = tagContent.match(pattern) || [];
      this.tagOccurrences[tagName] += matches.length;
    });
  }

  countOccurrencesInMetaTags(tagName) {
    const tag = document.querySelector(`meta[name='${tagName}' i]`);
    const tagContent = tag?.content;
    if (tagContent) {
      const pattern = this.definePattern();
      const matches = tagContent.match(pattern) || [];
      this.tagOccurrences[tagName] = matches.length;
    }
  } 

  async analyze() {
    this.frequency = Math.floor(Math.random() * 100);
    this.density = (this.frequency / this.totalWords) * 100;
    this.countOccurrencesInTags("title");
    this.countOccurrencesInMetaTags("description");
    this.countOccurrencesInMetaTags("keywords");
    this.relevanceScore = Math.floor(Math.random() * 100);
    //this.calculateRelevanceScore();
    this.status = "done";
  }
}
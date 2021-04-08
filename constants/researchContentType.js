const RESEARCH_CONTENT_TYPES = {
  UNKNOWN: 0,
  ANNOUNCEMENT: 1,
  // FINAL_RESULT: 2,
  MILESTONE_ARTICLE: 3,
  MILESTONE_BOOK: 4,
  MILESTONE_CHAPTER: 5,
  MILESTONE_CODE: 6,
  MILESTONE_CONFERENCE_PAPER: 7,
  MILESTONE_COVER_PAGE: 8,
  MILESTONE_DATA: 9,
  MILESTONE_EXPERIMENT_FINDINGS: 10,
  MILESTONE_METHOD: 11,
  MILESTONE_NEGATIVE_RESULTS: 12,
  MILESTONE_PATENT: 13,
  MILESTONE_POSTER: 14,
  MILESTONE_PREPRINT: 15,
  MILESTONE_PRESENTATION: 16,
  MILESTONE_RAW_DATA: 17,
  MILESTONE_RESEARCH_PROPOSAL: 18,
  MILESTONE_TECHNICAL_REPORT: 19,
  MILESTONE_THESIS: 20,
  0: 'UNKNOWN',
  1: 'ANNOUNCEMENT',
  // 2: 'FINAL_RESULT',
  3: 'MILESTONE_ARTICLE',
  4: 'MILESTONE_BOOK',
  5: 'MILESTONE_CHAPTER',
  6: 'MILESTONE_CODE',
  7: 'MILESTONE_CONFERENCE_PAPER',
  8: 'MILESTONE_COVER_PAGE',
  9: 'MILESTONE_DATA',
  10: 'MILESTONE_EXPERIMENT_FINDINGS',
  11: 'MILESTONE_METHOD',
  12: 'MILESTONE_NEGATIVE_RESULTS',
  13: 'MILESTONE_PATENT',
  14: 'MILESTONE_POSTER',
  15: 'MILESTONE_PREPRINT',
  16: 'MILESTONE_PRESENTATION',
  17: 'MILESTONE_RAW_DATA',
  18: 'MILESTONE_RESEARCH_PROPOSAL',
  19: 'MILESTONE_TECHNICAL_REPORT',
  20: 'MILESTONE_THESIS'
};

let contentTypesMap = {
  [RESEARCH_CONTENT_TYPES.ANNOUNCEMENT]: { text: 'Announcement', order: 1 },
  // [RESEARCH_CONTENT_TYPES.FINAL_RESULT]: { text: 'Final Result', order: 20 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_ARTICLE]: { text: 'Article', order: 2 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_BOOK]: { text: 'Book', order: 3 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_CHAPTER]: { text: 'Chapter', order: 4 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_CODE]: { text: 'Code', order: 5 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_CONFERENCE_PAPER]: { text: 'Conference paper', order: 6 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_COVER_PAGE]: { text: 'Cover page', order: 7 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_DATA]: { text: 'Data', order: 8 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_EXPERIMENT_FINDINGS]: { text: 'Experiment findings', order: 9 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_METHOD]: { text: 'Method', order: 10 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_NEGATIVE_RESULTS]: { text: 'Negative results', order: 11 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_PATENT]: { text: 'Patent', order: 12 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_POSTER]: { text: 'Poster', order: 13 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_PREPRINT]: { text: 'Preprint', order: 14 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_PRESENTATION]: { text: 'Presentation', order: 15 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_RAW_DATA]: { text: 'Raw data', order: 16 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_RESEARCH_PROPOSAL]: { text: 'Research proposal', order: 17 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_TECHNICAL_REPORT]: { text: 'Technical report', order: 18 },
  [RESEARCH_CONTENT_TYPES.MILESTONE_THESIS]: { text: 'Thesis', order: 19 }
};

contentTypesMap = Object.keys(contentTypesMap).reduce((obj, key) => {
  obj[key] = {
    id: key,
    type: RESEARCH_CONTENT_TYPES[key].toLowerCase(),
    ...contentTypesMap[key]
  };
  return obj;
}, {});

const CONTENT_TYPES_MAP = [...Object.values(contentTypesMap)].sort((a, b) => a.order - b.order);

export { CONTENT_TYPES_MAP, RESEARCH_CONTENT_TYPES };
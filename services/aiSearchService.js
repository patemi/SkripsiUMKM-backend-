const https = require('https');
const UMKM = require('../models/Umkm');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.GROQ_TIMEOUT_MS || '12000', 10);
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CANDIDATE_TERMS = 600;

const STATIC_TERMS = [
  'umkm',
  'kuliner',
  'fashion',
  'kerajinan',
  'jasa',
  'agribisnis',
  'pertanian',
  'toko',
  'kelontong',
  'warung',
  'restoran',
  'cafe',
  'kopi',
  'bakso',
  'ayam',
  'nasi',
  'sate',
  'solo',
  'surakarta',
  'boyolali',
  'sukoharjo',
  'karanganyar',
  'wonogiri',
  'sragen',
  'klaten'
];

let candidateTermCache = {
  expiresAt: 0,
  terms: []
};

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s&.-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getUniqueStrings = (values, maxItems = 5) => {
  const seen = new Set();
  const output = [];

  for (const value of values || []) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    output.push(normalized);

    if (output.length >= maxItems) break;
  }

  return output;
};

const levenshteinDistance = (a, b) => {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (!left) return right.length;
  if (!right) return left.length;

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
};

const buildHeuristicSuggestions = (query, terms, maxSuggestions = 5) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || !Array.isArray(terms) || terms.length === 0) {
    return [];
  }

  const queryTokens = normalizedQuery.split(' ').filter((token) => token.length >= 2);
  const scored = terms
    .map((term) => {
      const normalizedTerm = normalizeText(term);
      if (!normalizedTerm) return null;

      const distances = [levenshteinDistance(normalizedQuery, normalizedTerm)];
      for (const token of queryTokens) {
        distances.push(levenshteinDistance(token, normalizedTerm));
      }

      const minDistance = Math.min(...distances);
      const startsWithBonus = normalizedTerm.startsWith(normalizedQuery) ? -1 : 0;
      const containsBonus = normalizedTerm.includes(normalizedQuery) ? -0.5 : 0;
      const score = minDistance + startsWithBonus + containsBonus;

      return {
        term: normalizedTerm,
        score,
        minDistance
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.term.length - b.term.length;
    });

  const adaptiveMaxDistance = Math.max(1, Math.ceil(normalizedQuery.length * 0.45));
  const filtered = scored
    .filter((item) => item.minDistance <= adaptiveMaxDistance || item.term.includes(normalizedQuery))
    .map((item) => item.term);

  return getUniqueStrings(filtered.length > 0 ? filtered : scored.map((item) => item.term), maxSuggestions);
};

const extractJsonFromText = (rawText) => {
  const text = String(rawText || '').trim();
  if (!text) return null;

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // continue with fallback parser
    }
  }

  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  try {
    return JSON.parse(text.slice(startIndex, endIndex + 1));
  } catch {
    return null;
  }
};

const callGroqCompletion = (apiKey, payload) => new Promise((resolve, reject) => {
  const body = JSON.stringify(payload);

  const request = https.request(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Authorization: `Bearer ${apiKey}`
    },
    timeout: REQUEST_TIMEOUT_MS
  }, (response) => {
    let responseBody = '';

    response.on('data', (chunk) => {
      responseBody += chunk;
    });

    response.on('end', () => {
      let parsedBody = null;
      try {
        parsedBody = responseBody ? JSON.parse(responseBody) : null;
      } catch {
        parsedBody = null;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        const message = parsedBody?.error?.message || `Groq request failed with status ${response.statusCode}`;
        return reject(new Error(message));
      }

      resolve(parsedBody);
    });
  });

  request.on('timeout', () => {
    request.destroy(new Error('Groq request timeout'));
  });

  request.on('error', (error) => {
    reject(error);
  });

  request.write(body);
  request.end();
});

const getCandidateTerms = async () => {
  if (candidateTermCache.expiresAt > Date.now() && candidateTermCache.terms.length > 0) {
    return candidateTermCache.terms;
  }

  const terms = new Set(STATIC_TERMS.map((term) => normalizeText(term)).filter(Boolean));

  try {
    const popularUmkm = await UMKM.find({ status: 'approved' })
      .select('nama_umkm kategori alamat')
      .sort({ views: -1, createdAt: -1 })
      .limit(700)
      .lean();

    for (const item of popularUmkm) {
      const name = normalizeText(item.nama_umkm);
      const category = normalizeText(item.kategori);
      const address = normalizeText(item.alamat);

      if (name) terms.add(name);
      if (category) terms.add(category);

      for (const token of name.split(' ')) {
        if (token.length >= 3) terms.add(token);
      }

      for (const token of category.split(' ')) {
        if (token.length >= 3) terms.add(token);
      }

      for (const token of address.split(' ').slice(0, 4)) {
        if (token.length >= 4) terms.add(token);
      }

      if (terms.size >= MAX_CANDIDATE_TERMS) {
        break;
      }
    }
  } catch (error) {
    console.warn(`Failed to load dynamic candidate terms: ${error.message}`);
  }

  const termArray = Array.from(terms).slice(0, MAX_CANDIDATE_TERMS);
  candidateTermCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    terms: termArray
  };

  return termArray;
};

const shouldUseGroq = () => Boolean(process.env.GROQ_API_KEY);

const getAISearchSuggestion = async (query, options = {}) => {
  const inputQuery = normalizeText(query);
  const maxSuggestions = Number.parseInt(options.limit || '5', 10) || 5;

  if (!inputQuery) {
    return {
      enabled: shouldUseGroq(),
      provider: shouldUseGroq() ? 'groq' : 'local-heuristic',
      model: DEFAULT_GROQ_MODEL,
      originalQuery: '',
      correctedQuery: '',
      didYouMean: null,
      suggestions: [],
      reason: 'Query kosong'
    };
  }

  const candidateTerms = await getCandidateTerms();
  const heuristicSuggestions = buildHeuristicSuggestions(inputQuery, candidateTerms, Math.max(maxSuggestions, 5));

  if (!shouldUseGroq()) {
    const fallbackDidYouMean = heuristicSuggestions[0] && heuristicSuggestions[0] !== inputQuery
      ? heuristicSuggestions[0]
      : null;

    return {
      enabled: false,
      provider: 'local-heuristic',
      model: DEFAULT_GROQ_MODEL,
      originalQuery: inputQuery,
      correctedQuery: fallbackDidYouMean || inputQuery,
      didYouMean: fallbackDidYouMean,
      suggestions: getUniqueStrings(heuristicSuggestions, maxSuggestions),
      reason: 'GROQ_API_KEY belum diset, menggunakan fallback lokal'
    };
  }

  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const contextualTerms = getUniqueStrings([
    ...heuristicSuggestions,
    ...candidateTerms.filter((term) => term.startsWith(inputQuery[0] || '')).slice(0, 40),
    ...candidateTerms.slice(0, 30)
  ], 90);

  const systemPrompt = [
    'Anda adalah asisten koreksi kata kunci pencarian UMKM Indonesia.',
    'Tugas: perbaiki typo dan berikan saran kata terdekat.',
    'Balas HANYA JSON valid dengan format:',
    '{"corrected_query":"string","suggestions":["string"],"reason":"string"}',
    'Aturan:',
    '- corrected_query adalah versi terbaik untuk pencarian.',
    '- suggestions maksimal 5 item, unik, singkat.',
    '- Boleh memberi saran mendekati walau istilah tidak ada pada known_terms.',
    '- Prioritaskan istilah Indonesia.'
  ].join('\n');

  const userPrompt = JSON.stringify({
    user_query: inputQuery,
    known_terms: contextualTerms
  });

  try {
    const completion = await callGroqCompletion(process.env.GROQ_API_KEY, {
      model,
      temperature: 0.1,
      max_tokens: 220,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const aiContent = completion?.choices?.[0]?.message?.content || '';
    const parsed = extractJsonFromText(aiContent) || {};

    const correctedQuery = normalizeText(parsed.corrected_query || inputQuery) || inputQuery;
    const aiSuggestions = getUniqueStrings(parsed.suggestions || [], maxSuggestions);

    const mergedSuggestions = getUniqueStrings([
      correctedQuery,
      ...aiSuggestions,
      ...heuristicSuggestions
    ], maxSuggestions);

    const didYouMean = correctedQuery && correctedQuery !== inputQuery
      ? correctedQuery
      : (mergedSuggestions[0] && mergedSuggestions[0] !== inputQuery ? mergedSuggestions[0] : null);

    return {
      enabled: true,
      provider: 'groq',
      model,
      originalQuery: inputQuery,
      correctedQuery,
      didYouMean,
      suggestions: mergedSuggestions,
      reason: typeof parsed.reason === 'string' && parsed.reason.trim()
        ? parsed.reason.trim()
        : 'Saran berbasis analisis typo dan kemiripan kata'
    };
  } catch (error) {
    const fallbackDidYouMean = heuristicSuggestions[0] && heuristicSuggestions[0] !== inputQuery
      ? heuristicSuggestions[0]
      : null;

    return {
      enabled: true,
      provider: 'local-heuristic',
      model,
      originalQuery: inputQuery,
      correctedQuery: fallbackDidYouMean || inputQuery,
      didYouMean: fallbackDidYouMean,
      suggestions: getUniqueStrings(heuristicSuggestions, maxSuggestions),
      reason: `Groq error, fallback lokal digunakan: ${error.message}`
    };
  }
};

module.exports = {
  getAISearchSuggestion
};

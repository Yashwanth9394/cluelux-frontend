#!/usr/bin/env node

/**
 * Extract word lists from WordleAI and convert to JSON format
 */

const fs = require('fs');
const path = require('path');

const WORDLEAI_PATH = '../WordleAI/reactwordle/src/constants';
const OUTPUT_PATH = './src/data/words';

// Files to extract
const files = [
  { input: 'validGuesses_5.ts', output: 'valid_5_letter.json', length: 5 },
  { input: 'validGuesses_6.ts', output: 'valid_6_letter.json', length: 6 },
  { input: 'validGuesses_7.ts', output: 'valid_7_letter.json', length: 7 },
  { input: 'validGuesses_8.ts', output: 'valid_8_letter.json', length: 8 },
];

console.log('🚀 Starting word list extraction...\n');

files.forEach(({ input, output, length }) => {
  try {
    const inputPath = path.join(__dirname, '..', WORDLEAI_PATH, input);
    const outputPath = path.join(__dirname, '..', OUTPUT_PATH, output);

    console.log(`📖 Reading ${input}...`);
    const content = fs.readFileSync(inputPath, 'utf-8');

    // Extract words from TypeScript array
    const match = content.match(/export const WORDS_\d+ = \[([\s\S]*?)\]/);
    if (!match) {
      throw new Error(`Could not find word array in ${input}`);
    }

    const wordsString = match[1];
    const words = wordsString
      .split(',')
      .map(line => line.trim().replace(/['"]/g, ''))
      .filter(word => word.length === length)
      .map(word => word.toLowerCase())
      .sort();

    // Remove duplicates
    const uniqueWords = [...new Set(words)];

    const data = {
      length: length,
      count: uniqueWords.length,
      words: uniqueWords,
      extracted: new Date().toISOString(),
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Extracted ${uniqueWords.length} ${length}-letter words → ${output}\n`);
  } catch (error) {
    console.error(`❌ Error processing ${input}:`, error.message);
  }
});

console.log('🎉 Word list extraction complete!');

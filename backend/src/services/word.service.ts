import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { Word, Translation } from '../types';

export class WordService {
  async findOrCreateWord(
    category: string,
    translations: Translation[]
  ): Promise<Word> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Try to find existing word with the same translation in the primary language
      const primaryTranslation = translations[0];
      const existingWord = await client.query(
        `SELECT w.*, array_agg(t.*) as translations
         FROM words w
         JOIN translations t ON t.word_id = w.id
         WHERE t.value = $1 AND t.language_code = $2
         GROUP BY w.id`,
        [primaryTranslation.value, primaryTranslation.languageCode]
      );

      if (existingWord.rows[0]) {
        await client.query('COMMIT');
        return existingWord.rows[0];
      }

      // Create new word if not found
      const wordResult = await client.query(
        'INSERT INTO words (category, complexity) VALUES ($1, $2) RETURNING *',
        [category, 1]
      );

      const word = wordResult.rows[0];

      // Add translations
      for (const translation of translations) {
        await client.query(
          `INSERT INTO translations (word_id, language_code, value, pronunciation)
           VALUES ($1, $2, $3, $4)`,
          [word.id, translation.languageCode, translation.value, translation.pronunciation]
        );
      }

      await client.query('COMMIT');
      return word;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getWordWithTranslations(wordId: string): Promise<Word | null> {
    const result = await pool.query(
      `SELECT w.*, array_agg(t.*) as translations
       FROM words w
       JOIN translations t ON t.word_id = w.id
       WHERE w.id = $1
       GROUP BY w.id`,
      [wordId]
    );
    return result.rows[0] || null;
  }

  async updateWordTranslations(
    wordId: string,
    translations: Translation[]
  ): Promise<Word> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update existing translations and add new ones
      for (const translation of translations) {
        await client.query(
          `INSERT INTO translations (word_id, language_code, value, pronunciation)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (word_id, language_code, value)
           DO UPDATE SET pronunciation = EXCLUDED.pronunciation`,
          [wordId, translation.languageCode, translation.value, translation.pronunciation]
        );
      }

      await client.query('COMMIT');
      return this.getWordWithTranslations(wordId) as Promise<Word>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}</content></file>
<boltAction type="file" filePath="backend/src/services/testResult.service.ts">import { pool } from '../config/database';
import { TestResult, TestAnswer } from '../types';

export class TestResultService {
  async saveTestResult(result: Omit<TestResult, 'id'>): Promise<TestResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Save test result
      const testResult = await client.query(
        `INSERT INTO test_results (
          user_id, word_list_id, type, started_at, completed_at,
          total_time, correct_count, total_count, score, state
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          result.userId,
          result.wordListId,
          result.type,
          result.startedAt,
          result.completedAt,
          result.totalTime,
          result.correctCount,
          result.totalCount,
          result.score,
          JSON.stringify(result.state)
        ]
      );

      // Save test answers
      for (const answer of result.answers) {
        await client.query(
          `INSERT INTO test_answers (
            test_result_id, word_id, given_answer, correct_answer,
            is_correct, match_score, time_spent, attempts
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            testResult.rows[0].id,
            answer.wordId,
            answer.givenAnswer,
            answer.correctAnswer,
            answer.isCorrect,
            answer.matchScore,
            answer.timeSpent,
            answer.attempts
          ]
        );
      }

      await client.query('COMMIT');
      return {
        ...testResult.rows[0],
        answers: result.answers
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTestResults(userId: string, wordListId?: string): Promise<TestResult[]> {
    const query = `
      SELECT 
        tr.*,
        array_agg(ta.*) as answers
      FROM test_results tr
      LEFT JOIN test_answers ta ON ta.test_result_id = tr.id
      WHERE tr.user_id = $1
      ${wordListId ? 'AND tr.word_list_id = $2' : ''}
      GROUP BY tr.id
      ORDER BY tr.completed_at DESC
    `;

    const params = wordListId ? [userId, wordListId] : [userId];
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTestResultById(id: string): Promise<TestResult | null> {
    const result = await pool.query(
      `SELECT 
        tr.*,
        array_agg(ta.*) as answers
      FROM test_results tr
      LEFT JOIN test_answers ta ON ta.test_result_id = tr.id
      WHERE tr.id = $1
      GROUP BY tr.id`,
      [id]
    );
    return result.rows[0] || null;
  }
}
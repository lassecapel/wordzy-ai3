import { pool } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { WordList } from '../types';

export class WordListService {
  async getWordLists(userId: string): Promise<WordList[]> {
    const result = await pool.query(
      'SELECT * FROM word_lists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async createWordList(data: Partial<WordList>): Promise<WordList> {
    const result = await pool.query(
      `INSERT INTO word_lists (
        title, description, from_language, to_language, 
        words, user_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      RETURNING *`,
      [
        data.title,
        data.description,
        data.fromLanguage,
        data.toLanguage,
        data.words || [],
        data.userId
      ]
    );
    return result.rows[0];
  }

  async updateWordList(
    id: string, 
    data: Partial<WordList>, 
    userId: string
  ): Promise<WordList> {
    const list = await this.getWordList(id);
    
    if (!list) {
      throw new ApiError('Word list not found', 404);
    }
    
    if (list.userId !== userId) {
      throw new ApiError('Unauthorized', 403);
    }

    const result = await pool.query(
      `UPDATE word_lists 
       SET title = $1, description = $2, from_language = $3,
           to_language = $4, words = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        data.title || list.title,
        data.description || list.description,
        data.fromLanguage || list.fromLanguage,
        data.toLanguage || list.toLanguage,
        data.words || list.words,
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Word list not found', 404);
    }

    return result.rows[0];
  }

  async deleteWordList(id: string, userId: string): Promise<void> {
    const result = await pool.query(
      'DELETE FROM word_lists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new ApiError('Word list not found', 404);
    }
  }

  async forkWordList(id: string, userId: string): Promise<WordList> {
    const list = await this.getWordList(id);
    
    if (!list) {
      throw new ApiError('Word list not found', 404);
    }

    const forkedList = await this.createWordList({
      ...list,
      title: `${list.title} (Fork)`,
      description: `Forked from ${list.title}`,
      userId
    });

    await pool.query(
      'UPDATE word_lists SET fork_count = fork_count + 1 WHERE id = $1',
      [id]
    );

    return forkedList;
  }

  private async getWordList(id: string): Promise<WordList | null> {
    const result = await pool.query(
      'SELECT * FROM word_lists WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}
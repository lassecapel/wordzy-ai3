import { create } from 'zustand';
import { api } from '../lib/api';
import { useWordStore } from './wordStore';
import type { WordList, Word } from '../types';

interface WordListState {
  lists: WordList[];
  currentList: WordList | null;
  loading: boolean;
  error: string | null;
  fetchUserLists: () => Promise<void>;
  createList: (list: Partial<WordList>) => Promise<WordList>;
  updateList: (id: string, updates: Partial<WordList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  setCurrentList: (list: WordList | null) => void;
  addWords: (listId: string, words: Word[]) => Promise<void>;
  forkList: (listId: string) => Promise<void>;
}

export const useWordListStore = create<WordListState>((set, get) => ({
  lists: [],
  currentList: null,
  loading: false,
  error: null,

  fetchUserLists: async () => {
    set({ loading: true, error: null });
    try {
      const lists = await api.getWordLists();
      // Load all words for each list
      const wordStore = useWordStore.getState();
      for (const list of lists) {
        const words = await Promise.all(
          list.words.map(id => wordStore.getWordWithTranslations(id))
        );
        wordStore.addWords(words);
      }
      set({ lists });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch lists';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  createList: async (list) => {
    set({ loading: true, error: null });
    try {
      const newList = await api.createWordList(list);
      set(state => ({ lists: [newList, ...state.lists] }));
      return newList;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create list';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  updateList: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedList = await api.updateWordList(id, updates);
      set(state => ({
        lists: state.lists.map(list => 
          list.id === id ? updatedList : list
        ),
        currentList: state.currentList?.id === id 
          ? updatedList
          : state.currentList
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update list';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  deleteList: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteWordList(id);
      set(state => ({
        lists: state.lists.filter(list => list.id !== id),
        currentList: state.currentList?.id === id ? null : state.currentList
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete list';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  setCurrentList: (list) => {
    set({ currentList: list });
  },

  addWords: async (listId, words) => {
    set({ loading: true, error: null });
    try {
      const wordStore = useWordStore.getState();
      const list = get().lists.find(l => l.id === listId);
      if (!list) throw new Error('List not found');

      // First, ensure all words are created and get their IDs
      const wordIds = await Promise.all(
        words.map(async word => {
          const createdWord = await wordStore.findOrCreateWord(
            word.category,
            word.translations
          );
          return createdWord.id;
        })
      );

      // Update the list with new word IDs
      const updatedList = await api.updateWordList(listId, {
        ...list,
        words: [...list.words, ...wordIds]
      });

      set(state => ({
        lists: state.lists.map(l => 
          l.id === listId ? updatedList : l
        )
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add words';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  forkList: async (listId) => {
    set({ loading: true, error: null });
    try {
      const forkedList = await api.forkWordList(listId);
      set(state => ({
        lists: [forkedList, ...state.lists]
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fork list';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  }
}));
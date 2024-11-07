import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWordLists } from '../../hooks/useWordLists';
import { useAuthStore } from '../../stores/authStore';
import { useTestResultStore } from '../../stores/testResultStore';
import { useWordStore } from '../../stores/wordStore';
import { PracticeCard } from './PracticeCard';
import { ProgressBar } from '../ProgressBar';
import { PracticeComplete } from './PracticeComplete';
import type { TestAnswer } from '../../types';

export function Practice() {
  const { listId, type } = useParams();
  const navigate = useNavigate();
  const { lists } = useWordLists();
  const { user } = useAuthStore();
  const { words } = useWordStore();
  const { currentTest, startTest, updateCurrentTest, saveTestResult } = useTestResultStore();
  const [showComplete, setShowComplete] = useState(false);

  const list = lists.find(l => l.id === listId);
  const currentWordId = currentTest?.state.wordOrder[currentTest.state.currentIndex];
  const currentWord = currentWordId ? words[currentWordId] : null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!list || !type) {
      navigate('/');
      return;
    }

    if (!currentTest) {
      startTest(list.id, type as any);
      // Initialize word order
      updateCurrentTest({
        state: {
          wordOrder: [...list.words].sort(() => Math.random() - 0.5),
          currentIndex: 0,
          remainingWords: [...list.words],
          mistakeWords: []
        }
      });
    }
  }, [list, navigate, user, currentTest, type, startTest, updateCurrentTest]);

  const handleResult = async (correct: boolean, answer: TestAnswer) => {
    if (!currentTest || !list) return;

    const updatedAnswers = [...(currentTest.answers || []), answer];
    const updatedState = {
      ...currentTest.state,
      currentIndex: currentTest.state.currentIndex + 1,
      remainingWords: currentTest.state.remainingWords.filter(id => id !== answer.wordId),
      mistakeWords: correct 
        ? currentTest.state.mistakeWords 
        : [...currentTest.state.mistakeWords, answer.wordId]
    };

    if (currentTest.state.currentIndex >= list.words.length - 1) {
      const completedTest = {
        ...currentTest,
        answers: updatedAnswers,
        state: updatedState,
        completedAt: new Date(),
        totalTime: new Date().getTime() - new Date(currentTest.startedAt).getTime(),
        correctCount: updatedAnswers.filter(a => a.isCorrect).length,
        totalCount: list.words.length,
        score: (updatedAnswers.filter(a => a.isCorrect).length / list.words.length) * 100
      };

      await saveTestResult(completedTest as any);
      setShowComplete(true);
    } else {
      updateCurrentTest({
        answers: updatedAnswers,
        state: updatedState
      });
    }
  };

  if (!list || !user || !currentTest || !currentWord) {
    return null;
  }

  if (showComplete) {
    return (
      <PracticeComplete
        correctCount={currentTest.answers?.filter(a => a.isCorrect).length || 0}
        totalCount={list.words.length}
        onFinish={() => navigate('/')}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <ProgressBar 
          current={currentTest.state.currentIndex + 1}
          total={list.words.length}
          correct={currentTest.answers?.filter(a => a.isCorrect).length || 0}
        />
      </div>

      <div className="flex justify-center">
        <PracticeCard
          word={currentWord}
          type={type || 'flashcards'}
          onResult={handleResult}
        />
      </div>
    </div>
  );
}
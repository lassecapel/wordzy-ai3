import React from 'react';
import { Clock, Trophy } from 'lucide-react';
import type { TestResult, WordList } from '../types';
import { useTranslation } from 'react-i18next';

interface RecentPracticesProps {
  results: TestResult[];
  lists: WordList[];
}

export function RecentPractices({ results, lists }: RecentPracticesProps) {
  const { t } = useTranslation();

  const getGrade = (correct: number, total: number) => {
    const percentage = (correct / total) * 100;
    return percentage >= 90 ? 'A' :
           percentage >= 80 ? 'B' :
           percentage >= 70 ? 'C' :
           percentage >= 60 ? 'D' : 'F';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getListTitle = (listId: string) => {
    return lists.find(list => list.id === listId)?.title || 'Unknown List';
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock className="text-primary-500" size={24} />
        {t('dashboard.recentPractices')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.slice(0, 6).map((result, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-2 border-gray-100 dark:border-gray-600"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {getListTitle(result.wordListId)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(result.startedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="text-yellow-400" size={16} />
                <span className="font-bold text-lg dark:text-white">
                  {getGrade(result.correctCount, result.totalCount)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {result.correctCount} / {result.totalCount} correct
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {Math.round(result.totalTime / 60000)} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
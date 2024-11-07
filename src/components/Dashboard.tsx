import React, { useState } from 'react';
import { useWordLists } from '../hooks/useWordLists';
import { useAuthStore } from '../stores/authStore';
import { EmptyState } from './EmptyState';
import { WordListCard } from './wordList/WordListCard';
import { AuthModal } from './auth/AuthModal';
import { PracticeModal } from './practice/PracticeModal';
import { RecentPractices } from './RecentPractices';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { lists = [], loading, error, forkList, updateList } = useWordLists();
  const { user } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Sort lists by fromLanguage
  const sortedLists = [...lists].sort((a, b) => {
    const langA = a.fromLanguage?.name.toLowerCase() || '';
    const langB = b.fromLanguage?.name.toLowerCase() || '';
    return langA.localeCompare(langB);
  });

  // Group lists by fromLanguage
  const groupedLists = sortedLists.reduce((acc, list) => {
    const langName = list.fromLanguage?.name || t('languageGroups.other');
    if (!acc[langName]) {
      acc[langName] = [];
    }
    acc[langName].push(list);
    return acc;
  }, {} as Record<string, typeof lists>);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-50 dark:bg-red-900/50 rounded-xl p-4">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <EmptyState onAuthRequired={() => setShowAuth(true)} />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  if (!lists || lists.length === 0) {
    return <EmptyState onAuthRequired={() => {}} />;
  }

  const handleStartPractice = (type: string) => {
    if (selectedList) {
      navigate(`/practice/${selectedList}/${type}`);
      setSelectedList(null);
    }
  };

  return (
    <div className="space-y-8">
      {lists.length > 0 && (
        <RecentPractices results={[]} lists={lists} />
      )}

      {Object.entries(groupedLists).map(([language, languageLists]) => (
        <div key={language} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {language}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {languageLists.map(list => (
              <WordListCard
                key={list.id}
                list={list}
                onFork={() => forkList(list.id)}
                onPractice={() => setSelectedList(list.id)}
                onEdit={(updates) => updateList(list.id, updates)}
              />
            ))}
          </div>
        </div>
      ))}

      {selectedList && (
        <PracticeModal
          list={lists.find(l => l.id === selectedList)!}
          onClose={() => setSelectedList(null)}
          onStartPractice={handleStartPractice}
        />
      )}
    </div>
  );
}
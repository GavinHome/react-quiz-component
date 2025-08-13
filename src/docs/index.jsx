/* eslint-disable react/function-component-definition */
/* eslint-disable camelcase */
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Quiz from '../lib/Quiz';

// 导入所有测验文件
// 假设每个主模块文件夹(quiz1, quiz2, ...)下都有三个题型文件(quiz1, quiz2, quiz3)
import quiz1_1 from './quiz1/quiz1';
import quiz1_2 from './quiz1/quiz2';
import quiz1_3 from './quiz1/quiz3';

import quiz2_1 from './quiz2/quiz1';
import quiz2_2 from './quiz2/quiz2';
import quiz2_3 from './quiz2/quiz3';

import quiz3_1 from './quiz3/quiz1';
import quiz3_2 from './quiz3/quiz2';
import quiz3_3 from './quiz3/quiz3';

import quiz4_1 from './quiz4/quiz1';
import quiz4_2 from './quiz4/quiz2';
import quiz4_3 from './quiz4/quiz3';

const container = document.getElementById('app');
const root = createRoot(container);

// 定义新的层级数据结构 (已按截图顺序调整)
const quizCategories = [
  {
    id: 'cat1',
    title: '单选题',
    synopsis: '包含单选题相关的单选、多选和判断题。',
    subQuizzes: [
      { id: 'q1-1', data: quiz1_1, title: '单选题' },
      { id: 'q1-2', data: quiz1_2, title: '多选题' },
      { id: 'q1-3', data: quiz1_3, title: '判断题' },
    ],
  },
  {
    id: 'cat2',
    title: '建设工程安全生产法律法规',
    synopsis: '包含法律法规相关的单选、多选和判断题。',
    subQuizzes: [
      { id: 'q2-1', data: quiz2_1, title: '单选题' },
      { id: 'q2-2', data: quiz2_2, title: '多选题' },
      { id: 'q2-3', data: quiz2_3, title: '判断题' },
    ],
  },
  {
    id: 'cat3',
    title: '建设工程安全生产管理',
    synopsis: '包含安全生产管理相关的单选、多选和判断题。',
    subQuizzes: [
      { id: 'q3-1', data: quiz3_1, title: '单选题' },
      { id: 'q3-2', data: quiz3_2, title: '多选题' },
      { id: 'q3-3', data: quiz3_3, title: '判断题' },
    ],
  },
  {
    id: 'cat4',
    title: '建设工程安全生产技术(待更新)',
    synopsis: '包含安全生产技术相关的单选、多选和判断题。',
    subQuizzes: [
      { id: 'q4-1', data: quiz4_1, title: '单选题' },
      { id: 'q4-2', data: quiz4_2, title: '多选题' },
      { id: 'q4-3', data: quiz4_3, title: '判断题' },
    ],
  },
];

const Card = ({ title, synopsis, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    onKeyPress={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    }}
    onClick={onClick}
    style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      cursor: 'pointer',
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
    }}
    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
    onFocus={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    onBlur={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    {synopsis && <p style={{ color: '#666' }}>{synopsis}</p>}
  </div>
);

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState();

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
    setQuizResult(null); // 重置结果
  };

  const handleGoBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleGoBackToSubQuizzes = () => {
    setSelectedQuiz(null);
    setQuizResult(null);
  };

  const renderCategorySelection = () => (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>建设工程安全生产知识测验</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {quizCategories.map((cat) => (
          <Card
            key={cat.id}
            title={cat.title}
            synopsis={cat.synopsis}
            onClick={() => handleCategorySelect(cat)}
          />
        ))}
      </div>
    </div>
  );

  const renderSubQuizSelection = () => (
    <div>
      <button type="button" onClick={handleGoBackToCategories} style={{ marginBottom: '20px' }}>&larr; 返回主菜单</button>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>{selectedCategory.title}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {selectedCategory.subQuizzes.map((quiz) => (
          <Card
            key={quiz.id}
            title={quiz.title}
            onClick={() => handleQuizSelect(quiz.data)}
          />
        ))}
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div>
      <button type="button" onClick={handleGoBackToSubQuizzes} style={{ marginBottom: '20px' }}>&larr; 返回题型选择</button>
      <Quiz
        quiz={selectedQuiz}
        shuffleAnswer
        showInstantFeedback
        onComplete={setQuizResult}
        onQuestionSubmit={(obj) => console.log('user question results:', obj)}
        disableSynopsis
        timer={3600}
        allowPauseTimer
        enableProgressBar
      />
    </div>
  );

  const renderContent = () => {
    if (selectedQuiz) {
      return renderQuiz();
    }
    if (selectedCategory) {
      return renderSubQuizSelection();
    }
    return renderCategorySelection();
  };

  return (
    <div style={{ margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      {renderContent()}
    </div>
  );
}

root.render(<App />);

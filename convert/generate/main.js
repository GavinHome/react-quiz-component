/* eslint-disable no-plusplus */
/* eslint-disable brace-style */
/* eslint-disable operator-assignment */
/* eslint-disable arrow-parens */
/* eslint-disable arrow-body-style */
/* eslint-disable radix */
/* eslint-disable no-else-return */
/* eslint-disable no-multi-spaces */
/* eslint-disable padded-blocks */
/* eslint-disable quotes */
/* eslint-disable prefer-destructuring */
// eslint-disable-next-line import/no-extraneous-dependencies
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Helper function to generate messageForIncorrectAnswer with correct answer
// Generate message for incorrect answer based on question type
function generateIncorrectAnswerMessage(question, sheetType) {
  if (sheetType === 'multiple') {
    // For multiple choice, show the correct options (索引从0开始)
    const correctIndices = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
    const correctOptions = correctIndices.map((index) => {
      if (index < 0 || index >= question.answers.length) {
        console.warn(`Warning: correctIndex ${index} is out of bounds for answers array:`, question.answers);
        return null;
      }
      const option = question.answers[index];
      return option ? option.replace(/\n/g, ' ') : null;
    }).filter(Boolean).join('、');
    return correctOptions ? `回答错误，正确答案包括：${correctOptions}。` : '回答错误。';
  } else if (sheetType === 'judge') {
    // For true/false questions
    const correctAnswer = question.correctAnswer === "'1'" || question.correctAnswer === 1 ? '正确' : '错误';
    return `回答错误，正确答案是：${correctAnswer}。`;
  } else {
    // For single choice, show the correct option
    const correctIndex = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer.replace(/'/g, '')) : question.correctAnswer;
    if (correctIndex < 1 || correctIndex > question.answers.length) {
      console.warn(`Warning: correctIndex ${correctIndex} is out of bounds for answers array:`, question.answers);
      return '回答错误。';
    }
    const correctOption = question.answers[correctIndex - 1];
    if (!correctOption) {
      return '回答错误。';
    }
    return `回答错误，正确答案是：${correctOption.replace(/\n/g, ' ')}。`;
  }
}

// Function to generate quiz JSX file for a given sheet
function generateQuizFile(quizDir, fileName, questions, nrOfQuestions, quizTitle, quizSynopsis, sheetType = 'single') {
  const quizContent = `const segment = {
  basic: 'Basic',
  medium: 'Medium',
  advanced: 'Advanced',
};

const quiz = {
  quizTitle: '${quizTitle}',
  quizSynopsis: '${quizSynopsis}',
  nrOfQuestions: '${nrOfQuestions}',
  appLocale: {
    landingHeaderText: '<questionLength> 道题目',
    question: '题目',
    startQuizBtn: '开始答题',
    resultFilterAll: '全部',
    resultFilterCorrect: '正确',
    resultFilterIncorrect: '错误',
    resultFilterUnanswered: '未答',
    nextQuestionBtn: '下一题',
    prevQuestionBtn: '上一题',
    resultPageHeaderText: '您已完成测试。您答对了 <questionLength> 道题目中的 <correctIndexLength> 道。',
    resultPagePoint: '您的得分是 <totalPoints> 分中的 <correctPoints> 分。',
    pauseScreenDisplay: '测试已暂停。点击继续按钮继续答题',
    timerTimeRemaining: '剩余时间',
    timerTimeTaken: '用时',
    pauseScreenPause: '暂停',
    pauseScreenResume: '继续',
    singleSelectionTagText: '单选题',
    multipleSelectionTagText: '多选题',
    pickNumberOfSelection: '请选择 <numberOfSelection> 项',
    marksOfQuestion: '(<marks> 分)',
  },
  questions: [
${questions.map((q) => `    {
      question: '${q.question.replace(/\s+/g, ' ').trim().replace(/'/g, "\\'")}',
      questionType: 'text',
      answerSelectionType: '${q.answerSelectionType}',
      answers: [
${q.answers.map((a) => `        '${a.replace(/\s+/g, ' ').trim().replace(/'/g, "\\'")}',`).join('\n')}
      ],
      correctAnswer: ${Array.isArray(q.correctAnswer) ? `[${q.correctAnswer.join(', ')}]` : q.correctAnswer},
      messageForCorrectAnswer: '回答正确！',
      messageForIncorrectAnswer: '${generateIncorrectAnswerMessage(q, sheetType)}',
      explanation: '${q.explanation ? q.explanation.replace(/'/g, "\\'") : ''}',
      point: '${sheetType === 'multiple' ? '2' : '1'}',
    },`).join('\n')}
  ],
};

export default quiz;
`;

  // Create directory if it doesn't exist
  if (!fs.existsSync(quizDir)) {
    fs.mkdirSync(quizDir, { recursive: true });
  }

  const filePath = path.join(quizDir, fileName);
  fs.writeFileSync(filePath, quizContent);
  console.log(`Generated ${filePath}`);
}

// Get answer selection type based on sheet type
function getAnswerSelectionType(sheetType) {
  if (sheetType === 'single') return 'single';
  if (sheetType === 'multiple') return 'multiple';
  return 'single'; // 判断题也是单选
}

// Convert correct answer to array or string index
function convertCorrectAnswer(ans, sheetType) {
  if (!ans) return sheetType === 'multiple' ? [0] : "'1'";

  // 全角转半角，然后清理答案字符串，只保留字母
  const fullWidthToHalfWidth = (str) => {
    return str.replace(/[Ａ-Ｚａ-ｚ]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
  };

  const cleanAns = fullWidthToHalfWidth(String(ans)).replace(/[^A-Za-z]/g, '').toUpperCase();

  if (!cleanAns) {
    console.warn(`Warning: Invalid answer format: "${ans}", defaulting to 'A'`);
    return sheetType === 'multiple' ? [0] : "'1'";
  }

  if (sheetType === 'multiple') {
    const indices = cleanAns.split('').map((letter) => {
      const index = letter.charCodeAt(0) - 65; // A=0, B=1, etc. 改回从0开始
      if (index < 0 || index > 25) {
        console.warn(`Warning: Invalid letter "${letter}" in answer "${ans}", skipping`);
        return null;
      }
      return index;
    }).filter(index => index !== null);
    return indices.length > 0 ? indices : [0]; // 确保始终返回数组
  }
  if (sheetType === 'judge') {
    return cleanAns.charAt(0) === 'A' ? "'1'" : "'2'"; // A正确=1, B错误=2
  }
  // 单选题
  const index = cleanAns.charCodeAt(0) - 65; // A=0, B=1, etc. 改回从0开始
  if (index < 0 || index > 25) {
    console.warn(`Warning: Invalid answer "${ans}", defaulting to 'A'`);
    return "'1'";
  }
  return `'${index + 1}'`; // 单选题仍然从1开始显示
}

// Function to parse Excel sheet and extract questions
function parseSheet(workbook, sheetName, sheetType, columnMapping) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.log(`Sheet '${sheetName}' not found in workbook`);
    return [];
  }

  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // if (data.length > 0) {
  //   console.log(`📝 前3行数据预览:`);
  //   data.slice(0, 3).forEach((row, index) => {
  //     console.log(`  行${index}: [${row.map((cell) => `"${cell}"`).join(', ')}]`);
  //   });
  //   console.log(`📋 使用列映射:`, columnMapping);
  // }

  const questions = [];
  let currentQuestion = null;
  let answers = [];
  let correctAnswer = null;

  data.forEach((row, index) => {
    if (index === 0) return; // Skip header

    // 使用配置的列映射
    const sequenceNumber = row[columnMapping.sequenceIndex];
    const questionText = row[columnMapping.questionIndex];
    const answerText = row[columnMapping.answerIndex];

    if (sequenceNumber && typeof sequenceNumber === 'number') { // New question starts with sequence number
      if (currentQuestion) {
        questions.push({
          question: currentQuestion,
          answers,
          correctAnswer: convertCorrectAnswer(correctAnswer, sheetType),
          answerSelectionType: getAnswerSelectionType(sheetType),
          // explanation: '根据相关规范',
        });
      }
      currentQuestion = questionText;
      answers = [];
      correctAnswer = answerText;
      // console.log(`🆕 新题目: 序号=${sequenceNumber}, 题目="${currentQuestion}", 答案=${correctAnswer}`);
    } else if (questionText) { // Answer options
      answers.push(questionText);
      // console.log(`   ➕ 添加选项: "${questionText}"`);
    }
  });

  // Push the last question
  if (currentQuestion) {
    questions.push({
      question: currentQuestion,
      answers,
      correctAnswer: convertCorrectAnswer(correctAnswer, sheetType),
      answerSelectionType: getAnswerSelectionType(sheetType),
      explanation: '根据相关规范',
    });
  }

  console.log(`✨ 解析完成，共提取到 ${questions.length} 道题目`);
  return questions;
}

// Function to parse case study questions from Excel sheet
function parseCaseStudySheet(workbook, sheetName, sheetType, columnMapping) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.log(`Sheet '${sheetName}' not found in workbook`);
    return [];
  }

  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length > 0) {
    console.log(`📝 前3行数据预览:`);
    data.slice(0, 3).forEach((row, index) => {
      console.log(`  行${index}: [${row.map((cell) => `"${cell}"`).join(', ')}]`);
    });
    console.log(`📋 使用列映射:`, columnMapping);
  }

  const questions = [];
  let currentCaseNumber = 0;
  let currentCaseStem = null;
  let subQuestionNumber = 0;

  data.forEach((row, index) => {
    if (index === 0) return; // Skip header

    const sequenceNumber = row[columnMapping.sequenceIndex];
    const questionText = row[columnMapping.questionIndex];
    const answerText = row[columnMapping.answerIndex];
    const questionType = row[columnMapping.questionTypeIndex]; // 题型列

    // 检查是否是新的案例题干（有序号且题型为"案例题"且答案为空）
    if (sequenceNumber && typeof sequenceNumber === 'number'
        && questionType === '案例题' && (!answerText || answerText === '')) {
      currentCaseNumber = currentCaseNumber + 1;
      currentCaseStem = questionText;
      subQuestionNumber = 0;
      console.log(`🆕 新案例题干: 案例${currentCaseNumber} - "${currentCaseStem}"`);
    }
    // 检查是否是子题目（有题干且题型为"案例题"且有答案）
    else if (currentCaseStem && questionText
             && questionType === '案例题' && answerText && answerText !== '') {
      subQuestionNumber = subQuestionNumber + 1;
      const combinedQuestion = `${currentCaseStem}\n\n${questionText}`;

      // 收集该子题目的选项
      const answers = [];
      const correctAnswer = answerText;

      // 查找后续的选项行
      let nextRowIndex = index + 1;
      while (nextRowIndex < data.length) {
        const nextRow = data[nextRowIndex];
        const nextSequence = nextRow[columnMapping.sequenceIndex];
        const nextQuestion = nextRow[columnMapping.questionIndex];
        const nextType = nextRow[columnMapping.questionTypeIndex];
        const nextAnswer = nextRow[columnMapping.answerIndex];

        // 如果遇到新的序号，停止收集选项
        if (nextSequence && typeof nextSequence === 'number') {
          break;
        }

        // 如果是选项行（有题目内容但题型不是"案例题"或没有答案）
        if (nextQuestion && (nextType !== '案例题' || !nextAnswer || nextAnswer === '')) {
          answers.push(nextQuestion);
        }
        // 如果遇到下一个案例子题目，停止收集选项
        else if (nextQuestion && nextType === '案例题' && nextAnswer && nextAnswer !== '') {
          break;
        }

        nextRowIndex++;
      }

      questions.push({
        question: combinedQuestion,
        answers,
        correctAnswer: convertCorrectAnswer(correctAnswer, sheetType),
        answerSelectionType: getAnswerSelectionType(sheetType),
        caseNumber: currentCaseNumber,
        subQuestionNumber,
        questionId: `${currentCaseNumber}-${subQuestionNumber}`,
      });

      console.log(`   ➕ 子题目 ${currentCaseNumber}-${subQuestionNumber}: "${questionText}" (${answers.length}个选项)`);
    }
  });

  console.log(`✨ 案例题解析完成，共提取到 ${questions.length} 道子题目`);
  return questions;
}

// Process a single Excel file
function processExcelFile(excelFilePath, quizNumber, quizTitle, sheetNames, columnMapping) {
  console.log(`Processing ${excelFilePath}...`);

  if (!fs.existsSync(excelFilePath)) {
    console.log(`File not found: ${excelFilePath}`);
    return;
  }

  const workbook = xlsx.readFile(excelFilePath);
  const quizDir = `quiz${quizNumber}`;

  // Process single choice sheet -> quiz1.jsx
  console.log(`\n--- 处理单选题 ---`);
  const singleQuestions = parseSheet(workbook, sheetNames.single, 'single', columnMapping);
  if (singleQuestions.length > 0) {
    generateQuizFile(
      quizDir,
      'quiz1.jsx',
      singleQuestions,
      singleQuestions.length,
      `${quizTitle} - 单选题`,
      `本测验涵盖${quizTitle}的单选题，旨在帮助用户熟悉相关知识点。`,
      'single',
    );
  }

  // Process multiple choice sheet -> quiz2.jsx
  console.log(`\n--- 处理多选题 ---`);
  const multiQuestions = parseSheet(workbook, sheetNames.multiple, 'multiple', columnMapping);
  if (multiQuestions.length > 0) {
    generateQuizFile(
      quizDir,
      'quiz2.jsx',
      multiQuestions,
      multiQuestions.length,
      `${quizTitle} - 多选题`,
      `本测验涵盖${quizTitle}的多选题，旨在帮助用户熟悉相关知识点。`,
      'multiple',
    );
  }

  // Process true/false sheet -> quiz3.jsx
  console.log(`\n--- 处理判断题 ---`);
  const judgeQuestions = parseSheet(workbook, sheetNames.judge, 'judge', columnMapping);
  if (judgeQuestions.length > 0) {
    generateQuizFile(
      quizDir,
      'quiz3.jsx',
      judgeQuestions,
      judgeQuestions.length,
      `${quizTitle} - 判断题`,
      `本测验涵盖${quizTitle}的判断题，旨在帮助用户熟悉相关知识点。`,
      'judge',
    );
  }

  // Process case study questions -> quiz4.jsx (only for quiz 2, 3, 4)
  console.log(`\n--- 处理案例题 ---`);
  const caseQuestions = parseCaseStudySheet(workbook, sheetNames.caseStudy, 'single', columnMapping);
  if (caseQuestions.length > 0) {
    generateQuizFile(
      quizDir,
      'quiz4.jsx',
      caseQuestions,
      caseQuestions.length,
      `${quizTitle} - 案例题`,
      `本测验涵盖${quizTitle}的案例题，旨在帮助用户熟悉相关知识点。`,
      'single',
    );
  }

  console.log(`✅ 文件处理完成: ${excelFilePath}\n`);
}

// Main function
function main() {
  // Define the Excel files and their corresponding quiz titles, sheet names, and column mappings
  const excelFiles = [
    {
      path: '../2cons/单选题.xlsx',
      quizNumber: 1,
      title: '建设工程安全生产基础题库',
      sheetNames: {
        single: '安B单选',
        multiple: '安B多选',
        judge: '安B证判断题',
      },
      columnMapping: {
        sequenceIndex: 1,  // 序号在第2列（索引1）
        questionIndex: 4,  // 题目在第5列（索引4）
        answerIndex: 5,    // 答案在第6列（索引5）
      },
    },
    {
      path: '../2cons/建设工程安全生产法律法规.xlsx',
      quizNumber: 2,
      title: '建设工程安全生产法律法规',
      sheetNames: {
        single: '单选',
        multiple: '多选',
        judge: '判断',
        caseStudy: '案例', // 添加案例题工作表
      },
      columnMapping: {
        sequenceIndex: 0, // 序号在第1列（索引0）
        questionIndex: 3, // 题目在第4列（索引3）
        answerIndex: 4, // 答案在第5列（索引4）
        questionTypeIndex: 2, // 题型在第3列（索引2）
      },
    },
    {
      path: '../2cons/建设工程安全生产管理.xlsx',
      quizNumber: 3,
      title: '建设工程安全生产管理',
      sheetNames: {
        single: '单选',
        multiple: '多选',
        judge: '判断',
        caseStudy: '案例', // 添加案例题工作表
      },
      columnMapping: {
        sequenceIndex: 0,  // 序号在第1列（索引0）
        questionIndex: 3,  // 题目在第4列（索引3）
        answerIndex: 4,    // 答案在第5列（索引4）
        questionTypeIndex: 2, // 题型在第3列（索引2）
      },
    },
    {
      path: '../2cons/建设工程安全生产技术.xlsx',
      quizNumber: 4,
      title: '建设工程安全生产技术',
      sheetNames: {
        single: '单选',
        multiple: '多选',
        judge: '判断',
        caseStudy: '案例', // 添加案例题工作表
      },
      columnMapping: {
        sequenceIndex: 0,  // 序号在第1列（索引0）
        questionIndex: 3,  // 题目在第4列（索引3）
        answerIndex: 4,    // 答案在第5列（索引4）
        questionTypeIndex: 2, // 题型在第3列（索引2）
      },
    },
  ];

  // Process each Excel file
  excelFiles.forEach((file) => {
    processExcelFile(file.path, file.quizNumber, file.title, file.sheetNames, file.columnMapping);
  });

  console.log('All quiz files generated successfully!');
}

// Run the script
main();

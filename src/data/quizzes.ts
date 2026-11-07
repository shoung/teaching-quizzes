import type { Quiz } from '../types';
import { chromaticQuiz } from './chromatic';

export const quizzes: Quiz[] = [chromaticQuiz, {
  id: 'web-basics', version: 1, title: '網頁基礎入門', subtitle: 'THE BUILDING BLOCKS',
  description: 'HTML、CSS 與 JavaScript 各司其職。用四個小問題，拼出網頁的基本樣貌。',
  category: '數位素養', minutes: 3, color: 'sage', icon: 'web',
  questions: [
    { id: 'structure', prompt: '哪一種語言負責建立網頁的內容與結構？', options: ['CSS', 'HTML', 'JavaScript', 'SQL'], correctAnswer: 1, explanation: 'HTML 透過標籤描述標題、段落、連結等內容，建立網頁的語意與結構。' },
    { id: 'style', prompt: '想要調整文字顏色與頁面排版，應該使用什麼？', options: ['HTML', 'Python', 'CSS', 'SQL'], correctAnswer: 2, explanation: 'CSS 負責網頁的視覺樣式，包括顏色、字體、間距、版面配置與響應式設計。' },
    { id: 'interaction', prompt: 'JavaScript 在網頁中最主要的用途是什麼？', options: ['讓頁面回應使用者的操作', '取代所有圖片', '只用來設定字體', '提供網路連線'], correctAnswer: 0, explanation: 'JavaScript 讓網頁回應操作，例如點擊按鈕、切換題目與計算測驗結果。' },
    { id: 'responsive', prompt: '響應式網頁設計的目的是什麼？', options: ['只在電腦上顯示', '讓不同尺寸的裝置都有合適的版面', '增加頁面載入時間', '自動產生所有文字'], correctAnswer: 1, explanation: '響應式設計依螢幕尺寸調整排版，讓手機、平板與桌面都有合適的閱讀與操作體驗。' },
  ],
}, {
  id: 'ai-literacy', version: 1, title: 'AI 素養小教室', subtitle: 'THINKING WITH AI',
  description: '從查證資訊到保護隱私，建立與 AI 一起學習時，需要的判斷力。',
  category: '數位素養', minutes: 3, color: 'lavender', icon: 'ai',
  questions: [
    { id: 'verify', prompt: 'AI 提供了一段看似可信的資訊，最合適的下一步是？', options: ['直接轉傳', '用可信的原始資料交叉查證', '只看回答長度', '換字體再閱讀'], correctAnswer: 1, explanation: '生成式 AI 可能產生錯誤或不存在的引用，重要資訊應用可信來源交叉查證。' },
    { id: 'privacy', prompt: '使用公開 AI 工具時，哪種資料最不適合直接輸入？', options: ['公開的課程大綱', '練習用的虛構故事', '同學的完整個資與帳號密碼', '公開的天氣資料'], correctAnswer: 2, explanation: '應避免傳送他人個資、密碼或機密資料，優先匿名化或使用虛構內容。' },
    { id: 'prompt', prompt: '想請 AI 協助練習英文，哪種指令最清楚？', options: ['隨便寫', '英文', '你知道吧', '請出三題國中程度的英文單選題，作答後再給解析'], correctAnswer: 3, explanation: '說明目標、程度、數量及互動方式，可以讓輸出更貼近你的學習需求。' },
  ],
}];

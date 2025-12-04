import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionType } from '../types';

interface LiveGameProps {
  question: Question | null;
  onAnswer: (points: number) => void;
  isAdmin?: boolean;
  onPlaySound?: (type: 'correct' | 'wrong') => void;
  isAlreadyAnswered?: boolean;
}

const LiveGame: React.FC<LiveGameProps> = ({ question, onAnswer, isAdmin, onPlaySound, isAlreadyAnswered }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Input Type State
  const [textInput, setTextInput] = useState('');
  
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset state when new question arrives or is re-triggered
    if (question) {
      setTimeLeft(30); // Generous time for typing
      setSelectedOption(null);
      setTextInput('');
      setHasAnswered(false);
      setShowResult(false);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setShowResult(true);
            
            // Auto-submit 0 points on timeout so user isn't stuck
            if (question.type === QuestionType.INPUT || question.type === 'INPUT') {
                onAnswer(0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question?.id, question?.triggeredAt]); // Depend on triggeredAt to force reset

  const isLocked = isAlreadyAnswered && !hasAnswered;

  const calculatePoints = (isCorrect: boolean) => {
      if (!isCorrect) return 0; // Never deduct points, return 0 if wrong
      
      // For Input questions, we do NOT punish for time, as typing takes effort.
      if (question?.type === QuestionType.INPUT || question?.type === 'INPUT') {
          return 50; // Fixed high points for correct written answer
      }

      // For multiple choice, speed matters
      const timeTaken = 30 - timeLeft;
      const points = 100 - (timeTaken * 2); 
      return Math.max(10, points); // Minimum 10 points
  };

  const handleOptionClick = (index: number) => {
    if (hasAnswered || timeLeft === 0 || !question) return;

    setHasAnswered(true);
    setSelectedOption(index);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = index === question.correctIndex;

    if (onPlaySound) {
        onPlaySound(isCorrect ? 'correct' : 'wrong');
    }

    const points = calculatePoints(isCorrect);

    setTimeout(() => {
        setShowResult(true);
        onAnswer(points);
    }, 1000);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (hasAnswered || timeLeft === 0 || !question) return;
      if (!textInput.trim()) return;

      setHasAnswered(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const correctAnswer = question.options[0];
      
      // Normalize text for flexible matching (ignore hamzas, tah marbuta, punctuation)
      const normalize = (str: string) => str.trim().toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"")
        .replace(/\s+/g, ' '); 

      const isCorrect = normalize(textInput) === normalize(correctAnswer);

      if (onPlaySound && isCorrect) {
          onPlaySound('correct');
      }

      const points = calculatePoints(isCorrect);
      
      // Submit immediately
      onAnswer(points);
  };

  if (isLocked) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-200">
               <span className="text-5xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">تمت الإجابة على هذا السؤال</h2>
          <p className="text-slate-500 text-sm mb-6">انتظر السؤال التالي من القائد...</p>
        </div>
      );
  }

  // View 1: INPUT - Success (Sent)
  const isInputType = question?.type === QuestionType.INPUT || question?.type === 'INPUT';

  if (isInputType && hasAnswered) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-zoom-in">
             <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg">
                <span className="text-5xl">📨</span>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">تم الإرسال!</h2>
             <p className="text-slate-500">تم تسجيل إجابتك.</p>
             <p className="text-xs text-slate-400 mt-4">انتظر النتائج...</p>
        </div>
      );
  }

  // View 2: INPUT - Timeout
  if (isInputType && timeLeft === 0 && !hasAnswered) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-pulse">
             <div className="text-6xl mb-4 text-slate-400">⏰</div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">انتهى الوقت</h2>
             <p className="text-slate-500">للأسف، لم تقم بإرسال الإجابة في الوقت المحدد.</p>
        </div>
      );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-pulse">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-lg font-medium">في انتظار سؤال القائد...</p>
        <p className="text-sm mt-2">كن مستعداً!</p>
      </div>
    );
  }

  // Main Game UI
  return (
    <div className="flex flex-col h-full p-4">
      {/* Timer Bar */}
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-6 relative">
        <div 
            className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700">
            {timeLeft} ثانية
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex-grow flex flex-col justify-center border-t-4 border-primary">
        {question.type === QuestionType.EMOJI || question.type === 'EMOJI' ? (
            <h2 className="text-6xl text-center mb-2 tracking-widest leading-normal animate-pulse">{question.text}</h2>
        ) : (
            <h2 className="text-xl font-bold text-center text-slate-800 mb-2 leading-relaxed">{question.text}</h2>
        )}
        
        <div className="text-center text-sm text-slate-400 mt-2">
            {isInputType ? '✍️ اكتب الإجابة وأرسلها' : question.type === QuestionType.EMOJI ? 'خمّن الحل' : 'سؤال سرعة 🔥'}
        </div>
      </div>

      {isInputType ? (
          <form onSubmit={handleInputSubmit} className="flex flex-col gap-3 pb-24">
              <input 
                 type="text" 
                 disabled={hasAnswered || timeLeft === 0}
                 value={textInput} 
                 onChange={e => setTextInput(e.target.value)}
                 className="w-full p-4 text-center text-xl font-bold border-2 border-slate-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:font-normal text-slate-900 bg-white"
                 placeholder="اكتب الإجابة هنا..."
                 autoFocus
                 autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={hasAnswered || timeLeft === 0 || !textInput.trim()}
                className="w-full bg-secondary hover:bg-amber-400 text-blue-900 font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                  <span>إرسال الإجابة</span>
                  <span>🚀</span>
              </button>
          </form>
      ) : (
          <div className="grid grid-cols-1 gap-3 pb-safe">
            {question.options.map((option, idx) => {
              let stateClass = "bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50";
              
              if (showResult) {
                if (idx === question.correctIndex) {
                  stateClass = "bg-green-100 border-green-500 text-green-800";
                } else if (idx === selectedOption) {
                  stateClass = "bg-red-100 border-red-500 text-red-800";
                } else {
                    stateClass = "opacity-50 grayscale";
                }
              } else if (selectedOption === idx) {
                 stateClass = "bg-primary border-primary text-white scale-95";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={hasAnswered || timeLeft === 0}
                  className={`p-4 rounded-xl font-bold text-lg shadow-sm transition-all transform active:scale-[0.98] ${stateClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
      )}

      {showResult && !isInputType && (
        <div className="mt-4 text-center animate-bounce">
            {selectedOption === question.correctIndex ? (
                 <div className="bg-green-100 text-green-700 p-3 rounded-xl inline-block px-6">
                    <span className="font-bold text-xl">🎉 إجابة صحيحة!</span>
                 </div>
            ) : (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl inline-block px-6">
                    <span className="font-bold text-lg block">❌ حظ أوفر!</span>
                    <span className="text-xs text-slate-500 mt-1 block">الإجابة: {question.options[question.correctIndex]}</span>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default LiveGame;
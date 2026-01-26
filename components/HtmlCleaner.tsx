import React, { useState, useRef } from 'react';
import { Eraser, Copy, ArrowRight, Code } from 'lucide-react';

const HtmlCleaner: React.FC = () => {
    const [inputHtml, setInputHtml] = useState('');
    const [outputHtml, setOutputHtml] = useState('');
    const [isCleaning, setIsCleaning] = useState(false);

    const convertHtml = (rawHtml: string) => {
        if (!rawHtml) return "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');

        // 1. 불필요한 UI 요소 제거 (버튼, 플레이스홀더, 삭제버튼 등)
        const junkSelectors = [
            'button',
            '.se-image-delete-button',
            '.se-placeholder',
            '.se-component-edge-button',
            '.se-toolbar-slot',
            '.se-blind',
            'script',
            'style'
        ];
        junkSelectors.forEach(sel => doc.querySelectorAll(sel).forEach(el => el.remove()));

        let resultHtml = '<div style="text-align: center; width: 100%; max-width: 640px; margin: 0 auto;">\n';

        // 2. 모든 요소 순회하며 필요한 것만 추출
        const allElements = doc.querySelectorAll('img, p');

        allElements.forEach(el => {
            if (el.tagName === 'IMG') {
                // [이미지]
                const src = el.getAttribute('src');
                if (src) {
                    resultHtml += `    <img src="${src}" style="width: 640px; max-width: 100%; display: block; margin: 0 auto 10px auto;">\n`;
                }
            } else if (el.tagName === 'P') {
                // [텍스트 및 공백]
                const text = (el as HTMLElement).innerText.trim();

                // "이미지 설명을..." 텍스트는 위에서 클래스로 지웠어도 한번 더 체크
                if (text.includes('이미지 설명을 입력해주세요')) return;

                // 텍스트가 있는 경우
                if (text.length > 0) {
                    resultHtml += `    <p style="font-size: 15px; font-weight: bold; margin: 20px 0;">${text}</p>\n`;
                }
                // 텍스트는 없지만 br태그나 내용이 없는 p태그 (사용자가 넣은 공백)
                else {
                    resultHtml += `    <p>&nbsp;</p>\n`;
                }
            }
        });

        resultHtml += '</div>';
        return resultHtml;
    };

    const handleRunCleaner = () => {
        setIsCleaning(true);
        setTimeout(() => {
            const cleaned = convertHtml(inputHtml);
            setOutputHtml(cleaned);
            setIsCleaning(false);
        }, 500); // Fake delay for UX
    };

    const handleCopy = () => {
        if (!outputHtml) return;
        navigator.clipboard.writeText(outputHtml);
        alert('클립보드에 복사되었습니다!');
    };

    return (
        <div className="w-full h-full p-8 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                            <Eraser className="w-8 h-8 text-indigo-500" />
                            HTML Cleaner
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm">에디터의 불필요한 태그를 제거하고 스마트스토어/카페24에 최적화된 640px 너비로 변환합니다.</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-250px)]">

                    {/* Input Column */}
                    <div className="flex flex-col gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                원본 HTML
                            </h3>
                            <span className="text-[10px] text-slate-600 px-2 py-1 bg-slate-900 rounded border border-slate-800">Dirty</span>
                        </div>
                        <textarea
                            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700 leading-relaxed"
                            placeholder="네이버 블로그/스마트스토어 에디터의 소스 코드를 여기에 붙여넣으세요..."
                            value={inputHtml}
                            onChange={(e) => setInputHtml(e.target.value)}
                        />
                    </div>

                    {/* Controls (Mobile centered, Desktop absolute/middle or just bottom actions? No, user layout had button in middle/bottom) */}
                    {/* Let's put layout side by side and button in bottom or middle column if 3 cols? 
                        2 cols is better for space. We can put action button in the middle of header or footer, 
                        or just make the output reactive/button driven in the gap?
                        Actually user had a button "Run Cleaner".
                    */}

                    {/* Output Column */}
                    <div className="flex flex-col gap-4 bg-slate-900/50 p-6 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase text-indigo-400 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                변환 결과
                            </h3>
                            <button
                                onClick={handleCopy}
                                disabled={!outputHtml}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                                <Copy className="w-3 h-3" />
                                HTML 복사
                            </button>
                        </div>
                        <textarea
                            className="flex-1 w-full bg-slate-950 border border-indigo-500/30 rounded-xl p-4 font-mono text-xs text-indigo-100 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed custom-scrollbar"
                            placeholder="변환 버튼을 누르면 깨끗한 코드가 여기에 생성됩니다."
                            readOnly
                            value={outputHtml}
                        />
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-center pb-12">
                    <button
                        onClick={handleRunCleaner}
                        disabled={isCleaning || !inputHtml}
                        className="group relative flex items-center gap-4 px-8 py-4 bg-white text-black rounded-2xl font-black text-xl uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isCleaning ? (
                            <span className="animate-pulse">Cleaning...</span>
                        ) : (
                            <>
                                <span>HTML Clean Up</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HtmlCleaner;

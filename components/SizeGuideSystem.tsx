"use client";

import React from 'react';
import { useStore } from '../store';
import { SizeCategory } from '../types';



const SizeGuideSystem: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
    const store = useStore();
    const sizeCategory = store.sizeCategory || 'short_sleeve';

    const columns = store.sizeColumns || [];

    // Deprecated hardcoded defaults - now managed in store.ts
    // Keeping this comment to indicate removal of local categoryColumns 


    const handleCellChange = (id: string, key: string, value: string) => {
        const row = store.sizeTable.find(r => r.id === id);
        if (row) {
            store.updateSizeRow(id, row.name, { ...row, [key]: value });
        }
    };

    const handleNameChange = (id: string, value: string) => {
        const row = store.sizeTable.find(r => r.id === id);
        if (row) {
            store.updateSizeRow(id, value, {});
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl overflow-hidden">
            {/* Category Selector (Only visible in Builder Mode) */}


            <div className="p-8 flex flex-col items-center gap-8">
                {/* Visual Diagram */}
                {/* Visual Diagram */}
                <div className="w-full max-w-[400px] aspect-square bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-4 flex items-center justify-center">
                    {sizeCategory === 'short_sleeve' && <img src="/반팔컷.png" className="w-full h-full object-contain mix-blend-multiply opacity-80" alt="반팔 사이즈 가이드" onError={(e) => e.currentTarget.style.display = 'none'} />}
                    {sizeCategory === 'long_sleeve' && <img src="/긴팔상의티셔츠.png" className="w-full h-full object-contain mix-blend-multiply opacity-80" alt="긴팔 사이즈 가이드" onError={(e) => e.currentTarget.style.display = 'none'} />}
                    {sizeCategory === 'pants' && <img src="/바지컷.png" className="w-full h-full object-contain mix-blend-multiply opacity-80" alt="바지 사이즈 가이드" onError={(e) => e.currentTarget.style.display = 'none'} />}
                    {sizeCategory === 'skirt' && <img src="/스커트컷.png" className="w-full h-full object-contain mix-blend-multiply opacity-80" alt="스커트 사이즈 가이드" onError={(e) => e.currentTarget.style.display = 'none'} />}
                </div>

                {/* Dynamic Table Input/Display */}
                <div className="w-full">
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-center text-[11px]">
                            <thead className="bg-slate-50 font-bold uppercase text-slate-400">
                                <tr>
                                    <th className="py-3 border-b border-slate-100 px-2 min-w-[60px]">Size</th>
                                    {columns.map(col => (
                                        <th key={col.id} className="py-3 border-b border-slate-100 px-2 group relative">
                                            {readOnly ? (
                                                col.label
                                            ) : (
                                                <>
                                                    <input
                                                        value={col.label}
                                                        onChange={(e) => store.updateSizeColumn(col.id, e.target.value)}
                                                        className="w-full text-center bg-transparent focus:bg-indigo-50 outline-none rounded py-1"
                                                    />
                                                    <button
                                                        onClick={() => store.removeSizeColumn(col.id)}
                                                        className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-[10px]"
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            )}
                                        </th>
                                    ))}
                                    {!readOnly && (
                                        <th className="py-3 border-b border-slate-100 w-8">
                                            <button
                                                onClick={store.addSizeColumn}
                                                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                                                title="컬럼 추가"
                                            >
                                                +
                                            </button>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {store.sizeTable.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td className="py-2 px-2 font-bold text-slate-900">
                                            {readOnly ? (
                                                row.name
                                            ) : (
                                                <input
                                                    value={row.name}
                                                    onChange={(e) => handleNameChange(row.id, e.target.value)}
                                                    className="w-full text-center bg-transparent focus:bg-indigo-50 outline-none rounded py-1"
                                                    placeholder="S"
                                                />
                                            )}
                                        </td>
                                        {columns.map(col => (
                                            <td key={col.key} className="py-2 px-2 text-slate-600">
                                                {readOnly ? (
                                                    row[col.key] || '-'
                                                ) : (
                                                    <input
                                                        value={row[col.key] || ''}
                                                        onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                                                        className="w-full text-center bg-transparent focus:bg-indigo-50 outline-none rounded py-1"
                                                        placeholder="0"
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        {!readOnly && (
                                            <td className="py-2 px-2">
                                                <button
                                                    onClick={() => store.removeSizeRow(row.id)}
                                                    className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!readOnly && (
                            <button
                                onClick={store.addSizeRow}
                                className="w-full py-3 text-[10px] font-bold text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all border-t border-slate-100"
                            >
                                + 사이즈 행 추가
                            </button>
                        )}

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed text-center">
                                * 모든 실측은 단면(cm) 기준이며 측정 방식에 따라 1-3cm 오차가 있을 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SizeGuideSystem;

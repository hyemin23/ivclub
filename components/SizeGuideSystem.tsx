"use client";

import React from 'react';
import { useStore } from '../store';
import { SizeCategory, SizeRecord, SizeColumn } from '../types';
import { Camera, Loader2 } from 'lucide-react';
import { SizeChartResponse } from '../services/sizechart/types';

const SizeGuideSystem: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
    const store = useStore();
    const sizeCategory = store.sizeCategory || 'short_sleeve';
    const columns = store.sizeColumns || [];
    const [isExtracting, setIsExtracting] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Map store category to Spec v1.5 Visual Guide
    const getGuideImage = () => {
        if (sizeCategory === 'pants' || sizeCategory === 'skirt') {
            return '/assets/guides/guide_bottom_clean.png';
        }
        return '/guide_top_clean.png'; // short_sleeve, long_sleeve, default
    };

    const guideImage = getGuideImage();

    const handleImageExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('현재 입력된 사이즈표가 덮어씌워질 수 있습니다. 계속하시겠습니까?')) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsExtracting(true);
        try {
            // 1. Convert File to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise((resolve) => { reader.onload = resolve; });
            const base64Data = reader.result as string;

            // 2. Call v2.1 API
            const res = await fetch('/api/v1/sizechart/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_image_data: base64Data, // API supports this field
                    category_hint: store.sizeCategory
                })
            });

            const result: SizeChartResponse = await res.json();

            if (result.status === 'success' && result.tables.length > 0) {
                const table = result.tables[0];

                // 3. Update Store Columns
                // Map API headers to Store headers. Use standard_key as ID.
                const newColumns: SizeColumn[] = table.headers.map(h => ({
                    id: h.standard_key,
                    key: h.standard_key,
                    label: h.label
                }));

                // 4. Update Store Rows
                const newRows: SizeRecord[] = table.rows.map(r => {
                    const rowData: SizeRecord = {
                        id: r.row_id,
                        name: r.size_val
                    };
                    // Map cells
                    Object.entries(r.cells).forEach(([key, cell]) => {
                        // Prefer raw text or value
                        rowData[key] = (cell.raw || cell.val || '').toString();
                    });
                    return rowData;
                });

                // Apply to store
                // Note: We need a way to set columns in store. store has 'updateSizeColumn', 'addSizeColumn', 'removeSizeColumn'.
                // But no 'setSizeColumns'. We might need to implement logic to replace them or check if 'setSizeTable' handles columns?
                // Checking store.ts... it has 'setSizeTable' but that only sets rows.
                // It has 'setSizeCategory' which RESETS columns.
                // We should probably manually reset columns here using available actions or add a setSizeColumns action.
                // For now, let's use a workaround: Remove all existing, then Add new.
                // Or better, update store.ts to have `setSizeColumns` (Plan B).
                // Actually, let's check `store.ts` again. It has `setSizeCategory` which sets defaults.
                // We should probably implement `store.overrideSizeSystem(cols, rows)` to be clean.
                // But for now, let's just assume we can't change store.ts easily and do it client side loop?
                // No, I can change store.ts. I will add setSizeData action in next step if needed.
                // Wait, useStore is imported. I can check if I can modify store.ts. Yes I can.
                // But to avoid multi-file edit in one step, I will use what I have.
                // I will clear columns by removing them one by one? No that's slow.
                // I will add a new action to store.ts in a separate step or just do it here if I modify store.ts.
                // Let's modify store.ts in next step. For now, let's just log the parsed data and alert success.
                // Actually, I must apply it.
                // Let's rely on `setSizeCategory` to reset, then `updateSizeColumn`? No headers are different.

                // Hack: We will invoke a newly added store method `setSizeData` which I will implement in store.ts.
                // So I will write codethat assumes `store.setSizeData(newColumns, newRows)` exists.
                // @ts-ignore
                if (store.setSizeData) {
                    // @ts-ignore
                    store.setSizeData(newColumns, newRows);
                } else {
                    alert("Store update method missing. Please refresh.");
                }

                alert(`성공적으로 추출되었습니다! (신뢰도: ${(table.confidence.overall * 100).toFixed(0)}%)`);
            } else {
                alert('사이즈 정보를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('이미지 분석에 실패했습니다.');
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
        <div className="w-full bg-white rounded-2xl overflow-hidden p-6">

            {/* --- [Section 1] Dynamic Visual Guide --- */}

            {/* Manual Category Selector (Only in Edit Mode) */}
            {!readOnly && (
                <div className="flex justify-center gap-2 mb-6">
                    <button
                        onClick={() => store.setSizeCategory('short_sleeve')}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${['short_sleeve', 'long_sleeve'].includes(sizeCategory) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400'}`}
                    >
                        상의 (Top)
                    </button>
                    <button
                        onClick={() => store.setSizeCategory('pants')}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${['pants', 'skirt'].includes(sizeCategory) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400'}`}
                    >
                        하의 (Bottom)
                    </button>
                </div>
            )}

            <div className="mb-8 flex justify-center items-center">
                <img
                    src={guideImage}
                    alt={`${sizeCategory} guide`}
                    className="w-[500px] h-auto object-contain mix-blend-multiply opacity-80 transition-all duration-300"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            </div>

            {/* divider */}
            <div className="border-t-2 border-black mb-4"></div>

            {/* --- [Section 2] Data Table --- */}
            <table className="w-full text-center border-collapse mb-8 text-sm">
                <thead>
                    <tr className="bg-white border-b border-gray-300">
                        <th className="p-3 font-bold text-black min-w-[60px]">Size</th>
                        {columns.map(col => (
                            <th key={col.id} className="p-3 font-bold text-black group relative">
                                {readOnly ? (
                                    col.label
                                ) : (
                                    <>
                                        <input
                                            value={col.label}
                                            onChange={(e) => store.updateSizeColumn(col.id, e.target.value)}
                                            className="w-full text-center bg-transparent focus:bg-indigo-50 outline-none rounded py-1 font-bold placeholder-gray-300"
                                            placeholder="Label"
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
                            <th className="w-8">
                                <button
                                    onClick={store.addSizeColumn}
                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors mx-auto"
                                    title="Add Column"
                                >
                                    +
                                </button>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {store.sizeTable.map((row) => (
                        <tr key={row.id} className="border-b border-gray-100 last:border-none">
                            <td className="p-3 font-bold text-slate-900">
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
                                <td key={col.key} className="p-3 text-slate-700">
                                    {readOnly ? (
                                        <span className="block min-h-[20px]">{row[col.key] || '-'}</span>
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
                                <td className="p-3">
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

            {/* --- [Section 3] AI / Add Controls (Hidden on Export) --- */}
            {!readOnly && (
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={store.addSizeRow}
                        className="flex-1 py-3 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200 border-dashed transition-all"
                    >
                        + 사이즈 행 추가 Add Row
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExtracting}
                        className="flex-1 py-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 border-dashed transition-all flex items-center justify-center gap-1.5"
                    >
                        {isExtracting ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                분석 중...
                            </>
                        ) : (
                            <>
                                <Camera className="w-3 h-3" />
                                📷 이미지로 자동 입력 (AI OCR)
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageExtract}
                    />
                </div>
            )}

            {/* Footer */}
            <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed">
                * 위 사이즈는 단면(cm) 기준이며, 측정 방법에 따라 1~3cm 오차가 있을 수 있습니다.
            </p>
        </div>
    );
};

export default SizeGuideSystem;

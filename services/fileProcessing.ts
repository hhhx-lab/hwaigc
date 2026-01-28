import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { ExcelSheet, ExcelTable, ProtocolNode } from '../types';
import { GoogleGenAI } from "@google/genai";

// --- EXCEL PARSING ---

export const parseExcelFile = async (file: File): Promise<ExcelSheet[]> => {
  const data = await file.arrayBuffer();
  // Parsing binary is fast, rendering JSON is the bottleneck for UI.
  const workbook = XLSX.read(data, { dense: true }); // 'dense' mode is faster/less memory
  
  const sheets: ExcelSheet[] = [];
  const safeFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');

  workbook.SheetNames.forEach((name, index) => {
    const ws = workbook.Sheets[name];
    
    // Performance: Limit to first 200 rows for Structure Analysis & Preview.
    // Real validation will load data on demand or in chunks later.
    // 'limit' is not a valid option for sheet_to_json, so we slice the result.
    const jsonData = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]).slice(0, 200);
    
    // Heuristic: Find the best candidate for the Header Row.
    let bestHeaderRowIdx = 0;
    let maxScore = -1;
    const scanLimit = Math.min(jsonData.length, 25);

    for (let i = 0; i < scanLimit; i++) {
        const row = jsonData[i] || [];
        const filledCols = row.filter(c => c !== undefined && c !== null && c.toString().trim() !== '').length;
        
        if (filledCols === 0) continue;

        let stringCount = 0;
        row.forEach(cell => {
             const s = cell ? cell.toString().trim() : '';
             if (s && isNaN(Number(s))) {
                 stringCount++;
             }
        });

        const score = filledCols + (stringCount * 2);

        if (score > maxScore) {
            maxScore = score;
            bestHeaderRowIdx = i;
        }
    }

    if (maxScore <= 0 && jsonData.length > 0) {
        bestHeaderRowIdx = 0;
    }

    const headers = jsonData[bestHeaderRowIdx].map(h => h?.toString() || `Col`);
    const validRows: string[][] = [];
    const unstructured: string[] = [];

    for (let i = bestHeaderRowIdx + 1; i < jsonData.length; i++) {
        const row = jsonData[i] || [];
        const filledCount = row.filter(c => c).length;
        const headerCount = headers.length;
        
        if (filledCount > 0 && filledCount < headerCount * 0.4) {
             const text = row.join(' ').trim();
             if (text.length > 5) unstructured.push(text);
        } else if (filledCount >= 1) { 
            const cleanRow = headers.map((_, colIdx) => row[colIdx]?.toString() || "");
            validRows.push(cleanRow);
        }
    }

    if (validRows.length > 0) {
        const uniqueSheetId = `sheet_${safeFileName}_${index}`;
        const uniqueTableId = `table_${safeFileName}_${index}_1`;

        sheets.push({
            id: uniqueSheetId,
            name: `${name} [${file.name}]`,
            tables: [{
                id: uniqueTableId,
                name: `${name} Main Table`,
                headers,
                rows: validRows,
                unstructuredData: unstructured,
                isVerified: false
            }]
        });
    }
  });

  return sheets;
};

// --- WORD PARSING ---

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key required for parsing");
    return new GoogleGenAI({ apiKey });
};

// Recursive helper to ensure every node has an ID
const assignIds = (nodes: any[], parentId = 'root'): ProtocolNode[] => {
    return nodes.map((node, index) => {
        // Generate a stable-ish ID if missing
        const id = node.id || `${parentId}-${index}-${Date.now().toString(36)}`;
        return {
            ...node,
            id,
            children: node.children ? assignIds(node.children, id) : []
        } as ProtocolNode;
    });
};

export const parseProtocolFile = async (file: File): Promise<ProtocolNode[]> => {
    const arrayBuffer = await file.arrayBuffer();
    
    // Mammoth: Convert to HTML but we will strip it heavily
    const result = await mammoth.convertToHtml({ arrayBuffer });
    let rawHtml = result.value;

    // --- CRITICAL PERFORMANCE OPTIMIZATION ---
    // 1. Remove Images: Mammoth converts images to Base64 strings inside <img> tags. 
    //    This can make the text MBs in size. Remove them immediately.
    rawHtml = rawHtml.replace(/<img[^>]*>/g, "[IMAGE REMOVED]");
    
    // 2. Remove Styles & Classes: We only need structure (h1, h2, p, table), not CSS.
    rawHtml = rawHtml.replace(/\s(class|style|width|height)="[^"]*"/g, "");
    
    // 3. Remove Comments
    rawHtml = rawHtml.replace(/<!--[\s\S]*?-->/g, "");

    // 4. Truncate if still massive (safety net for Context Window)
    const textContext = rawHtml.substring(0, 80000); 

    const ai = getClient();
    
    const prompt = `
        You are a Clinical Data Scientist specializing in GLP Study Protocols.
        Analyze the following HTML content derived from a Word document.
        
        YOUR TASK:
        Construct a hierarchical JSON tree representing the study protocol structure.
        Support nesting up to Level 4 (e.g., 1. -> 1.1 -> 1.1.1 -> 1.1.1.a).

        REQUIREMENTS FOR EACH NODE:
        1. **number**: The section number (e.g., "3.2.1").
        2. **title**: The section heading.
        3. **description**: A ONE-SENTENCE SUMMARY of what this section is about. NOT the full text. Summarize the intent (e.g., "Defines the statistical methods for body weight analysis").
        4. **acceptanceCriteria**: Extract specific numeric limits, logical checks, or pass/fail criteria (e.g., "p-value < 0.05", "Variation < 15%"). If none, use null.
        5. **level**: Depth level (1, 2, 3, 4).
        6. **children**: Array of sub-sections.

        HTML CONTENT:
        ${textContext}

        OUTPUT FORMAT:
        Return ONLY a raw JSON array of 'ProtocolNode' objects. Do not include markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const text = response.text || "[]";
        const rawNodes = JSON.parse(text);
        
        // IMPORTANT: Ensure IDs exist before returning to UI
        return assignIds(rawNodes);

    } catch (e) {
        console.error("AI Parsing failed", e);
        // Fallback structure if AI fails
        return [{
            id: 'err-1',
            number: '0.0',
            title: 'Manual Review Required',
            description: 'AI could not parse the document structure automatically.',
            level: 1,
            children: []
        }];
    }
};

export const analyzeTemplateStyle = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const rawText = result.value.substring(0, 50000); // Context limit

        const ai = getClient();
        const prompt = `
            Analyze the following text sample from a Client's Report Template.
            Create a concise "Writing Style Guide" that I can use to instruct an LLM to write exactly like this author.
            
            Focus on extracting these specific rules:
            1. **Voice & Tense**: (e.g., Passive/Active, Past/Present).
            2. **Terminology**: Specific words used for subjects (e.g., "animals" vs "subjects"), dosing, or statistical significance.
            3. **Formatting Patterns**: How are p-values written? How are units written?
            4. **Detail Level**: Is it verbose and descriptive, or bulleted and concise?
            
            TEMPLATE SAMPLE:
            ${rawText}
            
            OUTPUT:
            A set of instructions starting with "STYLE GUIDE:".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        return response.text || "Style Guide: Standard GLP Reporting format (Passive voice, Past tense).";
    } catch (e) {
        console.warn("Template analysis failed, using default style.", e);
        return "Style Guide: Standard GLP Reporting format (Passive voice, Past tense).";
    }
}

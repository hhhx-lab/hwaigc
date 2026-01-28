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

// --- WORD PARSING & STRUCTURE GENERATION ---

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
    // Legacy fallback if needed, but we mostly use generateReportStructure now
    return generateReportStructure(file, null, []);
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

/**
 * Generates the FINAL Report Directory Structure by synthesising:
 * 1. Template Structure (The Skeleton)
 * 2. Protocol Content (The Context/Description for each section)
 * 3. Excel Headers (To know what data is available)
 */
export const generateReportStructure = async (
    protocolFile: File,
    templateFile: File | null,
    excelSheets: ExcelSheet[]
): Promise<ProtocolNode[]> => {
    try {
        const ai = getClient();

        // 1. Extract Text from Protocol
        const protocolBuf = await protocolFile.arrayBuffer();
        const protocolRes = await mammoth.extractRawText({ arrayBuffer: protocolBuf });
        const protocolText = protocolRes.value.substring(0, 50000);

        // 2. Extract Text from Template (if exists)
        let templateText = "Use Standard GLP Report Structure (Introduction, Materials, Methods, Results, Discussion, Conclusion).";
        if (templateFile) {
            const templateBuf = await templateFile.arrayBuffer();
            const templateRes = await mammoth.extractRawText({ arrayBuffer: templateBuf });
            templateText = templateRes.value.substring(0, 50000);
        }

        // 3. Prepare Excel Metadata
        const excelSummary = excelSheets.map(sheet => {
            return `Sheet: ${sheet.name}, Tables: ${sheet.tables.map(t => `${t.name} (Headers: ${t.headers.slice(0,5).join(', ')}...)`).join('; ')}`;
        }).join('\n');

        // 4. Prompt for Synthesis
        const prompt = `
            You are a Senior GLP Report Architect. 
            Your goal is to design the Table of Contents (Directory Structure) for a final clinical/pre-clinical report.

            ### INPUTS
            1. **TEMPLATE STRUCTURE (High Priority)**: The directory structure MUST follow the patterns found in this text:
               ${templateText.substring(0, 5000)}... (truncated)

            2. **PROTOCOL CONTENT (Context Source)**: Use the details from this protocol to populate the specific descriptions and customize the titles where necessary (e.g., if Template says "Test Item", but Protocol says "Compound ABC", use "Test Item (Compound ABC)"):
               ${protocolText.substring(0, 15000)}... (truncated)

            3. **AVAILABLE DATA ASSETS**: These are the Excel tables available. Ensure the structure has sections that can logically house this data:
               ${excelSummary}

            ### INSTRUCTIONS
            - Generate a nested JSON tree representing the Report Sections.
            - **Hierarchy**: Support up to 4 levels of depth.
            - **Descriptions**: For EACH node, write a 1-sentence summary of what this section should contain, based on the PROTOCOL details. 
            - **Alignment**: If the Excel data contains "Body Weight", ensure there is a "Body Weight" section in the Results chapter.

            ### OUTPUT FORMAT (Strict JSON)
            Return ONLY a JSON array of 'ProtocolNode' objects:
            [
              {
                "id": "1",
                "number": "1.0",
                "title": "Introduction",
                "description": "Overview of the study objective regarding [Specific Protocol Objective].",
                "level": 1,
                "children": [...]
              }
            ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using Pro for complex structural synthesis
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 2048 } // Think about the structure alignment
            }
        });

        const text = response.text || "[]";
        const rawNodes = JSON.parse(text);

        return assignIds(rawNodes);

    } catch (e) {
        console.error("Structure Generation Failed", e);
        // Fallback
        return [{
            id: 'fallback-1',
            number: '1.0',
            title: 'Report Structure Generation Failed',
            description: 'Please retry or check your input files.',
            level: 1,
            children: []
        }];
    }
};

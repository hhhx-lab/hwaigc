import { GoogleGenAI } from "@google/genai";
import { ExcelTable, ProtocolNode, ChapterMapping, ExcelSheet } from "../types";

// Helper to initialize the client safely using process.env.API_KEY strictly
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing from process.env.API_KEY");
    throw new Error("API Key not configured in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateReportSection = async (
  protocol: ProtocolNode,
  tables: ExcelTable[],
  styleGuide: string,
  additionalInstructions: string = ""
): Promise<string> => {
  try {
    const ai = getClient();
    
    // 1. Construct Data Context (Markdown Format)
    let dataContext = "";
    if (tables.length === 0) {
      dataContext = "No specific data tables were mapped to this section. Provide a general template.";
    } else {
      tables.forEach((table, index) => {
        dataContext += `\n### Source Table ${index + 1}: ${table.name}\n`;
        // Markdown Header
        dataContext += `| ${table.headers.join(' | ')} |\n`;
        dataContext += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
        // Rows
        table.rows.forEach(row => {
          dataContext += `| ${row.map(cell => cell ? cell.toString().replace(/\n/g, ' ').trim() : '').join(' | ')} |\n`;
        });
        // Notes
        if (table.unstructuredData && table.unstructuredData.length > 0) {
          dataContext += `\n**Study Notes:**\n${table.unstructuredData.map(n => `- ${n}`).join('\n')}\n`;
        }
        dataContext += "\n---\n";
      });
    }

    // 2. High-Fidelity Prompt for Gemini 3 Pro
    const prompt = `
      You are the **Senior Study Director** for a GLP (Good Laboratory Practice) Pre-clinical Study.
      Your task is to write the **Results and Discussion** section for a specific protocol chapter.

      ### 1. ASSIGNMENT
      **Protocol Chapter:** ${protocol.number} ${protocol.title}
      **Context:** ${protocol.description || 'Analyze the provided data.'}
      **Criteria:** ${protocol.acceptanceCriteria || 'Standard statistical significance (p<0.05).'}

      ### 2. WRITING STYLE GUIDE (CRITICAL)
      Follow these rules exactly to match the client's template:
      ${styleGuide}

      ### 3. SOURCE DATA
      ${dataContext}

      ### 4. EXECUTION INSTRUCTIONS
      1.  **Comprehensive Detail**: Do NOT summarize. Write a full, formal report section. If the data permits, this should be several paragraphs long.
      2.  **Evidence-Based**: You MUST cite specific numbers, means, standard deviations, and p-values from the tables to support every claim.
      3.  **Structure**:
          *   Start immediately with the text (no "Here is the report").
          *   **Results**: Describe the findings in detail, comparing Dosing Groups to Control Groups.
          *   **Statistical Analysis**: Explicitly mention if differences were significant (p<0.05) or not.
          *   **Conclusion**: Briefly interpret the biological relevance.
      4.  **Handling Missing Data**: If mapped tables are empty or irrelevant, state: "No data was provided for this section."
    `;

    // Use Gemini 3 Pro for complex reasoning and writing tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 8192, // Allow for very long reports
        temperature: 0.3, // Low temperature for factual accuracy and style adherence
        thinkingConfig: { thinkingBudget: 1024 } // Dedicate some tokens to planning the report structure
      }
    });

    return response.text || "Report generation produced no text. Please check input data.";

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return `Generation Failed: ${error.message || "Unknown error"}. Ensure API Key is valid and Model is accessible.`;
  }
};

export const autoMapTables = async (
    protocolNodes: ProtocolNode[],
    excelSheets: ExcelSheet[]
): Promise<ChapterMapping[]> => {
    try {
        const ai = getClient();

        // Prepare context
        const flatProtocol = [];
        const traverse = (nodes: ProtocolNode[]) => {
            nodes.forEach(n => {
                flatProtocol.push({ id: n.id, title: `${n.number} ${n.title}`, desc: n.description });
                if (n.children) traverse(n.children);
            });
        };
        traverse(protocolNodes);

        const flatTables = [];
        excelSheets.forEach(sheet => {
            sheet.tables.forEach(t => {
                flatTables.push({ id: t.id, name: t.name, headers: t.headers.slice(0, 5) });
            });
        });

        const prompt = `
            Act as a Data Manager. Map these Excel Tables to the most relevant Protocol Sections.
            
            SECTIONS: ${JSON.stringify(flatProtocol)}
            TABLES: ${JSON.stringify(flatTables)}
            
            Return a JSON Array: [{ "protocolId": "...", "tableId": "..." }]
            Only map if there is a strong semantic match.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Flash is sufficient for mapping
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const rawMappings = JSON.parse(response.text || "[]");
        
        // Group by Protocol ID
        const map = new Map<string, string[]>();
        rawMappings.forEach((m: any) => {
            if (m.protocolId && m.tableId) {
                const list = map.get(m.protocolId) || [];
                if (!list.includes(m.tableId)) list.push(m.tableId);
                map.set(m.protocolId, list);
            }
        });

        const result: ChapterMapping[] = [];
        map.forEach((ids, pid) => {
            result.push({ protocolId: pid, tableIds: ids, isVerified: false, columnMappings: [] });
        });

        return result;

    } catch (error) {
        console.error("Auto-mapping error:", error);
        return [];
    }
};

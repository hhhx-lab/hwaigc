import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { ProtocolNode, ReportContent } from "../types";

export const generateWordDocument = async (
  protocolTree: ProtocolNode[],
  reportContents: Record<string, ReportContent>,
  projectTitle: string
): Promise<Blob> => {
  
  // Recursive function to build document sections based on the tree
  const buildSections = (nodes: ProtocolNode[]): Paragraph[] => {
    let paragraphs: Paragraph[] = [];

    nodes.forEach(node => {
      // 1. Determine Heading Level
      let headingLevel: HeadingLevel = HeadingLevel.HEADING_1;
      if (node.level === 2) headingLevel = HeadingLevel.HEADING_2;
      if (node.level === 3) headingLevel = HeadingLevel.HEADING_3;
      if (node.level >= 4) headingLevel = HeadingLevel.HEADING_4;

      // 2. Add Section Title (e.g., "1.1 Body Weight")
      paragraphs.push(
        new Paragraph({
          text: `${node.number} ${node.title}`,
          heading: headingLevel,
          spacing: { before: 200, after: 100 }, // Add breathing room
        })
      );

      // 3. Add Content (if it exists)
      const content = reportContents[node.id];
      if (content && content.generatedText) {
        // Simple Markdown cleaning: remove **bold** markers for the Word doc
        // In a real app, we would parse MD to TextRuns with bold styling.
        const cleanText = content.generatedText.replace(/\*\*/g, "");
        
        // Split by newlines to create separate paragraphs
        const lines = cleanText.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ 
                    text: line.trim(),
                    size: 24, // 12pt font
                    font: "Times New Roman"
                })],
                spacing: { after: 120 },
                alignment: AlignmentType.JUSTIFIED
              })
            );
          }
        });
      } else {
        // Placeholder if no content was generated
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "[No content generated for this section]",
                        italics: true,
                        color: "808080"
                    })
                ]
            })
        );
      }

      // 4. Recurse for children
      if (node.children && node.children.length > 0) {
        paragraphs = [...paragraphs, ...buildSections(node.children)];
      }
    });

    return paragraphs;
  };

  const docBody = buildSections(protocolTree);

  const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                run: {
                    font: "Times New Roman",
                    size: 24, // 12pt
                },
                paragraph: {
                    spacing: { line: 276 }, // 1.15 spacing
                },
            },
            {
                id: "Heading1",
                name: "Heading 1",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 32, // 16pt
                    bold: true,
                    color: "000000",
                },
                paragraph: {
                    spacing: { before: 240, after: 120 },
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    size: 28, // 14pt
                    bold: true,
                    color: "000000",
                },
            }
        ]
    },
    sections: [
      {
        properties: {},
        children: [
          // Title Page
          new Paragraph({
            text: projectTitle || "GLP Study Report",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 500 }
          }),
          new Paragraph({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 2000 } // Big gap
          }),
          
          // Page Break implied by section flow, or we can force one.
          // For now, we just list the sections.
          ...docBody
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};
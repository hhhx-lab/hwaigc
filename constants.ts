import { ProtocolNode, ExcelSheet } from './types';

export const DEMO_PROTOCOL_TREE: ProtocolNode[] = [
  {
    id: 'p-1',
    number: '1',
    title: 'Summary',
    level: 1,
    description: 'Overall study summary and conclusion.',
    children: []
  },
  {
    id: 'p-2',
    number: '2',
    title: 'Test Material Information',
    level: 1,
    description: 'Details of the test substance provided.',
    children: []
  },
  {
    id: 'p-3',
    number: '3',
    title: 'Body Weight Analysis',
    level: 1,
    description: 'Analysis of subject body weight changes over time.',
    children: [
        {
            id: 'p-3-1',
            number: '3.1',
            title: 'Group Mean Body Weights',
            level: 2,
            description: 'Statistical mean weights per group.',
        },
        {
            id: 'p-3-2',
            number: '3.2',
            title: 'Individual Body Weight Gain',
            level: 2,
            description: 'Individual subject tracking.',
        }
    ]
  },
  {
    id: 'p-4',
    number: '4',
    title: 'Hematology',
    level: 1,
    description: 'Blood test analysis results.',
    children: [
        {
            id: 'p-4-1',
            number: '4.1',
            title: 'Red Blood Cells',
            level: 2,
            description: 'RBC counts and morphology.',
        }
    ]
  }
];

export const DEMO_EXCEL_DATA: ExcelSheet[] = [
  {
    id: 'sheet-1',
    name: 'Body Weights',
    tables: [
      {
        id: 'table-bw-1',
        name: 'Group Mean Weights (g)',
        headers: ['Day', 'Group 1 (Control)', 'Group 2 (Low)', 'Group 3 (High)', 'P-Value'],
        rows: [
          ['0', '250.2 ± 10.1', '248.5 ± 9.8', '251.0 ± 11.2', '-'],
          ['7', '265.5 ± 12.3', '260.1 ± 10.5', '255.4 ± 15.1*', '0.04'],
          ['14', '280.1 ± 13.5', '275.2 ± 11.8', '260.5 ± 18.2**', '0.01'],
        ],
        unstructuredData: [
          "Note: * indicates p < 0.05 vs Control",
          "Note: ** indicates p < 0.01 vs Control",
          "Animal #402 removed from study on Day 10 due to unrelated injury."
        ],
        isVerified: false
      }
    ]
  },
  {
    id: 'sheet-2',
    name: 'Hematology Data',
    tables: [
      {
        id: 'table-hem-1',
        name: 'RBC Parameters',
        headers: ['Group', 'RBC (10^6/uL)', 'HGB (g/dL)', 'HCT (%)'],
        rows: [
          ['Control', '7.5 ± 0.4', '14.2 ± 0.5', '42.0 ± 2.1'],
          ['Low Dose', '7.4 ± 0.3', '14.1 ± 0.6', '41.8 ± 1.9'],
          ['High Dose', '6.8 ± 0.5*', '12.9 ± 0.8*', '38.5 ± 2.4*'],
        ],
        unstructuredData: [
           "Blood samples collected via tail vein.",
           "Significant decrease observed in High Dose group."
        ],
        isVerified: false
      }
    ]
  }
];

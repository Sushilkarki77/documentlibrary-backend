import fs from 'fs/promises';
import pdf, { Result } from 'pdf-parse';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { WorkerMessage, WorkerResponse, Owner, OriginalDocument } from '../types/interfaces';
import { Chunk } from '../models/chunk.model';
import { Types } from 'mongoose';
import { downloadFileBuffer } from './s3.service';
// dotenv.config();


const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const extractTextContents = async (pdfContent: Buffer): Promise<Result> => {
  const extractedText = await pdf(pdfContent);
  return extractedText;
}

export const readFileFronStorage = async (fileName: string) => {
  try {
    const blob = await readFile(path.join(`src/services/uploads/${fileName}`));
    return blob;
  } catch (error) {
    throw error;
  }
}

const readFile = async (filePath: string): Promise<Buffer> => {
  const blogFIles = await fs.readFile(filePath);
  return blogFIles;
}

async function generateOverlappingChunks(text: string, owner: Owner, originalDocument: OriginalDocument, groupSize: number = 3, overlap: number = 1) {
  const paragraphs = text.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);

  const chunksToProcess = [];
  let i = 0;
  let chunkIndex = 0;

  const title = paragraphs[0].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';

  while (i < paragraphs.length) {
    const group = paragraphs.slice(i, i + groupSize);
    if (group.length === 0) break;
    const chunkText = group.join('\n\n').trim();
    chunksToProcess.push({ chunkIndex, chunkText, title });
    chunkIndex++;
    i += groupSize - overlap;
  }


  const processChunk = async ({ chunkIndex, chunkText, title }: { chunkIndex: number, chunkText: string, title: string }): Promise<Chunk> => {
    const [summary, embeddingResponse] = await Promise.all([
      summarizeAndTag(chunkText),
      openAi.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunkText,
      }),
    ]);
    return {
      title,
      chunkIndex,
      text: chunkText,
      owner,
      originalDocument,
      embedding: embeddingResponse.data[0].embedding,
      ...summary
    };
  };


  const results = await Promise.all(chunksToProcess.map(processChunk));
  return results;
}

async function summarizeAndTag(text: string): Promise<{ previewText: string, tags: string[] }> {
  const prompt = `
Text:
"""
${text}
"""

Summarize the following content concisely and directly. Always begin with the topic of the section, followed by a brief description.

Avoid phrases like "The text says," "The content describes," "The provided text outlines," or any similar meta-comments.

Provide only a clean, plain summary.

Respond with a plain JSON object only, without markdown formatting or code blocks.

Respond in this JSON format:
{
  "previewText": "...",
  "tags": ["...", "...", "..."]
}
`;

  const response = await openAi.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  const content = response.choices[0].message.content;

  if (!content) {
    throw new Error('error summarizing')
  }

  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    console.error("Failed to parse response:", content);
    return { previewText: "", tags: [] };
  }
}


process.on('message', async (msg: WorkerMessage) => {
  try {
    const blob = await downloadFileBuffer(msg.originalDocument.filename);
    if (!blob) throw new Error("Error reading file");
    const extractedContents = await extractTextContents(blob);
    const chunks: Chunk[] = await generateOverlappingChunks(extractedContents.text, msg.owner, msg.originalDocument);
    const response: WorkerResponse = { chunks };
    process.send?.(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const response: WorkerResponse = { error: errorMsg };
    process.send?.(response);
  }
});

















// (async () => {

//   const originalDocument: OriginalDocument = {
//     _id: new Types.ObjectId('684ed8dd22d2305792f37bfa'),
//     filename: "file-1743382128819-599593192.pdf",
//     title: "Lecture-05.pdf"
//   }
//   const owner: Owner = {
//     _id: new Types.ObjectId('684c4a5f6af9680464b689ff'),
//     email: "sushilkarki352@gmail.com",
//     fullname: "Sushil Karki"
//   }

//   console.time('Total Processing Time');
//   const blob = await readFileFronStorage(path.join('file-1743382128819-599593192.pdf'));
//   const extractedContents: Result = await extractTextContents(blob);
//   const chunks = await generateOverlappingChunks(extractedContents.text, owner, originalDocument);
//   console.log(chunks)
//   console.timeEnd('Total Processing Time');

// })()
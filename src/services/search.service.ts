import OpenAI from "openai";
import readline from "node:readline/promises";
import { Chunk, ChunkModel } from "../models/chunk.model";
import connectDB from "../config/db.config";
import dotenv from 'dotenv';
import { Types } from "mongoose";
import { ResponseChunk, SearchResult } from "../types/interfaces";

// dotenv.config();

const vectorIndexName = process.env.VECTOR_INDEX as string;

const openAi = new OpenAI(
    { apiKey: process.env.OPENAI_API_KEY }
);



const search = async (text: string, _id: string, skip: number, limit: number): Promise<ResponseChunk[] | undefined> => {
    try {

        const embeddingResponse = await openAi.embeddings.create({
            input: text,
            model: "text-embedding-3-small"
        });

        const queryVector = embeddingResponse.data[0].embedding;

        const results: ResponseChunk[] = await ChunkModel.aggregate([
            {
                $vectorSearch: {
                    exact: true,
                    index: vectorIndexName,
                    path: 'embedding',
                    queryVector,
                    limit: 100,
                }
            },
            {
                $addFields: {
                    score: { $meta: "vectorSearchScore" }
                }
            },
            {
                $match: {
                    'owner._id': new Types.ObjectId(_id),
                    score: { $gt: 0.6 }
                }
            },
            {
                $group: {
                    _id: '$originalDocument._id',
                    doc: { $first: '$$ROOT' }
                }
            },
            {
                $replaceRoot: { newRoot: '$doc' }
            },
            {
                $project: {
                    embedding: 0,
                    __v: 0,
                    _id: 0,
                    chunkIndex: 0,
                    'owner._id': 0,
                }
            },
            {
                $sort: {
                    score: -1
                }
            },
            {
                $setWindowFields: {
                    output: {
                        totalCount: { $count: {} }
                    }
                }
            },
            { $skip: +skip },
            { $limit: +limit }
        ]);

        return results;
    } catch (error) {
        throw error;
    }
}


export async function isQuestion(input: string): Promise<boolean> {
    const prompt = `Is the following sentence a question? Answer only with "Yes" or "No".\n\n"${input}"`;

    const res = await openAi.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
    });

    const answer = res.choices[0].message.content?.trim().toLowerCase();
    return answer === "yes";
}

export const runSearch = async (user_query: string, userId: string, skip = 0, limit = 10): Promise<SearchResult> => {
    const [result, isquestion] = await Promise.all([search(user_query, userId, skip, limit), isQuestion(user_query)])
    if (!isquestion) return { resultItems: result || [] };

    const context = JSON.stringify(result?.map(x => x.text));
    const prompt = `
                You are a knowledgeable assistant. Answer the question only using the information provided in the context below.
                    If the provided context does not include any specific answer about the question, respond with a blank string without any html tag. 
                    Do not ever provide users' personal details like email or userId.
                    If there is a answer, Format your entire answer as valid HTML that can be directly rendered in a UI. 
                    Use appropriate HTML tags such as <p>, <ul>, <li>, <strong>, etc., to structure the content clearly.
                    Do not include markdown syntax, backticks, or <html> and <body> tags.
                    Return only the inner HTML content
                "

                Context:
                """
                ${context}
                """

                Question: ${user_query}
                Answer:
                `;


    const completion = await openAi.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
        ],
        temperature: 0.3,
    });

    return { resultItems: result || [], answer: completion.choices[0].message.content || '' }

}

























// (async () => {
//     await connectDB();
//     const userId = '684c4a5f6af9680464b689ff';
//     const readline_interface = readline.createInterface({ input: process.stdin, output: process.stdout });
//     while (true) {

//         const user_query = await readline_interface.question('Enter your search Query: ');
//         if (user_query === 'exit') process.exit(0);
//         // const result = await search(user_query);
//         const [result, isquestion] = await Promise.all([search(user_query, userId), isQuestion(user_query)])
//         console.log(result)
//         if (!isquestion) { continue; };

//         const context = JSON.stringify(result);
//         const prompt = `
//                 You are a knowledgeable assistant. Answer the question **only** using the information provided in the context below.
//                 If the answer is not in the context, respond with "The answer is not available in the provided context.
//                 do not ever provide users personal details like email, userId.
//                 "

//                 Context:
//                 """
//                 ${context}
//                 """

//                 Question: ${user_query}
//                 Answer:
//                 `;


//         const completion = await openAi.chat.completions.create({
//             model: "gpt-4o-mini",
//             messages: [
//                 { role: "system", content: "You are a helpful assistant." },
//                 { role: "user", content: prompt },
//             ],
//             temperature: 0.3,
//         });

//         console.log(completion.choices[0].message.content);
//     }

// })();
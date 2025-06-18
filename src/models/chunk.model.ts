import mongoose, { InferSchemaType, model } from "mongoose";

const ChunkSchema = new mongoose.Schema({
    title: {type: String}, // Document title usually first paragraph 
    originalDocument: {
        type: {
            _id: { type: mongoose.Schema.Types.ObjectId, required: true },
            filename: { type: String, required: true },
            title: { type: String, required: true }
        }
    },
    owner: {
        type: {
            _id: { type: mongoose.Schema.Types.ObjectId, required: true },
            email: { type: String, required: true },
            fullname: { type: String, required: true }
        },
        required: true
    },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    tags: [{ type: String }],
    previewText: { type: String },
});


export type Chunk = InferSchemaType<typeof ChunkSchema>;
export const ChunkModel = model<Document>('chunk', ChunkSchema);


export const insertChunk = async (chunk: Chunk): Promise<Partial<Chunk> & {_id: mongoose.Types.ObjectId}> => {
    return await ChunkModel.create(chunk);
}
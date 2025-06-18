import mongoose, { InferSchemaType, model } from "mongoose";

const DocumentSchema = new mongoose.Schema({

    filename: { type: String, required: true }, // unique name for s3
    title: { type: String, required: true },
    owner: {
        type: {
            _id: { type: mongoose.Schema.Types.ObjectId, required: true },
            email: { type: String, required: true },
            fullname: { type: String, required: true }
        },
        required: true
    }
}, { timestamps: true });


export type Document = InferSchemaType<typeof DocumentSchema>;
export const DocumentModel = model<Document>('document', DocumentSchema);


export const getDocumentsByUserId = async (userId: string): Promise<Document[]> => {
    return await DocumentModel.find({ 'owner._id': userId }).sort({ createdAt: -1 });
}

export const deleteDocumentById = async (_id: string, ownerId: string): Promise<Document | null> => {
    return await DocumentModel.findOneAndDelete({ _id, 'owner._id': ownerId });
}

export const addDocument = async (document: Omit<Document, 'createdAt' | 'updatedAt'>): Promise<Document & {_id: mongoose.Types.ObjectId}> => {
    return await DocumentModel.create(document);
}

export const getDocumentById = async (_id: string, ownerId: string): Promise<Document & {_id: mongoose.Types.ObjectId } | null> => {
    return await DocumentModel.findById({ _id, 'owner._id': ownerId });
}
import { RequestHandler } from "express";
import { addDocument, deleteDocumentById, DocumentModel, getDocumentById, getDocumentsByUserId } from "../models/document.model";
import { ErrorWithStatus, ResponseItem } from "../types/interfaces";
import { Document } from '../models/document.model';
import { deleteFileFromS3, generateDownloadUrl, getPreSignedURL } from "../services/s3.service";
import mongoose from "mongoose";
import { runChunkWorker } from "../services/chunk.worker.wrapper";
import { ChunkModel } from "../models/chunk.model";


export const getDocumentsByUserIdHandler: RequestHandler<unknown, ResponseItem<Document[]>> = async (req, res, next) => {
    try {
        const user = req.user;
        const documents: Document[] = await getDocumentsByUserId(user._id) ?? [];
        res.status(200).json({ data: documents })
    } catch (error) {
        return next(error);
    }
}


export const addDocumentHandler: RequestHandler<unknown, ResponseItem<Pick<Document, 'createdAt' | 'owner' | 'title' | 'filename'> & { uploadUrl: string }>, { documentName: string, _id: string }> = async (req, res, next) => {

    try {
        const user = req.user;
        const reqBody = req.body;
        const { uploadUrl, filename } = await getPreSignedURL();
        const { _id, createdAt, owner, title } = await addDocument(
            {
                title: reqBody.documentName,
                filename,
                owner: {
                    _id: new mongoose.Types.ObjectId(user._id),
                    email: user.email,
                    fullname: user.fullname
                }
            }
        );

        res.status(200).json({ message: "Document added successfully!", data: { ...{ _id, createdAt, owner, title, filename }, uploadUrl } })
    } catch (error) {
        return next(error);
    }
}




export const deleteDocumentHandler: RequestHandler<{ documentId: string }, ResponseItem<Document>, unknown> = async (req, res, next) => {
    try {
        const user = req.user;
        const { documentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            throw new ErrorWithStatus("Invalid document ID", 400);
        }

        const document = await deleteDocumentById(documentId, user._id);

        if (!document) {
            throw new ErrorWithStatus("Document not found", 404);
        }

        await deleteFileFromS3(document.filename);


        await ChunkModel.deleteMany({ 'originalDocument._id': documentId })

        res.status(200).json({
            message: "Document deleted successfully!",
            data: document
        });

    } catch (error) {
        return next(error);
    }
}



export const getURLDownloadURL: RequestHandler<{ documentId: string }, ResponseItem<{ downloadURL: string }>> = async (req, res, next) => {

    try {
        const { documentId } = req.params;
        const user = req.user;

        if (!documentId) {
            throw new ErrorWithStatus("Invalid document id", 404);
        }

        const document = await getDocumentById(documentId, user._id);

        if (!document) {
            throw new ErrorWithStatus("IDocument does not exist", 404);
        }

        const downloadURL: string = await generateDownloadUrl(document.filename);

        res.status(200).json({ data: { downloadURL } });
    } catch (error) {
        next(error);
    }
}

export const vectorizeDocumentHandler: RequestHandler<unknown, ResponseItem<boolean>, { documentId: string }> = async (req, res, next) => {

    try {
        const { documentId } = req.body;

        if(!documentId) throw new ErrorWithStatus("Doocument Id not provided", 400);

        const doc = await getDocumentById(documentId, req.user._id);

        if (!doc) throw new ErrorWithStatus("Document not found", 404);

        const { _id, filename, title, owner } = doc;

        const chunks = await runChunkWorker({ _id, filename, title }, owner);

        await ChunkModel.insertMany(chunks)

        res.status(200).json({ status: true, message: "success", data: true })

    } catch (error) {
        next(error);
    }

}



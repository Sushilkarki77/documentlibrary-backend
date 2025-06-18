import express from 'express';
import { addDocumentHandler, deleteDocumentHandler, getDocumentsByUserIdHandler, getURLDownloadURL, vectorizeDocumentHandler } from '../controllers/documents.controller';
import { validateRequest } from '../middlewares/validator.middlewares';
import { documentSchema } from '../middlewares/schemas';


export const documentsRoutes = express.Router();

documentsRoutes.get('', getDocumentsByUserIdHandler)                                                  // get documents of currently loggedin user
documentsRoutes.post("/save-document", validateRequest(documentSchema), addDocumentHandler);          //get signed url and save document to database
documentsRoutes.get("/download-url/:documentId", getURLDownloadURL);                                  // get signed url for uploaded document
documentsRoutes.delete('/:documentId', deleteDocumentHandler);                                        //delete document from s3 and database
documentsRoutes.post('/vectorize/:documentId', vectorizeDocumentHandler);  
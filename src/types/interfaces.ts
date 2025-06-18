import { ObjectId, Types } from "mongoose";
import { Chunk } from "../models/chunk.model";

export interface ResponseItem<T> {
  message?: string
  status?: boolean
  data: T
}

export class ErrorWithStatus extends Error {
  status?: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.status = statusCode;
  }
}


export interface TokenPayload {
  _id: string;
  fullname: string;
  email: string
}

export interface AuthRequestBody {
  email: string;
  password: string;
}





export interface OriginalDocument {
  _id: Types.ObjectId;
  filename: string;
  title: string;
}

export interface Owner {
  _id: Types.ObjectId;
  email: string;
  fullname: string;
}

export interface WorkerMessage {
  originalDocument: OriginalDocument;
  owner: Owner;
}

export interface WorkerResponse {
  chunks?: Chunk[];
  error?: string;
}


export interface SearchResult {
  resultItems: ResponseChunk[];
  answer?: string;
  totalCount?: number;
};

export interface ResponseChunk {
  _id: ObjectId;
  originalDocument: {
    _id: ObjectId;
    filename: string;
    title: string;
  };
  owner: {
    _id: ObjectId;
    email: string;
    fullname: string;
  };
  chunkIndex: number;
  text: string;
  tags: string[];
  previewText?: string;
  score: number;
  totalCount?: number;
}




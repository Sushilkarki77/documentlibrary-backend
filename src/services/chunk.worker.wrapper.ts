
import { fork } from 'child_process';
import path from 'path';
import { OriginalDocument, WorkerMessage, WorkerResponse, Owner } from '../types/interfaces';
import { Chunk } from '../models/chunk.model';
import connectDB from '../config/db.config';
import dotenv from 'dotenv';

// dotenv.config();


// connectDB()
export function runChunkWorker(originalDocument: OriginalDocument, owner: Owner): Promise<Chunk[]> {
  return new Promise((resolve, reject) => {
    const worker = fork(path.resolve('src/services/document.chunking.service.ts'));

    const msg: WorkerMessage = { originalDocument, owner };
    worker.send(msg);

    worker.on('message', (msg: WorkerResponse) => {
      if (msg.error) {
        reject(new Error(msg.error));
      } else if (msg.chunks) {
        resolve(msg.chunks);
      } else {
        reject(new Error('No chunks returned'));
      }
      worker.kill();
    });

    worker.on('error', reject);

    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}








// (async () => {
//   try {
//     const originalDocument: OriginalDocument = {
//       _id: new Types.ObjectId('684ed8dd22d2305792f37bfa'),
//       filename: "lecture-4-vpc-routing.pdf",
//       title: "Lecture-05.pdf"
//     }
//     const owner: Owner = {
//       _id: new Types.ObjectId('684c4a5f6af9680464b689ff'),
//       email: "sushilkarki352@gmail.com",
//       fullname: "Sushil Karki"
//     }
//     const chunks = await runChunkWorker(originalDocument, owner);
//     console.log('chunk generated');
//     await Promise.all(chunks.map(chunk => insertChunk(chunk)));
//     console.log('chunk added')

//   } catch (error) {
//     console.error('Error from worker:', error);
//   }
// })();
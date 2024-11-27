import {
  S3Client,
  PutObjectCommand,
  PutBucketAclCommandOutput,
} from "@aws-sdk/client-s3";
import * as zlib from "node:zlib";

export const uploader =
  (bucket: string, s3Client: S3Client) => (content: string, filename: string) =>
    new Promise<{ filename: string; output: PutBucketAclCommandOutput }>(
      (resolve, reject) => {
        // upload to r2 (new destination)
        zlib.gzip(content, (err, buffer) => {
          if (err) {
            console.error(err);
            reject(err);
          }
          const putObjectCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: `dictionary/${filename}`,
            CacheControl: "no-cache",
            Body: buffer,
            ContentEncoding: "gzip",
            ContentType: filename.endsWith(".json")
              ? "application/json"
              : filename.endsWith(".xml")
              ? "application/xml"
              : "text/plain; charset=UTF-8",
          });
          s3Client
            .send(putObjectCommand)
            .then((output) => resolve({ filename, output }))
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        });
      }
    );

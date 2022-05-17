import Resizer from "react-image-file-resizer";
import {
    addToAttachmentObject, removeAttachmentFromObject,
} from "./wordlist-database";
import { WordlistWord, WordlistWordWAttachments, AttachmentWithData } from "../types/dictionary-types";

const maxImgSize = {
    width: 1200,
    height: 1200,
};

export function resizeImage(file: File): Promise<File> {
    return new Promise((resolve) => {
        Resizer.imageFileResizer(
            file,
            maxImgSize.width,
            maxImgSize.height,
            // TODO: WHAT'S THE BEST FORMAT FOR THIS?
            "JPEG",
            100,
            0,
            (file) => {
                resolve(file as File);
            },
            "file"
        );
    });
}

export function rotateImage(file: File): Promise<File> {
    return new Promise((resolve) => {
        Resizer.imageFileResizer(
            file,
            maxImgSize.width,
            maxImgSize.height,
            "JPEG",
            100,
            90,
            (file) => {
                resolve(file as File);
            },
            "file"
        );
    });
}

// https://stackoverflow.com/a/47786555/8620945
/**
 * Returns the dimensions of a given image file in pixels
 * 
 * @param file 
 * @returns 
 */
export function getImageSize(file: File | Blob): Promise<{ height: number, width: number }> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        //Read the contents of Image File.
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            //Initiate the JavaScript Image object.
            const image = new Image();

            //Set the Base64 string return from FileReader as source.
            // @ts-ignore
            image.src = reader.result;

            //Validate the File Height and Width.
            image.onload = function() {
                resolve({
                    // @ts-ignore
                    height: this.height,
                    // @ts-ignore
                    width: this.width,
                });
            };
        }
        reader.onerror = function() {
            throw new Error("error getting image dimensions");
        }
    });
};

export async function addImageToWordlistWord(word: WordlistWord, file: File): Promise<WordlistWord> {
    const isTooBig = ({ height, width }: { height: number, width: number}): boolean  => (
        (height > maxImgSize.height) || (width > maxImgSize.width)
    );
    const initialSize = await getImageSize(file);
    const { img, imgSize } = await (async () => {
        if (isTooBig(initialSize)) {
            const img = await resizeImage(file);
            const imgSize = await getImageSize(file);
            return { img, imgSize };
        }
        return { img: file, imgSize: initialSize };
    })();
    return {
        ...word,
        imgSize,
        _attachments: addToAttachmentObject(
            "_attachments" in word ? word._attachments : {},
            img.name,
            {
                "content_type": img.type,
                data: img,
            },
        ),
    };
}

export function removeImageFromWordlistWord(word: WordlistWordWAttachments) {
    const attachments = "_attachments" in word
        ? removeAttachmentFromObject(word._attachments, "image")
        : undefined;
    const { _attachments, imgSize, ...rest } = word;
    return {
        ...attachments ? {
            _attachments: attachments,
        } : {},
        ...rest
    };
}

export function prepBase64(type: string, data: string) {
    return `data:${type};base64,${data}`;
}

export function imageAttachmentToBase64(img: AttachmentWithData) {
    if (typeof img.data === "string") {
        return prepBase64(img.content_type, img.data);
    }
    throw Error("needs to be run with image data as base64");
}

export async function b64toBlob(base64: string) {
    const res = await fetch(base64);
    return await res.blob();
}

export function blobToFile(theBlob: Blob, fileName: string): File {
    let b: any = theBlob;
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModifiedDate = new Date();
    b.name = fileName;

    //Cast to a File() type
    return theBlob as File;
}
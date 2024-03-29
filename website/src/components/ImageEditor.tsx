import { useState, useEffect, useRef, useCallback } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
    addImageToWordlistWord,
    blobToFile,
    b64toBlob,
    rotateImage,
} from "../lib/image-tools";
import {
    getImageAttachment,
    updateWordlistWord,
} from "../lib/wordlist-database";
import WordlistImage from "./WordlistImage";
import { WordlistWord } from "../types/dictionary-types";

// TODO: !! remember to save the new dimensions whenever modifying the image

function ImageEditor({ word }: { word: WordlistWord }) {
    const imgRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const [cropping, setCropping] = useState<boolean>(false);
    const [crop, setCrop] = useState({ height: 0 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (!("_attachments" in word)) return;
        getImageAttachment(word).then((img) => {
            setImgSrc(img);
        }).catch(console.error);
    }, [word]);
    useEffect(() => {
        if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
          return;
        }
    
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        const crop = completedCrop;
        // @ts-ignore
        const scaleX = image.naturalWidth / image.width;
        // @ts-ignore
        const scaleY = image.naturalHeight / image.height;
        // @ts-ignore
        const ctx = canvas.getContext('2d');
        const pixelRatio = window.devicePixelRatio;
        // @ts-ignore
        canvas.width = crop.width * pixelRatio;
        // @ts-ignore
        canvas.height = crop.height * pixelRatio;
    
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';
        // @ts-ignore
        ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
    }, [completedCrop]);
    const onLoad = useCallback((img) => {
        imgRef.current = img;
    }, []);
    function generateCropped(canvas: any, crop: any) {
        if (!crop || !canvas) {
            return;
        }
      
        canvas.toBlob(async (blob: Blob) => {
                const wCropped = await addImageToWordlistWord(word, blobToFile(blob, "cropped.png"));
                updateWordlistWord(wCropped);
            },
            "image/png",
            1
        );
        setCrop({ height: 0 });
        setCropping(false);
    }
    function acceptCrop() {
        if (crop.height === 0) {
            alert("select area to crop");
            return;
        }
        generateCropped(previewCanvasRef.current, completedCrop);
    }
    function startCropping() {
        setCropping(true);
        setCrop({ height: 0 });
    }
    function cancelCropping() {
        setCropping(false);
        setCrop({ height: 0 });
    }
    async function handleRotateImage() {
        if (!imgSrc) return;
        const blob = await b64toBlob(imgSrc);
        const rotated = await rotateImage(blobToFile(blob, "rotated"));
        const wRotated = await addImageToWordlistWord(word, rotated);
        updateWordlistWord(wRotated);
    }
    
    return <div className="mt-2"> 
        <div className="d-flex flex-row justify-content-center">
            {!cropping ?
                <>
                    <div>
                        <button className="btn btn-sm btn-secondary mr-3" onClick={startCropping}>
                            <i className="fas fa-crop" />
                        </button>
                    </div>
                    <div>
                        <button className="btn btn-sm btn-secondary" onClick={handleRotateImage}>
                            <i className="fas fa-sync" />
                        </button>
                    </div>
                </>
            :
                <>
                    <div>
                        <button className="btn btn-sm btn-secondary mr-3" onClick={cancelCropping}>
                            <i className="fas fa-times" />
                        </button>
                    </div>
                    <div>
                        <button className="btn btn-sm btn-secondary" onClick={acceptCrop} disabled={crop.height === 0}>
                            <i className="fas fa-check" />
                        </button>
                    </div>
                    <div className="d-flex align-items-center">
                        <small className="text-muted ml-3">select area to crop</small> 
                    </div>
                </>
            }
        </div>
        <div className="text-center mt-2">
            {(cropping && imgSrc) ?
                <div style={{ touchAction: "none" }}>
                    <ReactCrop
                        src={imgSrc}
                        onImageLoaded={onLoad}
                        crop={crop}
                        // @ts-ignore
                        onChange={(c) => setCrop(c)}
                        // @ts-ignore
                        onComplete={(c) => setCompletedCrop(c)}
                    />
                    <div style={{ display: "none" }}>
                        <canvas
                            ref={previewCanvasRef}
                            // Rounding is important so the canvas width and height matches/is a multiple for sharpness.
                            style={{
                                // @ts-ignore
                                width: Math.round(completedCrop?.width ?? 0),
                                // @ts-ignore
                                height: Math.round(completedCrop?.height ?? 0)
                            }}
                        />
                    </div>
                </div>
            :
                <WordlistImage word={word} />
            }
        </div>
    </div>;
}

export default ImageEditor;
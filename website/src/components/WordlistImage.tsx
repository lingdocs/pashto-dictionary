import { useState, useEffect } from "react";
import { getImageAttachment } from "../lib/wordlist-database";
import { WordlistWord } from "../types/dictionary-types";

function WordlistImage({ word }: { word: WordlistWord }) {
    const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (!("_attachments" in word)) {
            console.error("no image attachment to display");
            return;
        }
        getImageAttachment(word).then((imgB64) => {
            setImgSrc(imgB64);
        });
    }, [word]);
    return <div className="text-center" style={{ padding: 0, margin: 0 }}>
        {imgSrc ?
            <img
                className="img-fluid"
                src={imgSrc}
                alt="wordlist img"
            /> 
        :
            "imgSize" in word ?
                <canvas
                    className="img-fluid"
                    {...word.imgSize}
                    style={{
                        display: "block",
                        border: 0,
                        padding: 0,
                        margin: "0 auto",
                        background: "grey",
                    }}
                />
            : <div>IMG SIZE ERROR</div>
        }
    </div>;
};

export default WordlistImage;

/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from "react";
import {
    getAudioAttachment,
} from "../lib/wordlist-database";

export function AudioPlayButton({ word }: { word: WordlistWord }) {
    const [src, setSrc] = useState<string | undefined>(undefined);
    const [type, setType] = useState<string | undefined>(undefined);
    useEffect(() => {
        getAudioAttachment(word).then((audio) => {
            if (!audio) return;
            const src = URL.createObjectURL(audio);
            setSrc(src);
            setType("type" in audio ? audio.type : undefined);
            return () => {
                URL.revokeObjectURL(src);
            };
        }).catch(console.error);
    }, [word]);
    return (
        <div className="text-center mb-3">
            <audio controls>
                {src && <source src={src} type={type} />} 
            </audio>
        </div>
    );
}

export default AudioPlayButton;
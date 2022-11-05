/**
 * Copyright (c) 2021 lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useRef } from "react";
import { SuperMemoGrade } from "supermemo";

function ReviewScoreInput({ handleGrade, guide }: {
    handleGrade: (grade: SuperMemoGrade) => void,
    guide: boolean,
}) {
    const box = useRef(null);
    function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        // @ts-ignore
        const totalWidth = box.current.offsetWidth;
        const clickX = e.clientX;
        const percentage = clickX / totalWidth;
        const exactScore = percentage / (1 / 5);
        // bump up the 0 range a tad bit to make it easier to hit with right thumb on phone
        const score = Math.round(exactScore < 0.7 ? 0 : exactScore) as 0 | 1 | 2 | 3 | 4 | 5;
        handleGrade(score);
    }
    return <div className="clickable" ref={box} onClick={handleClick}>
        {guide && <div className="text-muted" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: "0.5rem", padding: "0 0.10rem" }}>
          <div>😫 fail</div>
          <div>took 🤔 time</div>
          <div>easy 😄</div>
        </div>}
        <div
            style={{
                width: "100%",
                height: "3rem",
                borderRadius: "5px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 1rem",
                color: "rgba(255,255,255,0.85)",
                opacity: 0.9,
                background: "linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(142,137,0,1) 39%, rgba(0,237,11,1) 100%)",  
            }}
        >
            <div><i className="fas fa-times fa-lg"></i></div>
            <div><i className="fas fa-check fa-lg"></i></div>
        </div>
    </div>;
}

export default ReviewScoreInput;
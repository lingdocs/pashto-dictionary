import { useState } from "react";
import ReactPlayer from "react-player";

function VideoPlayer(props: { url: string } | { src: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <div className="my-4 text-center">
      <div>Offline / Video Not Available</div>
      <button className="btn btn-light mt-4 mb-4" onClick={() => setErrored(false)}>RETRY</button>
    </div>;
  }
  const url = "url" in props ? props.url : props.src;
  return <div className="player-wrapper" style={{ position: "relative", paddingBottom: "96.25%", marginBottom: "2rem" }}>
    <ReactPlayer
      src={url}
      controls={true}
      width='100%'
      height='100%'
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      onError={() => setErrored(true)}
    />
  </div>
}

export default VideoPlayer;

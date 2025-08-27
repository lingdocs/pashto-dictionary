import { useState, useEffect, useRef } from "react";
import ImageEditor from "./ImageEditor";
import { useDropzone } from "react-dropzone";
import classNames from "classnames";
import {
  addImageToWordlistWord,
  removeImageFromWordlistWord,
} from "../lib/image-tools";
import {
  addAudioToWordlistWord,
  removeAudioFromWordlistWord,
} from "../lib/audio-tools";
import {
  updateWordlistWord,
  hasAttachment,
} from "../lib/wordlist-database";
import { WordlistWord } from "../types/dictionary-types";

const droppingStyle = {
  boxShadow: "0 0 5px rgba(81, 203, 238, 1)",
  border: "1px solid rgba(81, 203, 238, 1)",
};

function WordlistWordEditor({ word }: {
  word: WordlistWord,
}) {
  const imageFileInput = useRef<HTMLInputElement>(null);
  const audioFileInput = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<string>(word.notes);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);

  useEffect(() => {
    // TODO: do I really want to do this? changing the notes in the box in real time
    // if it changes in the database?
    setNotes(word.notes);
    if (hasAttachment(word, "image")) {
      setLoadingImage(false);
    }
  }, [word]);
  function clearImageFileInput() {
    if (imageFileInput.current) {
      imageFileInput.current.value = "";
    }
  }
  function clearAudioFileInput() {
    if (audioFileInput.current) {
      audioFileInput.current.value = "";
    }
  }
  function handleNotesUpdate() {
    updateWordlistWord({
      ...word,
      notes,
    });
  }
  async function handleImageInput(f?: File) {
    const file = f
      ? f
      : (imageFileInput.current && imageFileInput.current.files && imageFileInput.current.files[0]);
    if (!file) {
      console.error("no image file input");
      return;
    }
    setLoadingImage(true);
    const wordWImage = await addImageToWordlistWord(word, file);
    updateWordlistWord(wordWImage);
    clearImageFileInput();
  }
  async function handleAudioInput(f?: File) {
    const file = f
      ? f
      : (audioFileInput.current && audioFileInput.current.files && audioFileInput.current.files[0]);
    if (!file) {
      console.error("no audio file input");
      return;
    }
    const wordWAudio = addAudioToWordlistWord(word, file);
    updateWordlistWord(wordWAudio);
    clearAudioFileInput();
  }
  function removeImage() {
    if (!("_attachments" in word)) return;
    const wordWoutImage = removeImageFromWordlistWord(word);
    updateWordlistWord(wordWoutImage);
    clearImageFileInput();
  }
  function removeAudio() {
    if (!("_attachments" in word)) return;
    const wordWoutAudio = removeAudioFromWordlistWord(word);
    updateWordlistWord(wordWoutAudio);
    clearAudioFileInput();
  }
  function onDrop(acceptedFiles: File[]) {
    const file = acceptedFiles[0];
    if (file.type.includes("image")) {
      handleImageInput(file);
    }
    if (file.type.includes("audio")) {
      handleAudioInput(file);
    }
  };

  const { getRootProps, isDragActive } = useDropzone({ onDrop });

  return <div>
    <div className="mb-3" {...getRootProps()} style={isDragActive ? droppingStyle : {}}>
      <div className="form-group">
        <label>Notes/context:</label>
        <textarea
          rows={3}
          dir="auto"
          className="form-control"
          data-testid="wordlistWordContextForm"
          placeholder="Add notes/context here..."
          data-lpignore="true"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="d-flex flex-row justify-content-between">
        <div className="d-flex flex-row">
          <div>
            <label className="btn btn-sm btn-secondary">
              <i className="fas fa-camera" />
              <input
                type="file"
                accept="image/*"
                ref={imageFileInput}
                onChange={() => handleImageInput()}
                hidden
              />
            </label>
          </div>
          {(hasAttachment(word, "image")) && <div>
            <button className="btn btn-sm btn-outline-secondary ml-2" onClick={removeImage}><i className="fas fa-trash" /></button>
          </div>}
          <div className="ml-3">
            <label className="btn btn-sm btn-secondary">
              <i className="fas fa-microphone mx-1" />
              <input
                type="file"
                accept="audio/*"
                ref={imageFileInput}
                onChange={() => handleAudioInput()}
                hidden
              />
            </label>
          </div>
          {(hasAttachment(word, "audio")) && <div>
            <button className="btn btn-sm btn-outline-secondary ml-2" onClick={removeAudio}><i className="fas fa-trash" /></button>
          </div>}
        </div>
        <div>
          <button
            type="button"
            className={classNames("btn", "btn-sm", "btn-secondary", { disabled: notes === word.notes })}
            onClick={handleNotesUpdate}
            data-testid="editWordSubmitButton"
          >
            {notes === word.notes ? "Notes Saved" : "Save Notes"}
          </button>
        </div>
      </div>
      {hasAttachment(word, "image")
        ? <ImageEditor word={word} />
        : loadingImage
          ? <div className="mt-2">Loading...</div>
          : null}
    </div>
  </div>;
}

export default WordlistWordEditor;

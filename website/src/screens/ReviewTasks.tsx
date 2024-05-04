import Entry from "../components/Entry";
import { Link } from "react-router-dom";
import * as FT from "../types/functions-types";
import { deleteFromLocalDb } from "../lib/pouch-dbs";
import { Types as T } from "@lingdocs/ps-react";
import { Helmet } from "react-helmet";
import { getTextOptions } from "../lib/get-text-options";
import { State } from "../types/dictionary-types";

function ReviewTask({
  reviewTask,
  textOptions,
}: {
  reviewTask: FT.ReviewTask;
  textOptions: T.TextOptions;
}) {
  function handleDelete() {
    deleteFromLocalDb("reviewTasks", reviewTask._id);
  }
  const queryParamData = {
    ...(reviewTask.sTs
      ? {
          sTs: reviewTask.sTs,
        }
      : {}),
    ...("comment" in reviewTask
      ? {
          comment: reviewTask.comment,
        }
      : {}),
    ...("entry" in reviewTask
      ? {
          id: reviewTask.entry.ts,
        }
      : {}),
  } as URLSearchParams;
  const queryString = new URLSearchParams(queryParamData).toString();
  return (
    <div className="d-flex flex-row align-items-center">
      <div className="mr-3">
        <div onClick={handleDelete} className="clickable">
          <i className="fa fa-trash" />
        </div>
      </div>
      {reviewTask.type !== "issue" && (
        <Link to={`/edit?${queryString}`} className="plain-link">
          <div className="card mb-2">
            <div className="card-body">
              {reviewTask.type === "entry suggestion" && (
                <div>New Entry Suggestion</div>
              )}
              <Entry
                admin={false}
                textOptions={textOptions}
                entry={reviewTask.entry}
              />
              <div className="mb-2">"{reviewTask.comment}"</div>
              <div className="small">
                {reviewTask.user.name} - {reviewTask.user.email}
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}

export default function ReviewTasks({ state }: { state: State }) {
  const textOptions = getTextOptions(state);
  return (
    <div className="width-limiter" style={{ marginBottom: "70px" }}>
      <Helmet>
        <title>Review Tasks - LingDocs Pashto Dictionary</title>
      </Helmet>
      <h3 className="mb-4">Review Tasks</h3>
      {state.reviewTasks.length ? (
        state.reviewTasks.map((reviewTask, i) => (
          <ReviewTask
            key={i}
            reviewTask={reviewTask}
            textOptions={textOptions}
          />
        ))
      ) : (
        <p>None</p>
      )}
    </div>
  );
}

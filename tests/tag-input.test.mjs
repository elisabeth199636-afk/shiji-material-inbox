import assert from "node:assert/strict";
import test from "node:test";

import {
  getCommittedTags,
  getCurrentTagDraft,
  parseTagInput,
  replaceCurrentTag,
} from "../lib/tag-input.ts";

test("keeps the next tag position ready after choosing a suggestion", () => {
  const value = replaceCurrentTag("周", "周边");

  assert.equal(value, "周边，");
  assert.deepEqual(getCommittedTags(value), ["周边"]);
  assert.equal(getCurrentTagDraft(value), "");
});

test("preserves committed tags and adds one trailing separator", () => {
  assert.equal(replaceCurrentTag("灵感，周", "周边"), "灵感，周边，");
  assert.equal(replaceCurrentTag("周边，周", "周边"), "周边，");
  assert.deepEqual(parseTagInput("灵感，周边，"), ["灵感", "周边"]);
});

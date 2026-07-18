# Product decisions

## Protected core features

The following features are essential product requirements. They must not be removed or reduced as part of cleanup or simplification work without an explicit new decision from the repository owner.

### Multiple API key management

- Preserve multiple API keys for every supported provider.
- Preserve active-key switching, batch registration, duplicate removal, and key cycling.
- Preserve the per-backend API key lists used by LLM Aggregator.
- Preserve settings import and export behavior for these keys.

### Input presets

- Preserve the input preset popup shown when the empty chat input receives focus.
- Preserve `続` and `展` as the default presets, including automatic submission for `続`.
- Preserve settings-based addition, editing, deletion, multiline content, and automatic submission.
- Preserve `{|}` as the editable insertion-cursor marker; without it, place the cursor at the end.

### Lorebooks

- Preserve optional Lorebook selection for each chat session.
- Start new sessions with no Lorebook and allow selection, switching, or removal for the current session from the header menu.
- Preserve the session's Lorebook assignment across save, load, duplication, and bulk export/import.
- Keep fixed story context, directional forms of address, character cores, and deterministic conditional memories structurally separate.
- Treat directional and context-dependent forms of address as critical data, and allocate their prompt budget before character cores and conditional memories.
- For future Lorebook registration, use the LLM for semantic extraction and compression, but require programmatic schema and referential-integrity validation plus editable user confirmation before persistence.
- Preserve the original source separately from the generated runtime Lorebook so editing can rerun analysis without information loss.
- Use the complete original Lorebook source as an early full-context seed and add structured, relevant Lorebook reminders near the current turn.
- After a response reaches 90% of the model's context window, stop including the full-context seed for the remainder of that session; keep the fixed core and selective reminders.
- If the selected model's context-window limit is unknown, keep the full-context seed enabled; do not infer a percentage or automatically switch injection modes.
- Never require embeddings for the baseline Lorebook retrieval path.

### Common Dummy User prompt

- Preserve one shared Dummy User prompt for all API providers.
- Preserve its enabled state and append it only to the API request, without adding it to persisted chat history.

### Memo and clipboard stack

- Preserve the independent memo panel and its copy, paste, and clear actions.
- Preserve the clipboard stack and its integration with message copy actions.

### Response branching

- Preserve sibling responses created by retrying a message.
- Preserve selection, navigation, deletion, persistence, and export behavior for branched responses.

### Streaming output

- Preserve provider-specific streaming output and character display speed settings.
- Preserve Gemini pseudo-streaming.

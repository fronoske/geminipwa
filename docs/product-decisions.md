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
- Preserve the `続` preset, including automatic submission of `（続けて）`.
- Preserve the `展` preset and its editable cursor placement for `（【今後の展開】）`.

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

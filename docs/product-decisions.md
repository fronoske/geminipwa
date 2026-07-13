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


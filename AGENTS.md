<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Single-purpose site: / is the achievement carousel for Google Sites iframe embedding. Slides are CDN asset pointer imports (src/assets/*.asset.json) — never inline the binaries. Keep the page self-contained and fully interactive inside a cross-origin iframe.
- Book promotion uses verified BriBooks product URLs and locally served cover asset pointers; embedded pages must not rely on access to their Google Sites parent frame.

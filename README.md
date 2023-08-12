# Aster
A robust file uploader for [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/).

<img width="791" alt="a screenshot of aster" src="https://github.com/kotx/aster/assets/33439542/19b7ea0d-0d1c-40b5-963a-5d815cc9aa06">

## Notes
- Aster **DOES NOT AUTHENTICATE**! You should put it behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/).
- Non-multipart uploads are currently disabled in the UI because Uppy doesn't display the URL: https://github.com/transloadit/uppy/issues/4618

## Setup
- Configure the R2 bucket CORS policy in the Cloudflare dashboard:
```json
[
    {
        "AllowedOrigins": ["https://[CHANGE ME TO YOUR WORKER CUSTOM DOMAIN]"],
        "AllowedMethods": ["GET", "PUT"],
        "MaxAgeSeconds": 3000,
        "AllowedHeaders": [
            "Authorization",
            "x-amz-date",
            "x-amz-content-sha256",
            "content-type"
        ],
        "ExposeHeaders": ["ETag", "Location"]
    }
]
```
- Create a R2 token: [here](https://dash.cloudflare.com/?to=/:account/r2/api-tokens) with `Object Read & Write` permissions.

### Method 1 (Local)
1. Clone locally: `git clone https://github.com/kotx/aster.git`
2. Install dependencies: `pnpm i`
3. Tweak `wrangler.toml` to your liking (set `bucket_name`, `PUBLIC_BUCKET_URL`, `R2_BUCKET_NAME`)
4. Run `wrangler secret put [NAME]` for `CF_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`
5. Run `pnpm run deploy`

### Method 2 (GitHub Actions)
1. Fork this repository
2. Set the secrets [`CF_API_TOKEN`](https://dash.cloudflare.com/profile/api-tokens) (with `Worker Scripts: Edit permissions`) and `CF_ACCOUNT_ID` in the repo settings
3. Enable workflows in the Actions tab
4. Update `wrangler.toml` as needed (this will trigger the workflow)
5. In your Cloudflare dashboard, set the required secrets `CF_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` in the [worker settings](https://dash.cloudflare.com/?to=/:account/workers-and-pages).

## Development
Remember to add `"http://127.0.0.1:8787", "http://localhost:8787"` to the allowed origins CORS policy above.

Install deps:
```
pnpm i
```

Start development server:
```sh
pnpm dev
```

# Storage and Media Uploads

## Architecture

- Local development uses MinIO.
- Production can use AWS S3 or Cloudflare R2.
- The backend issues presigned URLs and stores file metadata in `media_assets`.

## Environment Variables

- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_FORCE_PATH_STYLE`
- `S3_PUBLIC_BASE_URL`
- `S3_PRESIGNED_PUT_TTL_SECONDS`
- `S3_PRESIGNED_GET_TTL_SECONDS`

## API Flow

1. Call `POST /media/presign-upload` with:
   - `fileName`
   - `contentType`
   - `fileSizeBytes`
2. Upload the file bytes directly to `uploadUrl`.
3. Call `POST /media/confirm` with:
   - `objectKey`
   - optional `fileName`, `contentType`, `fileSizeBytes`, `etag`
4. Use the returned media id when attaching images to products.

## Endpoints

- `POST /media/presign-upload`
- `POST /media/confirm`
- `GET /media/:mediaAssetId`

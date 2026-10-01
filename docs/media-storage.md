# Property media storage

Admin image uploads become WebP (2560 px maximum side, quality 82); plan uploads
use lossless WebP up to 3200 px. Images are oriented using EXIF before processing.
Animated images must be uploaded as video. Videos become MP4/H.264 with AAC audio,
maximum 1920×1080, CRF 25, and fast-start metadata. Audio and the complete clip are
retained; background video editing is a separate operation.

Files live in `/var/lib/estate/uploads/properties/optimized`, not in PostgreSQL.
Their SHA-256 names deduplicate identical outputs and enable a one-year immutable
browser cache. PostgreSQL stores `/uploads/...` URLs. News upload ownership and
deletion semantics remain separate.

## Existing projects

The importer supports public Google Drive file links. Private files and embedded
YouTube/Vimeo players are not downloaded. Other providers' files can be uploaded
through admin. No Google credentials or browser cookies are used on the server.

After a verified database backup, stage a project without changing its URLs:

```sh
estate-compose run --rm --no-deps -v /var/lib/estate/media-import:/app/media-import api python -m app.import_property_media --slug PROJECT_SLUG
```

Review its report and encoded media, then repeat with `--apply`. Cached encodings
are reused. The database transaction replaces URLs only after all files succeed
and verifies the project has not changed meanwhile. Image-description keys and
plan metadata are rewritten with the URLs. Reports preserve the previous media
fields for recovery. Original source files remain in Drive.

Prepare `/var/lib/estate/media-import` owned by the API image's appuser (UID 1000).
Enable the optional sequential worker after the first import has been reviewed:

```sh
estate-compose --profile media up -d media-worker
```

It scans every five minutes, handles new external links without blocking admin
saves, and preserves existing links if any download or transform fails. Reports
and per-source cache entries persist across releases. Monitor errors with
`estate-compose logs media-worker`. Stop the worker before editing or restoring
media data. Future releases must also update its image explicitly.

FFmpeg is installed in the backend image. Limit encoding to two threads per
process; the upload handler encodes one video at a time and the worker processes
projects sequentially. No source files, backups, or old releases are pruned.

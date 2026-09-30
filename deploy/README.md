# Estate production deployment

This directory is the production Compose and systemd configuration for a single-host deployment.

## Server layout

- Releases: `/opt/estate/releases/<release>`
- Active release: `/opt/estate/current`
- Runtime secrets: `/etc/estate/*.env` (root-owned, mode `0600`)
- PostgreSQL and Caddy data: named Docker volumes
- Uploads: `/var/lib/estate/uploads`
- Backups: `/var/backups/estate`

## Release and rollback

Upload an immutable release directory containing this repository and a `deploy/release.env` file, then run:

```sh
sudo /usr/local/sbin/estate-release deploy /opt/estate/releases/<release>
sudo /usr/local/sbin/estate-status
```

The release command builds the application images, starts PostgreSQL, creates and verifies a pre-migration backup, runs `python -m app.migrate`, then starts the API, web service, and Caddy.

To return application containers and Caddy to an earlier release:

```sh
sudo /usr/local/sbin/estate-release rollback /opt/estate/releases/<previous-release>
sudo /usr/local/sbin/estate-status
```

Rollback does not reverse database migrations. Confirm schema compatibility first; restore a verified backup only through a separate, reviewed recovery procedure.

## Operational checks

```sh
sudo /usr/local/sbin/estate-status
sudo systemctl status estate.service estate-backup.timer estate-monitor.timer
sudo journalctl -u estate.service -n 100 --no-pager
sudo /usr/local/sbin/estate-backup
```

The daily backup timer runs at 02:20 UTC and the monitor runs every five minutes.

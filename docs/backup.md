# Backing up and updating Mura

**English** | [Français](backup.fr.md)

Everything people do in Mura — accounts, projects, tasks, groups, contacts — lives in the PostgreSQL database, kept in the Docker volume `postgres_data`. If the server's disk fails, if someone runs `docker compose down -v` by mistake or if an update goes wrong, without a backup everything is lost. This guide explains how to make backups, how to restore them, and how to update Mura safely.

The commands are run from Mura's folder, the one that holds `docker-compose.yml`.

## What to keep

- **The database**: it is the essential, and the subject of what follows.
- **The `.env` file**: it holds the JWT secret and the passwords of the database and of the mail server. Without it, a database backup stays readable, but everything would have to be set up again. Keep it apart, safe: anyone who reads it can sign in as any account.

HTTPS certificates (the `caddy_data` volume) do not need to be backed up: Caddy asks for new ones if they disappear.

## Making a backup

```bash
mkdir -p backups
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/mura-$(date +%F).dump
```

The resulting file, for example `backups/mura-2026-11-05.dump`, holds the whole database. Mura can keep running during the backup.

## Backing up every day, automatically

On a Linux server, a `cron` job does it. Open the job table with `crontab -e` and add, replacing `/srv/mura` with Mura's folder:

```
30 3 * * * cd /srv/mura && docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/mura-$(date +\%F).dump && find backups -name 'mura-*.dump' -mtime +14 -delete
```

Every night at 3:30, a backup is made, and those older than 14 days are deleted. In a `cron` line, the `%` has to be written `\%`, hence the difference with the previous command.

**A backup stored on the same disk as Mura does not protect against a failure of that disk.** Regularly copy the `backups` folder elsewhere: another server (`rsync`), online storage, an external drive. The usual rule: three copies, on two different media, one of them off-site.

## Restoring a backup

Restoring replaces the whole content of the database with that of the backup. What was done since is lost.

1. **Stop the backend**, so nobody writes during the restore:

   ```bash
   docker compose stop backend
   ```

2. **Restore the chosen file**:

   ```bash
   docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < backups/mura-2026-11-05.dump
   ```

3. **Start the backend again**:

   ```bash
   docker compose start backend
   ```

On a new server, after a complete loss: install Mura as the first time with the same `.env`, run `docker compose up -d`, then follow the three steps above.

A backup you have never tried to restore is only a hope. From time to time, restore the latest one on a test machine to check that it is complete.

## Updating Mura

Database updates happen by themselves: at startup, the backend applies the migrations that are missing. They only go one way, hence the backup before each update.

1. **Make a backup**, as above.
2. **Read the notes of the new version** on the releases page of the GitHub repository: they point out the settings to add to `.env`. Also compare your `.env` with `.env.example`, which lists every variable.
3. **Get the new version**:

   ```bash
   git fetch --tags
   git checkout v1.1.0
   ```

   replacing `v1.1.0` with the version you want.
4. **Rebuild and restart**:

   ```bash
   docker compose up -d --build
   ```

5. **Check the backend's logs**:

   ```bash
   docker compose logs backend
   ```

   You should see `Successfully applied … migration` (or `Schema "public" is up to date`), then `Started MuraApplication`.

### Going back

If the new version causes trouble, going back to the old code is not enough: the database has already been migrated. You have to go back on both:

```bash
git checkout v1.0.0
docker compose stop backend
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < backups/mura-2026-11-05.dump
docker compose up -d --build
```

with the version and the backup from before the update.

### Changing the PostgreSQL version

The `postgres:15-alpine` image is pinned in `docker-compose.yml`. Do not change that number on an existing database: a major version of PostgreSQL cannot read the files of another. To change version, you have to back up, delete the volume, start the new version on an empty database, then restore.

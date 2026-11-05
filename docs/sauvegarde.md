# Sauvegarder et mettre à jour Mura

Tout ce que les gens font dans Mura — comptes, projets, tâches, groupes, carnet — vit dans la base PostgreSQL, rangée dans le volume Docker `postgres_data`. Si le disque du serveur lâche, si quelqu'un lance `docker compose down -v` par erreur ou si une mise à jour tourne mal, sans sauvegarde, tout est perdu. Ce guide explique comment en faire, comment les restaurer, et comment mettre Mura à jour sans risque.

Les commandes se lancent depuis le dossier de Mura, celui qui contient `docker-compose.yml`.

## Ce qu'il faut garder

- **La base de données** : c'est l'essentiel, et c'est l'objet de la suite.
- **Le fichier `.env`** : il contient le secret JWT, les mots de passe de la base et du serveur d'e-mails. Sans lui, une sauvegarde de la base reste lisible, mais il faudrait tout reconfigurer. Garde-le à part, à l'abri : quiconque le lit peut se connecter sous n'importe quel compte.

Les certificats HTTPS (volume `caddy_data`) n'ont pas besoin d'être sauvegardés : Caddy en redemande s'ils disparaissent.

## Faire une sauvegarde

```bash
mkdir -p sauvegardes
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > sauvegardes/mura-$(date +%F).dump
```

Le fichier obtenu, par exemple `sauvegardes/mura-2026-11-05.dump`, contient toute la base. Mura peut continuer de tourner pendant la sauvegarde.

## Sauvegarder tous les jours, automatiquement

Sur un serveur Linux, une tâche `cron` s'en charge. Ouvre la table des tâches avec `crontab -e` et ajoute, en remplaçant `/srv/mura` par le dossier de Mura :

```
30 3 * * * cd /srv/mura && docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > sauvegardes/mura-$(date +\%F).dump && find sauvegardes -name 'mura-*.dump' -mtime +14 -delete
```

Chaque nuit à 3 h 30, une sauvegarde est faite, et celles de plus de 14 jours sont effacées. Dans une ligne `cron`, le `%` doit s'écrire `\%`, d'où la différence avec la commande précédente.

**Une sauvegarde rangée sur le même disque que Mura ne protège pas d'une panne de ce disque.** Copie régulièrement le dossier `sauvegardes` ailleurs : un autre serveur (`rsync`), un stockage en ligne, un disque externe. La règle habituelle : trois copies, sur deux supports différents, dont une hors du lieu.

## Restaurer une sauvegarde

La restauration remplace tout le contenu de la base par celui de la sauvegarde. Ce qui a été fait depuis est perdu.

1. **Arrête le backend**, pour que personne n'écrive pendant la restauration :

   ```bash
   docker compose stop backend
   ```

2. **Restaure le fichier choisi** :

   ```bash
   docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < sauvegardes/mura-2026-11-05.dump
   ```

3. **Relance le backend** :

   ```bash
   docker compose start backend
   ```

Sur un serveur neuf, après une perte complète : installe Mura comme la première fois avec le même `.env`, lance `docker compose up -d`, puis suis les trois étapes ci-dessus.

Une sauvegarde qu'on n'a jamais essayé de restaurer n'est qu'un espoir. De temps en temps, restaure la dernière sur une machine de test pour vérifier qu'elle est complète.

## Mettre Mura à jour

Les mises à jour de la base se font toutes seules : au démarrage, le backend applique les migrations qui manquent. Elles ne vont que dans un sens, d'où la sauvegarde avant chaque mise à jour.

1. **Fais une sauvegarde**, comme plus haut.
2. **Lis les notes de la nouvelle version** sur la page des releases du dépôt GitHub : elles signalent les réglages à ajouter dans `.env`. Compare aussi ton `.env` avec `.env.example`, qui liste toutes les variables.
3. **Récupère la nouvelle version** :

   ```bash
   git fetch --tags
   git checkout v1.1.0
   ```

   en remplaçant `v1.1.0` par la version voulue.
4. **Reconstruis et relance** :

   ```bash
   docker compose up -d --build
   ```

5. **Vérifie les logs** du backend :

   ```bash
   docker compose logs backend
   ```

   On doit y voir `Successfully applied … migration` (ou `Schema "public" is up to date`), puis `Started MuraApplication`.

### Revenir en arrière

Si la nouvelle version pose problème, revenir à l'ancien code ne suffit pas : la base a déjà été migrée. Il faut revenir aux deux :

```bash
git checkout v1.0.0
docker compose stop backend
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < sauvegardes/mura-2026-11-05.dump
docker compose up -d --build
```

avec la version et la sauvegarde d'avant la mise à jour.

### Changer de version de PostgreSQL

L'image `postgres:15-alpine` est fixée dans `docker-compose.yml`. Ne change pas ce numéro sur une base existante : une version majeure de PostgreSQL ne sait pas lire les fichiers d'une autre. Pour changer de version, il faut sauvegarder, supprimer le volume, démarrer la nouvelle version sur une base vide, puis restaurer.

# Mettre Mura en HTTPS

Sans HTTPS, tout ce qui passe entre le navigateur et Mura circule en clair : les mots de passe à la connexion, le jeton qui garde la session ouverte, et le contenu des projets. N'importe qui sur le même réseau Wi-Fi, ou entre le serveur et la personne, peut les lire. Dès qu'une instance est ouverte à d'autres personnes que toi, sur ta propre machine, elle doit être en HTTPS.

Mura fournit de quoi le faire en une commande : [Caddy](https://caddyserver.com), placé devant l'application, obtient un certificat gratuit auprès de Let's Encrypt, le renouvelle tout seul et redirige le HTTP vers le HTTPS.

## Ce qu'il te faut

- **Un serveur** joignable depuis Internet, avec Docker et Docker Compose (version 2.24 ou plus récente).
- **Un nom de domaine**, par exemple `mura.example.org`, dont l'enregistrement DNS `A` (et `AAAA` si le serveur a une adresse IPv6) pointe vers l'adresse IP du serveur. Ça se règle chez le registraire du domaine ; la propagation peut prendre de quelques minutes à quelques heures.
- **Les ports 80 et 443 ouverts** sur le pare-feu du serveur et, s'il y en a une, de la box ou de l'hébergeur. Let's Encrypt passe par le port 80 pour vérifier que le domaine est bien à toi.
- **Aucun autre service** qui occupe déjà les ports 80 ou 443 sur le serveur (un Apache ou un nginx installé par défaut, par exemple). Si c'est le cas, voir [Si tu as déjà un reverse proxy](#si-tu-as-déjà-un-reverse-proxy).

## Mise en place

1. **Dans `.env`, donne l'adresse de l'instance**, en `https://`, sans rien après le domaine :

   ```
   MURA_URL=https://mura.example.org
   ```

   C'est la même variable que celle des liens dans les e-mails : elle sert aux deux.

2. **Toujours dans `.env`, ajoute le fichier HTTPS** à ceux que Docker Compose lit :

   ```
   COMPOSE_FILE=docker-compose.yml:docker-compose.https.yml
   ```

   Sur un serveur Windows, le séparateur est `;` au lieu de `:`.

3. **Lance ou relance Mura** :

   ```bash
   docker compose up -d --build
   ```

4. **Regarde Caddy obtenir le certificat** :

   ```bash
   docker compose logs -f caddy
   ```

   Au bout de quelques secondes, la ligne `certificate obtained successfully` apparaît. `Ctrl+C` pour quitter les logs ; Caddy continue de tourner.

5. **Ouvre `https://mura.example.org`** : le cadenas s'affiche, et `http://mura.example.org` redirige vers la version HTTPS.

Une fois Caddy en place, le frontend n'est plus publié sur `FRONTEND_PORT` : tout passe par les ports 80 et 443.

## Ce que fait la configuration

- [`docker-compose.https.yml`](../docker-compose.https.yml) ajoute le service `caddy` sur les ports 80 et 443, et retire le port du frontend. Les certificats sont gardés dans le volume `caddy_data` : ils survivent aux redémarrages, et Caddy les renouvelle avant leur expiration.
- [`caddy/Caddyfile`](../caddy/Caddyfile) dit à Caddy de servir le domaine de `MURA_URL`, de compresser les réponses, d'envoyer l'en-tête HSTS (le navigateur retient qu'il ne doit plus jamais venir en HTTP pendant un an) et de tout transmettre au frontend, qui transmet à son tour `/api` au backend.
- L'adresse réelle des personnes est transmise jusqu'au backend, qui s'en sert pour limiter les tentatives de connexion et les demandes de mot de passe oublié. Caddy ignore celle qu'un client prétendrait avoir.

## Vérifier que tout va bien

- **Le certificat** : clique sur le cadenas du navigateur ; l'émetteur doit être Let's Encrypt.
- **Les e-mails** : demande un lien « Mot de passe oublié » ; il doit commencer par `https://mura.example.org/`.
- **La note du site** : [SSL Labs](https://www.ssllabs.com/ssltest/) teste la configuration HTTPS d'un domaine public. Caddy obtient un A sans réglage.

## En cas de problème

**`certificate obtained successfully` n'apparaît jamais, ou les logs parlent d'`ACME` et de `challenge failed`.**
Let's Encrypt n'arrive pas à joindre ton serveur. Vérifie, dans cet ordre :
- que le domaine pointe bien vers le serveur : `nslookup mura.example.org` doit donner son adresse IP ;
- que les ports 80 et 443 sont ouverts de l'extérieur (pare-feu du serveur, de l'hébergeur, redirection de ports de la box) ;
- qu'aucun autre service n'occupe ces ports : `docker compose logs caddy` dit alors `address already in use`.

Après trop d'échecs, Let's Encrypt fait patienter une heure ; Caddy réessaie tout seul.

**`required variable MURA_URL is missing a value` au lancement.**
`MURA_URL` est vide dans `.env`. Le fichier HTTPS en a besoin pour savoir quel domaine servir.

**Le navigateur affiche « Trop de redirections ».**
Un autre proxy devant Caddy (Cloudflare en mode « Flexible », par exemple) parle en HTTP à Caddy, qui redirige vers HTTPS, et ainsi de suite. Passe ce proxy en mode « Full (strict) », ou retire-le.

**Les liens des e-mails pointent encore vers `localhost`.**
Le backend n'a pas été relancé après le changement de `MURA_URL` : `docker compose up -d` le recrée avec la nouvelle valeur.

## Si tu as déjà un reverse proxy

Si le serveur fait déjà tourner nginx, Traefik ou Apache pour d'autres sites, n'utilise pas `docker-compose.https.yml` : laisse ton proxy gérer le certificat et fais-le transmettre à Mura.

- Garde `MURA_URL=https://mura.example.org` dans `.env`, sans la ligne `COMPOSE_FILE`.
- Fais pointer ton proxy vers `http://127.0.0.1:5173` (ou le port choisi dans `FRONTEND_PORT`).
- Transmets l'adresse réelle des personnes dans l'en-tête `X-Forwarded-For`, sans quoi les limites de connexion compteraient tout le monde comme une seule personne.
- Ferme le port `FRONTEND_PORT` au reste d'Internet avec le pare-feu du serveur : seul ton proxy doit pouvoir l'atteindre.

Par exemple, avec nginx et un certificat obtenu par Certbot :

```nginx
server {
    listen 443 ssl;
    server_name mura.example.org;

    ssl_certificate     /etc/letsencrypt/live/mura.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mura.example.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

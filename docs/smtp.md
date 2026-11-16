# Getting an SMTP service for Mura

**English** | [Français](smtp.fr.md)

Mura sends e-mails: the code that confirms every sign-up, the link for a forgotten password, invitations and notifications. Without a mail-sending server nobody can create an account, you included. This guide explains what an SMTP service is, how to get one and what to put in `.env`.

## In a nutshell

**SMTP** is the protocol for sending e-mail. Mura cannot deliver a message to someone's mailbox by itself: it hands it to an SMTP server, your provider's, which takes care of the delivery. That server asks you to sign in with a username and a password, and only accepts sender addresses that belong to you.

So you need **an account with a provider that offers SMTP sending**. There are three ways to get one.

| Option | Who it suits | Good to know |
|---|---|---|
| **A sending service** (Brevo, Mailjet, Resend…) | An instance other people use | Free up to a certain volume. Delivering mail is their job: messages reach the inbox. Needs a domain. |
| **The mailbox of your own domain** (at OVH, Infomaniak, Gandi…) | You already have a domain with mail addresses | Nothing more to open: you reuse an existing address. |
| **Gmail** | A trial, or a small group of people you know | The quickest, but limited to about 500 mails a day, and the sender stays your Gmail address. |

In all three cases you end up with the same five pieces of information: a **server**, a **port**, a **username**, a **password** and a **sender address**.

## What to put in `.env`

| Variable | Value |
|---|---|
| `MAIL_HOST` | The provider's SMTP server, for example `smtp.gmail.com` |
| `MAIL_PORT` | `587` most of the time, or `465` |
| `MAIL_STARTTLS` | `true` with port 587, `false` with 465 |
| `MAIL_SSL` | `true` with port 465, `false` with 587 |
| `MAIL_USERNAME` | The SMTP username, often the full e-mail address |
| `MAIL_PASSWORD` | The SMTP password, see below: it is not always the account's |
| `MURA_MAIL_FROM` | The sender people see, for example `Mura <mura@example.org>` |

The `scripts/configurer_env.py` script asks for these and picks `STARTTLS` or `SSL` from the port. You can also fill `.env` in by hand.

`.env` holds your SMTP password: it is never sent to GitHub (`.gitignore` leaves it out), so do not share it.

## Option 1: a sending service (Brevo)

Brevo (formerly Sendinblue) has a free plan limited to a few hundred mails a day, plenty for a team. The other services (Mailjet, Resend, Scaleway…) work the same way: only the names change. Check their current limits on their website.

1. **Create an account** on brevo.com.
2. **Declare your sender.** In the senders and domains settings, add your domain name and validate it by adding the DNS records Brevo shows you at your registrar. Without it, mails go out but end up as spam, see [Getting mails delivered](#getting-mails-delivered).
3. **Generate an SMTP key.** Under *SMTP & API*, *SMTP* tab, create a key. Brevo then shows everything you need.
4. **Copy it into `.env`:**

   ```
   MAIL_HOST=smtp-relay.brevo.com
   MAIL_PORT=587
   MAIL_STARTTLS=true
   MAIL_SSL=false
   MAIL_USERNAME=<the SMTP login Brevo shows>
   MAIL_PASSWORD=<the SMTP key>
   MURA_MAIL_FROM=Mura <mura@your-domain.com>
   ```

   Brevo's SMTP login is not necessarily your e-mail address: copy the one shown on the page. The password is the SMTP key you generated, not your Brevo account password.

## Option 2: the mailbox of your domain

If your domain is with a host that provides mailboxes, you can send from one of them.

1. **Create a dedicated address**, for example `mura@your-domain.com`, in the host's customer area. A separate address keeps your own mail and Mura's apart.
2. **Look in the host's help** for the "SMTP settings" or "configure a mail client" page: it gives the server and the port.
3. **Copy them into `.env`.** The username is almost always the full address, and the password that of this mailbox. `MURA_MAIL_FROM` reuses the same address:

   ```
   MAIL_HOST=<the host's SMTP server>
   MAIL_PORT=465
   MAIL_STARTTLS=false
   MAIL_SSL=true
   MAIL_USERNAME=mura@your-domain.com
   MAIL_PASSWORD=<the mailbox password>
   MURA_MAIL_FROM=Mura <mura@your-domain.com>
   ```

   Use `587` with `MAIL_STARTTLS=true` if the host offers it rather than 465.

## Option 3: Gmail, for a trial

Gmail does not accept your usual password for sending from a program. You need an **app password**, and to create one, 2-step verification must be turned on for the account.

1. **Turn on 2-step verification** on your Google account (myaccount.google.com, *Security*).
2. **Create an app password** at myaccount.google.com/apppasswords. Give it a name, for example "Mura". Google shows a 16-letter code, **once**. A Google Workspace account may have this option turned off by its administrator.
3. **Copy it into `.env`**, without the spaces of the code:

   ```
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_STARTTLS=true
   MAIL_SSL=false
   MAIL_USERNAME=your.address@gmail.com
   MAIL_PASSWORD=<the app password>
   MURA_MAIL_FROM=Mura <your.address@gmail.com>
   ```

Two precautions:

- **Use a Gmail address created for Mura**, not your personal one: invitations and notifications are sent from it.
- **Never share the app password**, not in a message, a ticket or on GitHub. If it leaks, delete it on the app passwords page: it stops working at once, and you create another.

## Getting mails delivered

A provider that accepts your mails does not guarantee they reach the inbox. With a domain of your own (options 1 and 2), three DNS records prove to recipients that the sender is legitimate:

- **SPF**: the list of servers allowed to send for your domain;
- **DKIM**: a signature added to every mail;
- **DMARC**: what the recipient should do with a mail that fails the first two checks.

The provider gives you the exact values to add at your registrar; copying them is enough. To check the result, send yourself a mail from Mura and look at its score on mail-tester.com.

With Gmail there is nothing to set up: Google signs its own mails.

## Checking that Mura can send

Once `.env` is filled in, restart:

```
docker compose up -d
docker compose logs backend
```

The log should say `Mail server … answered; Mura can send its mails.` If not, the `Mura cannot reach the mail server` line names the server and the reason:

| Reason | What to try |
|---|---|
| `Authentication failed` or `535` | Wrong username or password. With Gmail and Brevo the password is not the account's, it is the app password or the SMTP key. |
| `Connection timed out` | Wrong server, or a blocked port. Try the other port (587 or 465), and check that your host or router does not block outgoing connections. |
| `SSL` / `handshake` / `StartTLS` | The combination is wrong: 587 goes with `MAIL_STARTTLS=true`, 465 with `MAIL_SSL=true`, never both. |
| `Sender address rejected` (does not appear at startup but at the first send, in the same log) | The sender in `MURA_MAIL_FROM` is not an address of the account, or of the domain validated with the provider. |

The final test: create an account with the address in `MURA_ADMIN_EMAIL`. The code should arrive within a minute. If it is not in the inbox, look in the junk folder, then at the previous section.

## For a trial on your own machine

To develop or try Mura without a provider, Mailpit catches the mails instead of sending them and shows them at http://localhost:8025. It is set with `SPRING_PROFILES_ACTIVE=dev` and `COMPOSE_PROFILES=dev`, leaving the `MAIL_` settings empty, as [setup.md](setup.md) explains. It does not suit an instance other people use, since nothing ever reaches a real mailbox.

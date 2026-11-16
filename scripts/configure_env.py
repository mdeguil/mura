#!/usr/bin/env python3
"""Creates Mura's .env file by asking a few questions, in English.

It starts from .env.example, fills in what you answer, generates the secrets
itself and writes .env at the root of the repository. It needs Python 3 and
nothing else. The same script in French is scripts/configurer_env.py.

Usage:
    python3 scripts/configure_env.py                      writes .env at the root
    python3 scripts/configure_env.py --output test.env    writes another file
    py scripts/configure_env.py                           on Windows
"""

import sys

from env_wizard import run

TEXTS = {
    "description": "Creates Mura's .env file by asking a few questions.",
    "option": "--output",
    "option_help": "file to write (default: .env at the root of the repository)",
    "no_color_help": "do not use colours",
    "banner": "Mura · create your .env file",
    "intro": (
        "This assistant asks a few questions and writes the .env file Mura needs to start. "
        "For each one it says why the answer is needed. Press Enter to keep the value shown "
        "in brackets. Nothing is sent anywhere: the answers only go into the file."
    ),
    "step": "Step {n} of {total}",
    "why": "Why:",
    "step_instance": "Your instance",
    "step_mail": "Mail",
    "step_secrets": "Secrets (automatic)",
    "step_review": "Check and write",
    "required": "This answer is required.",
    "bad_url": "The address must start with http:// or https://, for example https://mura.example.org.",
    "bad_email": "That does not look like an e-mail address.",
    "bad_port": "The port must be a number from 1 to 65535.",
    "bad_choice": "Type a number from 1 to {count}.",
    "unstorable": "This value cannot be stored in .env as typed (it mixes an apostrophe with $ or a backslash). Pick another one.",
    "q_url": "Where will people reach Mura?",
    "why_url": (
        "This is the address people type in their browser. It goes into the links of the e-mails "
        "Mura sends (confirming an address, resetting a password, invitations), and it is the only "
        "address the API accepts requests from. For a trial on this machine, keep the suggestion. "
        "For an instance other people use, give your own https:// domain: docs/en/https.md explains how."
    ),
    "q_admin": "What is your e-mail address?",
    "why_admin": (
        "A new instance has no account at all. The account you create with this address becomes the "
        "administrator as soon as you enter the code Mura mails to it, so use an address you can read. "
        "Only this first account gets that role, and only while the instance has no administrator."
    ),
    "mail_intro": (
        "Mura sends e-mails: the code that confirms every sign-up, the link for a forgotten password, "
        "invitations and notifications. Without a mail server nobody can create an account, you included. "
        "Mura does not deliver mail itself: it hands it to an SMTP server, the one of your mail provider. "
        "You need an account with one. If you have none yet, docs/en/smtp.md explains how to get one in a "
        "few minutes."
    ),
    "provider_question": "Which kind of provider do you use?",
    "provider_gmail": "Gmail   the quickest, for a trial or a few people",
    "provider_brevo": "Brevo   a sending service with a free plan, for a real instance",
    "provider_other": "Other   the mailbox of your own domain, another service",
    "hint_gmail": (
        "Gmail does not accept your usual password for a program: you need an app password. Turn on "
        "2-step verification on the Google account, then create one at "
        "https://myaccount.google.com/apppasswords (16 letters, shown once). Use an address created "
        "for Mura rather than your personal one."
    ),
    "hint_brevo": (
        "In Brevo, open SMTP & API and create an SMTP key. The login shown there is not always your "
        "e-mail address, and the password is the key, not your account password. Validate your sender "
        "domain in Brevo too, or the mails end up as spam."
    ),
    "hint_other": (
        "Look for \"SMTP settings\" or \"configure a mail client\" in your host's help: it gives the "
        "server and the port. The username is almost always the full address of the mailbox."
    ),
    "q_host": "SMTP server",
    "why_host": "The address of your provider's mail server. Mura connects to it to deliver every message.",
    "q_port": "SMTP port",
    "why_port": (
        "587 (most providers) starts in the clear then switches to an encrypted connection (STARTTLS); "
        "465 is encrypted from the first byte (SSL). Both are secure, but Mura has to know which one: "
        "this assistant sets MAIL_STARTTLS and MAIL_SSL for you from the port."
    ),
    "q_username": "SMTP username",
    "why_username": (
        "How the server recognises you. Often your full e-mail address; with some services, Brevo for "
        "example, it is a separate login shown in their settings."
    ),
    "q_password": "SMTP password (hidden as you type)",
    "why_password": (
        "It proves to the server that you may send. It is typed hidden, stored only in your .env and "
        "never printed. With Gmail and Brevo it is not your account password but an app password or an "
        "SMTP key: one you can revoke at any time without changing your account's password."
    ),
    "q_sender": "Sender shown on the mails",
    "why_sender": (
        "What the people who receive a mail see as its sender, for example Mura <mura@example.org>. "
        "Providers only accept an address of your account or of a domain you validated with them: "
        "any other one is refused or sends the message to the spam folder."
    ),
    "test_ask": "Test the connection to the mail server now?",
    "testing": "Connecting to {host}:{port} and signing in (no mail is sent)…",
    "test_ok": "The mail server accepted the connection and your login. Mura will be able to send its mails.",
    "test_failed": "Could not use the mail server: {reason}.",
    "server_said": "The server said: {detail}",
    "reason_auth": "the login was refused",
    "reason_tls": "the secure connection failed",
    "reason_timeout": "the server did not answer in time",
    "reason_dns": "the server's name is not known",
    "reason_connect": "the connection was refused or cut",
    "reason_other": "the server answered with an error",
    "fix_auth": (
        "Check the username and the password. With Gmail and Brevo, the password is the app password "
        "or the SMTP key, not the one of the account."
    ),
    "fix_tls": "Port 587 goes with STARTTLS and 465 with SSL. Try the other port, and check the server's name.",
    "fix_timeout": (
        "The port may be blocked. Many networks block outgoing mail: try the other port (587 or 465) "
        "or another network."
    ),
    "fix_dns": "Check the spelling of the server, for example smtp.gmail.com.",
    "fix_connect": "Check the server and the port, and that your network lets outgoing connections through.",
    "fix_other": "Read the line above: it usually says what is wrong.",
    "retry_ask": "Enter the mail settings again?",
    "secrets_intro": (
        "Two secrets are generated now, random and never displayed. JWT_SECRET signs every sign-in: "
        "whoever knows it could sign in as anyone, which is why Mura refuses to start without a long "
        "one. The database password protects everything people put in Mura. Both live only in .env: "
        "keep that file private, and keep a copy of it with your backups (docs/en/backup.md)."
    ),
    "row_url": "Address",
    "row_admin": "Administrator",
    "row_server": "Mail server",
    "row_username": "Mail username",
    "row_password": "Mail password",
    "row_sender": "Sender",
    "row_secrets": "Secrets",
    "row_secrets_value": "generated, not shown",
    "row_file": "File",
    "confirm_write": "Write this file?",
    "nothing_written": "Nothing was written.",
    "written": "The file is written.",
    "next_title": "What now?",
    "next_start": "Start Mura from the root of the repository:",
    "next_logs": "Check the backend's log. It should say that the mail server answered:",
    "next_register": "Open {url}, choose \"Create an account\" and register with {email}. Enter the code you receive: you are the administrator.",
    "next_more": (
        "For an instance other people use, also set up HTTPS (docs/en/https.md) and backups "
        "(docs/en/backup.md), and fill in the VITE_LEGAL_* settings of .env, which the legal pages need."
    ),
    "exists": "{path} already exists.",
    "overwrite_ask": "Replace it? The database password will change, which breaks a database already created.",
    "nothing_changed": "Nothing was changed.",
    "cancelled": "Cancelled. No file was written.",
    "yes_letters": ("y", "yes"),
    "no_letters": ("n", "no"),
}

if __name__ == "__main__":
    sys.exit(run(TEXTS))

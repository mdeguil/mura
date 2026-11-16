"""The engine behind the guided creation of Mura's .env file.

It is shared by the two scripts that people actually run, which hold only the
texts of their language:

    python3 scripts/configure_env.py     in English
    python3 scripts/configurer_env.py    en français

The wizard starts from .env.example, asks for what only the person running it
can know (the instance's address, the first administrator, the mail server),
explains why each answer is needed, generates the secrets itself and writes
.env at the root of the repository. It uses nothing but the standard library
of Python 3.
"""

import argparse
import base64
import getpass
import os
import re
import secrets
import shutil
import smtplib
import socket
import ssl
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLE = ROOT / ".env.example"
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
BARE_VALUE = re.compile(r"^[A-Za-z0-9_@.+:/=,<> -]*$")
TOTAL_STEPS = 4

PROVIDERS = {
    "gmail": ("smtp.gmail.com", "587"),
    "brevo": ("smtp-relay.brevo.com", "587"),
    "other": ("", "587"),
}
PROVIDER_ORDER = ("gmail", "brevo", "other")


class Style:
    """Paints text with ANSI colours, or leaves it plain when colour is off."""

    CODES = {"bold": "1", "dim": "2", "red": "31", "green": "32", "yellow": "33", "cyan": "36"}

    def __init__(self, enabled):
        self.enabled = enabled

    def __call__(self, kind, text):
        if not self.enabled:
            return text
        return f"\033[{self.CODES[kind]}m{text}\033[0m"


def prepare_terminal():
    """Makes the output safe for any terminal, including a piped one.

    Characters a console cannot show are replaced instead of raising.
    """
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (OSError, ValueError):
                continue


def colour_enabled(refused):
    """Tells whether to use colours: only on a real terminal, unless refused.

    @param refused true when --no-color was given
    """
    if refused or os.environ.get("NO_COLOR") or os.environ.get("TERM") == "dumb":
        return False
    if not sys.stdout.isatty():
        return False
    if os.name == "nt":
        os.system("")
    return True


def env_value(value):
    """Writes a value the way Docker Compose reads it back unchanged.

    A plain value is written as it is. One holding a character that Compose
    would interpret ('$', '#', quotes, a backslash, spaces at the ends) is
    quoted. A value that cannot be quoted safely raises ValueError.

    @param value the text to store
    """
    if value == value.strip() and BARE_VALUE.match(value):
        return value
    if "'" not in value:
        return f"'{value}'"
    if not any(character in value for character in "$\\\n"):
        return '"' + value.replace('"', '\\"') + '"'
    raise ValueError(value)


def storable(text):
    """Returns the key of the error to show when a text cannot go in .env."""
    try:
        env_value(text)
    except ValueError:
        return "unstorable"
    return None


def valid_url(value):
    """Accepts an http:// or https:// address, nothing else."""
    return None if re.match(r"^https?://[^\s/]+", value) else "bad_url"


def valid_email(value):
    """Accepts something that looks like an e-mail address."""
    return None if EMAIL_PATTERN.match(value) else "bad_email"


def valid_port(value):
    """Accepts a number from 1 to 65535."""
    return None if value.isdigit() and 1 <= int(value) <= 65535 else "bad_port"


def generate_jwt_secret():
    """Returns 64 random characters, the length the backend asks for and more."""
    return base64.b64encode(os.urandom(48)).decode("ascii")


def generate_database_password():
    """Returns a random password made of characters safe in a connection URL."""
    return secrets.token_urlsafe(24)


def probe_smtp(host, port, username, password, use_ssl, timeout=10):
    """Connects to the mail server and signs in, without sending anything.

    @return a pair (kind, detail): kind is None when it worked, otherwise
            "auth", "tls", "timeout", "dns", "connect" or "other"
    """
    context = ssl.create_default_context()
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, int(port), timeout=timeout, context=context)
        else:
            server = smtplib.SMTP(host, int(port), timeout=timeout)
        with server:
            server.ehlo()
            if not use_ssl:
                server.starttls(context=context)
                server.ehlo()
            server.login(username, password)
    except smtplib.SMTPAuthenticationError as error:
        return "auth", detail_of(error)
    except (smtplib.SMTPNotSupportedError, smtplib.SMTPServerDisconnected, ssl.SSLError) as error:
        return "tls", detail_of(error)
    except TimeoutError as error:
        return "timeout", detail_of(error)
    except socket.gaierror as error:
        return "dns", detail_of(error)
    except OSError as error:
        return ("connect" if not isinstance(error, smtplib.SMTPException) else "other"), detail_of(error)
    return None, ""


def detail_of(error):
    """Shortens what the server or the network said to one readable line."""
    raw = getattr(error, "smtp_error", None) or str(error)
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8", errors="replace")
    return " ".join(str(raw).split())[:200]


class Wizard:
    """Talks with the person: shows, asks, explains and checks."""

    def __init__(self, texts, style):
        self.texts = texts
        self.style = style
        columns = shutil.get_terminal_size((90, 24)).columns
        self.width = max(60, min(columns, 96))

    def t(self, key, **values):
        """Returns a text of the language, with its {placeholders} filled."""
        return self.texts[key].format(**values)

    def lines(self, text, indent="  ", kind=None, gutter=""):
        """Prints a paragraph wrapped to the terminal, each line indented."""
        prefix = indent + gutter
        for line in textwrap.wrap(text, width=self.width - len(prefix), break_on_hyphens=False) or [""]:
            print(prefix + (self.style(kind, line) if kind else line))

    def blank(self):
        print()

    def banner(self):
        """Shows the title box and what the script is about to do."""
        title = f" {self.t('banner')} "
        inner = max(len(title) + 4, 44)
        print()
        print(self.style("cyan", "  ╭" + "─" * inner + "╮"))
        print(self.style("cyan", "  │") + self.style("bold", title.center(inner)) + self.style("cyan", "│"))
        print(self.style("cyan", "  ╰" + "─" * inner + "╯"))
        print()
        self.lines(self.t("intro"))

    def step(self, number, title):
        """Opens a numbered section."""
        label = f" {self.t('step', n=number, total=TOTAL_STEPS)} · {title} "
        rule = "━" * max(4, self.width - len(label) - 6)
        print()
        print(self.style("cyan", "  ━━" + label + rule))
        print()

    def why(self, text):
        """Shows the reason behind a question, dimmed, under a left bar."""
        self.lines(f"{self.t('why')} {text}", indent="    ", kind="dim", gutter="┊ ")

    def good(self, text):
        self.lines(self.style("green", "✔ ") + text)

    def warn(self, text):
        self.lines(self.style("yellow", "! ") + text)

    def bad(self, text):
        self.lines(self.style("red", "✖ ") + text)

    def confirm(self, question, default=True):
        """Asks a yes or no question, answered by the first letter."""
        yes, no = self.texts["yes_letters"], self.texts["no_letters"]
        hint = f"{yes[0].upper()}/{no[0]}" if default else f"{yes[0]}/{no[0].upper()}"
        while True:
            answer = input(f"  {self.style('bold', question)} {self.style('dim', '[' + hint + ']')} › ").strip().lower()
            if not answer:
                return default
            if answer in yes:
                return True
            if answer in no:
                return False

    def ask(self, question, why=None, default=None, required=True, check=None, secret=False):
        """Asks until the answer is acceptable.

        @param question the question
        @param why what the answer is used for, shown under the question
        @param default the answer taken when only Enter is pressed
        @param required whether an empty answer is refused
        @param check a function returning the key of an error text, or None
        @param secret hides what is typed
        """
        print(f"  {self.style('bold', question)}")
        if why:
            self.why(why)
        suffix = self.style("dim", f" [{default}]") if default else ""
        while True:
            prompt = f"  › {suffix}{' ' if suffix else ''}"
            answer = (getpass.getpass(prompt) if secret else input(prompt)).strip()
            if not answer and default is not None:
                answer = default
            if not answer:
                if required:
                    self.bad(self.t("required"))
                    continue
                return ""
            error = check(answer) if check else None
            if error is None:
                print()
                return answer
            self.bad(self.t(error))

    def choose_provider(self):
        """Offers the usual mail providers and returns the key of the one picked."""
        print(f"  {self.style('bold', self.t('provider_question'))}")
        for number, key in enumerate(PROVIDER_ORDER, start=1):
            print(f"    {self.style('cyan', str(number))}  {self.t('provider_' + key)}")
        print()
        while True:
            answer = input("  › ").strip()
            if answer.isdigit() and 1 <= int(answer) <= len(PROVIDER_ORDER):
                print()
                return PROVIDER_ORDER[int(answer) - 1]
            self.bad(self.t("bad_choice", count=len(PROVIDER_ORDER)))

    def ask_mail(self):
        """Walks through the mail settings and returns them as a dictionary."""
        provider = self.choose_provider()
        host_default, port_default = PROVIDERS[provider]
        self.lines(self.t("hint_" + provider), kind="dim", indent="    ")
        print()
        host = self.ask(self.t("q_host"), self.t("why_host"), default=host_default or None, check=storable)
        port = self.ask(self.t("q_port"), self.t("why_port"), default=port_default, check=valid_port)
        username = self.ask(self.t("q_username"), self.t("why_username"), check=storable)
        password = self.ask(self.t("q_password"), self.t("why_password"), check=storable, secret=True)
        sender_default = f"Mura <{username}>" if EMAIL_PATTERN.match(username) else None
        sender = self.ask(self.t("q_sender"), self.t("why_sender"), default=sender_default, check=storable)
        use_ssl = port == "465"
        return {
            "MAIL_HOST": host,
            "MAIL_PORT": port,
            "MAIL_USERNAME": username,
            "MAIL_PASSWORD": password,
            "MAIL_STARTTLS": "false" if use_ssl else "true",
            "MAIL_SSL": "true" if use_ssl else "false",
            "MURA_MAIL_FROM": sender,
        }

    def test_mail(self, mail):
        """Tries the mail settings and says what happened. Returns true if they work."""
        print(f"  {self.t('testing', host=mail['MAIL_HOST'], port=mail['MAIL_PORT'])}")
        kind, detail = probe_smtp(
            mail["MAIL_HOST"], mail["MAIL_PORT"], mail["MAIL_USERNAME"], mail["MAIL_PASSWORD"],
            mail["MAIL_SSL"] == "true",
        )
        print()
        if kind is None:
            self.good(self.t("test_ok"))
            return True
        self.bad(self.t("test_failed", reason=self.t("reason_" + kind)))
        if detail:
            self.lines(self.t("server_said", detail=detail), indent="    ", kind="dim")
        self.lines(self.t("fix_" + kind), indent="    ")
        print()
        return False

    def settle_mail(self):
        """Asks for the mail settings and, if the person wants, tries them."""
        while True:
            mail = self.ask_mail()
            if not self.confirm(self.t("test_ask")):
                return mail
            print()
            if self.test_mail(mail):
                return mail
            if not self.confirm(self.t("retry_ask")):
                return mail
            print()

    def review(self, values, output):
        """Shows what is about to be written and asks for the go-ahead."""
        rows = [
            (self.t("row_url"), values["MURA_URL"]),
            (self.t("row_admin"), values["MURA_ADMIN_EMAIL"]),
            (self.t("row_server"), f"{values['MAIL_HOST']}:{values['MAIL_PORT']} ({'SSL' if values['MAIL_SSL'] == 'true' else 'STARTTLS'})"),
            (self.t("row_username"), values["MAIL_USERNAME"]),
            (self.t("row_password"), "••••••••"),
            (self.t("row_sender"), values["MURA_MAIL_FROM"]),
            (self.t("row_secrets"), self.t("row_secrets_value")),
            (self.t("row_file"), str(output)),
        ]
        pad = max(len(label) for label, _ in rows)
        for label, value in rows:
            print(f"    {self.style('dim', label.ljust(pad))}  {value}")
        print()
        return self.confirm(self.t("confirm_write"))

    def next_steps(self, values):
        """Says what to do now that the file exists."""
        print()
        self.good(self.t("written"))
        print()
        print(f"  {self.style('bold', self.t('next_title'))}")
        print()
        print(f"    {self.style('cyan', '1')}  {self.t('next_start')}")
        print(f"         {self.style('bold', 'docker compose up -d --build')}")
        print(f"    {self.style('cyan', '2')}  {self.t('next_logs')}")
        print(f"         {self.style('bold', 'docker compose logs backend')}")
        register = textwrap.wrap(
            self.t('next_register', url=values['MURA_URL'], email=values['MURA_ADMIN_EMAIL']),
            width=self.width - 7,
            break_on_hyphens=False,
        )
        print(f"    {self.style('cyan', '3')}  {register[0]}")
        for extra in register[1:]:
            print(f"       {extra}")
        print()
        self.lines(self.t("next_more"), kind="dim")
        print()

    def session(self, output):
        """Runs the whole conversation. Returns the exit status."""
        self.banner()
        if output.exists():
            print()
            self.warn(self.t("exists", path=output))
            if not self.confirm(self.t("overwrite_ask"), default=False):
                self.lines(self.t("nothing_changed"))
                return 1

        self.step(1, self.t("step_instance"))
        values = {}
        values["MURA_URL"] = self.ask(
            self.t("q_url"), self.t("why_url"), default="http://localhost:5173", check=valid_url
        ).rstrip("/")
        values["MURA_ADMIN_EMAIL"] = self.ask(self.t("q_admin"), self.t("why_admin"), check=valid_email)

        self.step(2, self.t("step_mail"))
        self.lines(self.t("mail_intro"))
        print()
        values.update(self.settle_mail())

        self.step(3, self.t("step_secrets"))
        self.lines(self.t("secrets_intro"))
        database_password = generate_database_password()
        values.update(
            {
                "JWT_SECRET": generate_jwt_secret(),
                "POSTGRES_PASSWORD": database_password,
                "SPRING_DATASOURCE_PASSWORD": database_password,
                "SPRING_PROFILES_ACTIVE": "",
                "COMPOSE_PROFILES": "",
            }
        )

        self.step(4, self.t("step_review"))
        if not self.review(values, output):
            self.lines(self.t("nothing_written"))
            return 1
        write_env(output, values)
        self.next_steps(values)
        return 0


def build_env(values):
    """Returns the text of .env: .env.example with the known values filled in.

    Every line of the example is kept, comments included, so the file stays
    documented. A value the example does not list is added at the end.
    """
    if not EXAMPLE.exists():
        sys.exit(f"{EXAMPLE}: not found")
    output = []
    written = set()
    for line in EXAMPLE.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^([A-Z_][A-Z0-9_]*)=", line)
        if match and match.group(1) in values:
            key = match.group(1)
            output.append(f"{key}={env_value(values[key])}")
            written.add(key)
        else:
            output.append(line)
    missing = sorted(set(values) - written)
    if missing:
        output.append("")
        output.extend(f"{key}={env_value(values[key])}" for key in missing)
    return "\n".join(output) + "\n"


def write_env(path, values):
    """Writes .env and keeps it readable by its owner only, where the system allows."""
    path.write_text(build_env(values), encoding="utf-8", newline="\n")
    try:
        os.chmod(path, 0o600)
    except OSError:
        return


def run(texts, argv=None):
    """Runs the wizard in the language of `texts`. Returns the exit status."""
    prepare_terminal()
    parser = argparse.ArgumentParser(description=texts["description"])
    parser.add_argument(texts["option"], dest="output", type=Path, default=ROOT / ".env", help=texts["option_help"])
    parser.add_argument("--no-color", action="store_true", help=texts["no_color_help"])
    args = parser.parse_args(argv)
    wizard = Wizard(texts, Style(colour_enabled(args.no_color)))
    try:
        return wizard.session(args.output)
    except (KeyboardInterrupt, EOFError):
        print()
        print()
        wizard.warn(texts["cancelled"])
        return 1

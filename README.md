# eBay-Kleinanzeigen Wohnungssuche-Bot (mit SMS Benachrichtigung, Google Sheets, Node.js)

Scraped eBay-Kleinanzeigen alle 10 Minuten nach Wohnungen, die deinen Kriterien entsprechen und sendet dir eine SMS um schnell agieren zu können.

## Beschreibung

Wohnungen finden im Jahre 2020 kann eine ganz schön nervenaufreibende Aufgabe sein. Durch Corona ist das Angebot schmal und die Nachfrage trotzdem stetig steigend. Da binnen weniger Minuten Inserate mit hunderten Aufrufen und Nachrichten bombardiert werden, brauchte ich eine direktere und feingranular einstellbare Möglichkeit benachrichtigt zu werden und den Überblick zu behalten (Google Sheets).

## Los legen

### Dependencies

* npm, node.js
* cheerio, Twilio, node-env, node-fetch, GoogleSheets

### Programm ausführen

* Projekt klonen: `git clone`
* .env mit Daten befüllen (Google Sheets, Twilio, Kleinanzeigen-Link)
* `npm install`
* `npm run`

## Version History

* 0.2
    * Von .csv auf Google Sheets gewechselt
* 0.1
    * Cronjob
    * Siehe [commits]() oder [release history]()
    * Initial Release
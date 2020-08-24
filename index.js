require('dotenv').config()
const fetch = require('node-fetch')
const cheerio = require('cheerio')
var CronJob = require('cron').CronJob
const { GoogleSpreadsheet } = require('google-spreadsheet')

// Google Sheets settings
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
async function accessSpreadsheet() {
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY
    })

    await doc.loadInfo()
    global.sheet = doc.sheetsByIndex[0]
}
accessSpreadsheet()

// App settings
const kleinanzeigenQueryLink = process.env.KLEINANZEIGEN_LINK
const SEND_SMS = false

// Twilio settings
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const numberSentFrom = process.env.TWILIO_NUMBER
const numberToSendTo = process.env.NUMBER_TO_SEND_TO
var twilio = require('twilio')
var client = new twilio(accountSid, authToken)

var job = new CronJob('*/5 * * * * *', function () {
    console.log('Suche nach neuen Wohnungen..')
    fetchApartments()
}, null, true, 'Europe/Berlin')
job.start()

async function fetchApartments() {
    fetch(kleinanzeigenQueryLink)
        .then((res) => res.text())
        .then((body) => {
            const $ = cheerio.load(body)

            $('.ad-listitem').each((i, el) => {
                const title = $(el).find('.text-module-begin').text().replace(/\s\s+/g, '').replace(/\,/g, ' ')
                const link = 'https://www.ebay-kleinanzeigen.de/' + $(el).find('.text-module-begin').find('a').attr('href')
                const description = $(el).find('.text-module-begin').next().text().replace(/\r?\n|\r/g, '').replace(/\,/g, ' ')
                const rooms = $(el).find('.text-module-begin').next().next().children().last().text().replace(/\s\s+/g, '')
                const price = $(el).find('.aditem-details').children().first().text().replace(/\s\s+/g, '')
                const uploadDate = $(el).find('.aditem-details').next().text().replace(/\r?\n|\r/g, '').replace(/\s\s+/g, '').replace(/\,/, '')
                var size = $(el).find('.text-module-begin').next().next().children().first().text().replace(/\s\s+/g, '')
                if (size.includes(',')) size = size.substring(0, size.indexOf(','))
                if (size.includes(' ')) size = size.substring(0, size.indexOf(' '))

                // TODO: checken ob link schon im apartments array ist, dann nicht appenden und keine SMS senden
                if (uploadDate.toLowerCase().includes('heute')) {
                    sheet.getRows({ query: `link = ${link}` }).then(res => {
                        if (Object.keys(res).length === 0) {
                            console.log(
                                'Überschrift: ' + title + '\n' +
                                'Link: ' + link + '\n' +
                                'Beschreibung: ' + description + '\n' +
                                'Größe: ' + size + '\n' +
                                'Zimmer: ' + rooms + '\n' +
                                'Preis: ' + price + '\n' +
                                'Datum: ' + uploadDate
                            )
                            console.log('________________________')

                            addRow(title, link, description, size, rooms, price, uploadDate)

                            // Send SMS
                            if (SEND_SMS) {
                                sendMessage(
                                    title + '\n' +
                                    link + '\n' +
                                    description + '\n' +
                                    size + 'm²' + '\n' +
                                    rooms + '\n' +
                                    price + '\n' +
                                    uploadDate
                                )
                            }
                        }
                    }, err => {
                        console.log(err)
                    })
                }
            })
        })
}

function sendMessage(message) {
    client.messages.create({
        body: message,
        to: numberToSendTo,  // Text this number
        from: numberSentFrom // From a valid Twilio number
    }).then((message) => console.log(message.sid))
}

async function addRow(title, link, description, size, rooms, price, uploadDate) {
    await sheet.addRow({
        Überschrift: title,
        Link: link,
        Beschreibung: description,
        Größe: size,
        Zimmer: rooms,
        Preis: price,
        Datum: uploadDate,
    })
}

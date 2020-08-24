const SEND_SMS = false

const Apartment = require('./apartment')
require('dotenv').config()
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')
const csv = require('csv-parser');
var CronJob = require('cron').CronJob

// Twilio settings
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const numberSentFrom = process.env.TWILIO_NUMBER
const numberToSendTo = process.env.NUMBER_TO_SEND_TO
var twilio = require('twilio')
var client = new twilio(accountSid, authToken)

let apartments = [];
const filePath = './wohnungen.csv';
fs.access(filePath, fs.F_OK, (err) => {
    if(err) {
        console.log(err)
        // CSV headers
        writeStream = fs.createWriteStream('wohnungen.csv')
        writeStream.write(`Überschrift,Link,Beschreibung,Größe,Zimmer,Preis,Datum\n`)
        return
    }

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('error', () => {
            console.log("Fehler beim Einlesen der wohnungen.csv")
        })
        .on('data', (row) => {
            let apartment = new Apartment(row.Überschrift, row.Link, row.Beschreibung, row.Größe, row.Zimmer, row.Preis, row.Datum)
            apartments.push(apartment)
        })
        .on('end', () => {
        })
})

var job = new CronJob('*/5 * * * * *', function() {
  console.log('Suche nach neuen Wohnungen..')
  fetchApartments()
}, null, true, 'Europe/Berlin')
job.start()

const kleinanzeigenQueryLink = process.env.KLEINANZEIGEN_LINK

const fetchApartments = () => {
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
            if(size.includes(',')) size = size.substring(0, size.indexOf(','))
            if(size.includes(' ')) size = size.substring(0, size.indexOf(' '))

            // TODO: checken ob link schon im apartments array ist, dann nicht appenden und keine SMS senden
            if(uploadDate.toLowerCase().includes('gestern')) {
                console.log(
                    'Überschrift: '+title+ '\n' +
                    'Link: '+link+  '\n' +
                    'Beschreibung: '+description+ '\n' +
                    'Größe: '+size+  '\n' +
                    'Zimmer: '+rooms+ '\n' +
                    'Preis: '+price+ '\n' +
                    'Datum: '+uploadDate
                 )
                console.log('________________________')
                
                // Write row to CSV
                writeStream = fs.createWriteStream('wohnungen.csv', {flags: 'a'})
                writeStream.write(`${title},${link},${description},${size+'m²'},${rooms},${price},${uploadDate}\n`)

                let apartment = new Apartment(title, link, description, size, rooms, price, uploadDate)
                apartments.push(apartment)

                // Send SMS
                if(SEND_SMS) {
                    sendMessage(
                        title+ '\n' +
                        link+  '\n' +
                        description+ '\n' +
                        size+'m²' +  '\n' +
                        rooms+ '\n' +
                        price+ '\n' +
                        uploadDate
                    )
                }
            }
        })
    })
}

const sendMessage = (message) => {
    client.messages.create({
        body: message,
        to: numberToSendTo,  // Text this number
        from: numberSentFrom // From a valid Twilio number
    }).then((message) => console.log(message.sid))
}

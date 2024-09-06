const express = require('express')
const fs = require('fs')
const path = require('path')

const http = require('http')
const https = require('https')
const cors = require('cors')
require('dotenv').config()
const morgan = require('morgan')
const logger = morgan('combined')
const multer  = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });
/*
const key = fs.readFileSync(path.resolve(__dirname, 'certs','private.key'))
const cert = fs.readFileSync(path.resolve(__dirname, 'certs','certificate.crt'))
const ca = fs.readFileSync(path.resolve(__dirname, 'certs','ca_bundle.crt'))*/

// const options = {
//     key: key,
//     cert: cert,
//     ca: ca
// }

// const key = fs.readFileSync(path.resolve(__dirname, 'certs_silinet','privkey.pem'), 'utf8')
// const cert = fs.readFileSync(path.resolve(__dirname, 'certs_silinet','cert.pem'), 'utf8')

//
const hskey = fs.readFileSync('/etc/letsencrypt/live/silinet.ru/privkey.pem', 'utf8')
const hscert = fs.readFileSync('/etc/letsencrypt/live/silinet.ru/cert.pem', 'utf8')
const hschain = fs.readFileSync('/etc/letsencrypt/live/silinet.ru/chain.pem', 'utf8')
const options = {
    key: hskey,
    cert: hscert,
    ca: [hschain]
}

const app = express()

const PORT_HTTPS = process.env.PORT_HTTPS
const HOST_HTTPS = process.env.HOST_HTTPS
const PORT_HTTP = process.env.PORT_HTTP
const HOST_HTTP = process.env.HOST_HTTP
const HOST_TEST = 'eapp.silinet.net'
const PORT_TEST =  8080
// const PORT_LOCAL = process.env.PORT_LOCAL
// const HOST_LOCAL = process.env.HOST_LOCAL

app.use(logger)
app.use(cors())



app.use(express.json({extended: true}))
app.use('/upload', express.static(path.join(__dirname, 'uploads')))

if(process.env.NODE_ENV === 'production') {
  // app.use('/', express.static(path.join(__dirname, 'client', 'build')))
    // app.get('/.well-known/pki-validation/B3E21055D1D1F9C32F1B5757BEF070C9.txt', function (req, res, next) {
    //     res.sendFile(path.resolve(__dirname, 'static', '.well-known', 'pki-validation','B3E21055D1D1F9C32F1B5757BEF070C9.txt'))
    // })
    //
    // app.get('*', (req, res) => {
    //     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    // })
app.get('/upload', (req, res) => {
res.json({message: 'it,s working upload service !!!'})
})

    app.post('/upload', upload.array('files', 20), (req, res) => {
        if (!req.files) {
            return res.json({ message: 'Ошибка загружки файлов!'})
        }
        const urls = req?.files.map(item => `https://${req.get('host')}/upload/${item?.filename}` ?? [])
        const fileNames = req?.files.map(item => item?.filename ?? [])
        res.json({ message: 'Файлы загружены!', urls, fileNames})
    })

    app.delete('/upload/:filename', (req, res) => {
        const { filename } = req.params;
        const filePath = `uploads/${filename}`

        // Check if the file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File doesn't exist
                res.status(404).send('Файл не найден!');
            } else {
                // Delete the file
                fs.unlink(filePath, (err) => {
                    if (err) {
                        // Error occurred while deleting the file
                        res.status(500).send('Ошибка удаления файлов!');
                    } else {
                        // File deleted successfully
                        res.send('Файлы удалены успешно!');
                    }
                });
            }
        });
    });

}
//const httpServer  = http.createServer(app)
const httpsServer  = https.createServer(options, app)

async function start() {
    try {
       //app.listen(PORT_LOCAL, HOST_LOCAL, () =>  console.log(`App has been started host: http://${HOST_LOCAL}:${PORT_LOCAL}`))
         //httpServer.listen(PORT_HTTP, HOST_HTTP ,() => console.log(`App has been started host: http://${HOST_HTTP}:${PORT_HTTP}`))
        httpsServer.listen(PORT_TEST, HOST_TEST ,() => console.log(`App has been started host: http://${HOST_TEST}:${PORT_TEST}`))
    } catch (e) {
        console.log('Server Error', e.message)
        process.exit(1)
    }
}

start()



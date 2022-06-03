const makeWaSocket = require('@adiwajshing/baileys').default;
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const P = require('pino');
const { unlink, existsSync, mkdirSync, readFileSync } = require('fs');
const express = require('express');
const { body, validationResult } = require('express-validator');
const http = require('http');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const ZDGPath = './ZDGSessions/';
const ZDGAuth = 'auth_info.json';
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

const ZDGUpdate = (ZDGsock) => {
   ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr){
         console.log('© BOT-ZDG - Qrcode: ', qr);
      };
      if (connection === 'close') {
         const ZDGReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
         if (ZDGReconnect) ZDGConnection()
         console.log(`© BOT-ZDG - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
         if (ZDGReconnect === false) {
            const removeAuth = ZDGPath + ZDGAuth
            unlink(removeAuth, err => {
               if (err) throw err
            })
         }
      }
      if (connection === 'open'){
         console.log('© BOT-ZDG -CONECTADO')
      }
   })
}

const ZDGConnection = async () => {
   const { version } = await fetchLatestBaileysVersion()
   if (!existsSync(ZDGPath)) {
      mkdirSync(ZDGPath, { recursive: true });
   }
   const { saveState, state } = useSingleFileAuthState(ZDGPath + ZDGAuth)
   const config = {
      auth: state,
      logger: P({ level: 'error' }),
      printQRInTerminal: true,
      version,
      connectTimeoutMs: 60_000,
      async getMessage(key) {
         return { conversation: 'botzg' };
      },
   }
   const ZDGsock = makeWaSocket(config);
   ZDGUpdate(ZDGsock.ev);
   ZDGsock.ev.on('creds.update', saveState);

   const ZDGSendMessage = async (jid, msg) => {
     // await ZDGsock.presenceSubscribe(jid)
     // await delay(2000)
     // await ZDGsock.sendPresenceUpdate('composing', jid)
      //await delay(1500)
     // await ZDGsock.sendPresenceUpdate('paused', jid)
      return await ZDGsock.sendMessage(jid, msg)
   }
   
// Send Image link
   app.post('/send-image-link', [
      body('jid').notEmpty(),
      body('buttonurl').notEmpty(),
      body('imageurl').notEmpty(),
      body('message').notEmpty(),
      body('token').notEmpty(),
      body('buttonzdg1').notEmpty(),
	  body('buttonzdg2').notEmpty(),
	  body('respostadisplay').notEmpty(),
	  body('respostadoisdisplay').notEmpty(),
   ], async (req, res) => {
      const errors = validationResult(req).formatWith(({
      msg
      }) => {
      return msg;
      });
      if (!errors.isEmpty()) {
      return res.status(422).json({
         status: false,
         message: errors.mapped()
      });
      }
	  const id1 = req.body.id1;
      const id2 = req.body.id2;
      const id3 = req.body.id3;
      const displaytext1 = req.body.displaytext1;
      const displaytext2 = req.body.displaytext2;
      const displaytext3 = req.body.displaytext3;
      const jid = req.body.jid;
      const numberDDI = jid.substr(0, 2);
      const numberDDD = jid.substr(2, 2);
      const numberUser = jid.substr(-8, 8);
      const linkurl = req.body.buttonurl;
	  const zdg1 = req.body.buttonzdg1;
	  const zdg2 = req.body.buttonzdg2;
      const mensagem = req.body.message;
      const imageurl = req.body.imageurl;
      const description = req.body.buttondisplay;
	  const respostaum = req.body.respostadisplay;
	  const respostadois = req.body.respostadoisdisplay;
      const token = req.body.token;
      const tokenSecret = 'TOKENSECRET';
	  const ZDGreplyBtn1 = {
	  id: zdg1,
      displayText: respostaum,
}
	  const ZDGreplyBtn2 = {
	  id: zdg2,
      displayText: respostadois,
}
      const dadoslink = {
        url: linkurl,
        displayText: description,
        }
		const ZDGbtnMD = [
	{ index: 0, urlButton: dadoslink},
   { index: 3, quickReplyButton: ZDGreplyBtn1 },
   { index: 4, quickReplyButton: ZDGreplyBtn2 },
]
               const link = {
                  caption: mensagem,
                  image: {
                    url: imageurl
                  },
					templateButtons: ZDGbtnMD
				}
				
					

      if (numberDDI !== '55' && token === tokenSecret) {
         ZDGSendMessage(jid, link).then(response => {
            res.status(200).json({
               status: true,
               response: response
            });
            }).catch(err => {
            res.status(500).json({
               status: false,
               response: err
            });
            });
      }
      if (numberDDI === '55' && numberDDD <= 30 && token === tokenSecret) {
         const numberTratado = "55" + numberDDD + "9" + numberUser + "@s.whatsapp.net";
         ZDGSendMessage(numberTratado, link).then(response => {
            res.status(200).json({
               status: true,
               response: response
            });
            }).catch(err => {
            res.status(500).json({
               status: false,
               response: err
            });
            });
      }
      if (numberDDI === '55' && numberDDD > 30 && token === tokenSecret) {
         const numberTratado = "55" + numberDDD + numberUser + "@s.whatsapp.net";
         ZDGSendMessage(numberTratado, link).then(response => {
            res.status(200).json({
               status: true,
               response: response
            });
            }).catch(err => {
            res.status(500).json({
               status: false,
               response: err
            });
            });
      }

   });
   

}

ZDGConnection()

server.listen(port, function() {
   console.log('© BOT-ZDG - Servidor rodando na porta: ' + port);
 });

require('dotenv').config();
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const methodOverride = require('method-override');
require('./Api/database/db.js');
const PORT = process.env.PORT || 5000
const app = express()
const main = require('./Api/auth.js')
const s3 = require('./Api/s3/image-uploader.js');


app.set('view engine', 'pug');
app.use(cors({optionsSuccessStatus: 200}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.get('/',(req, res) => {
  res.redirect('/home')
})

s3(app)
main(app)

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const util = require('util')
const unlinkfile = util.promisify(fs.unlink)
const {uploadFile} = require('./s3')
const Blog = require('../model/blog').Blog
const Gcc = require('../model/gcc').Gcc
const Video = require('../model/video').Video
const Ts = require('../model/ts').Ts
const News = require('../model/news').News
const Image = require('../model/news').Image
const Inter = require('../model/interview').Interview

module.exports = (app) => {

  const storage = multer.diskStorage({
    destination: "./uploads/",
  
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  var upload = multer({ storage: storage })
  
  app.post('/:page/new/image/:slug', upload.array('test', 10) , async ( req, res) => {
    var promises = []
    const page = req.params.page
    for (var i = 0; i < req.files.length; i++) {
      const data = await uploadFile(req.files[i]);
      await unlinkfile(req.files[i].path)
      const monFile = new Image({link: data.Location})
      promises.push(data)
      if (page == 'news') {
        News.findOne({slug: req.params.slug}, async (err, the) => {
          if(err) {
            res.redirect('/')
          } else {
            the.images.push(monFile)
            await the.save()
          }
        })
      } else if(page == "blog") {
        Blog.findOne({slug: req.params.slug},async (err, the) => {
          if(err) {
            res.redirect('/')
          } else {
            the.images.push(monFile)
            await the.save()
          }
        })
      } else if(page == "gully-cricket-chronicles") {
        Gcc.findOne({slug: req.params.slug},async (err, the) => {
          if(err) {
            res.redirect('/')
          } else {
            the.images.push(monFile)
            await the.save()
          }
        })
      } else if (page == "talent-spotting") {
        Ts.findOne({slug: req.params.slug},async (err, the) => {
          if(err) {
            res.redirect('/')
          } else {
            the.images.push(monFile)
            await the.save()
          }
        })
      } else if(page == "interview") { 
        Inter.findOne({slug: req.params.slug},async (err, the) => {
          if(err) {
            res.redirect('/')
          } else {
            the.images.push(monFile)
            await the.save()
          }
        })
      } else if(page == " video") {
        res.redirect('/')
      } else {res.redirect('/')}
    }
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(5000)
    res.redirect(`/${page}/add/info/${req.params.slug}`)
  })

}
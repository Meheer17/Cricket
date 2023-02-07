'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./database/connections');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
const cookieParser = require('cookie-parser');
const Blog = require('./model/blog').Blog
const Gcc = require('./model/gcc').Gcc
const Video = require('./model/video').Video
const Ts = require('./model/ts').Ts
const News = require('./model/news').News
const Com = require('./model/news').NewsCom
const Inter = require('./model/interview').Interview



module.exports = function(app) {
  
    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
    //   store: store,
      cookie: { secure: false },
      key: 'express.sid'
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    
    myDB(async (client) => {
      const adn = await client.db('myFirstDatabase').collection('LS');
    
      app.route('/login').post(passport.authenticate('local', { failureRedirect: '/news/explore' }), (req, res) => {
        res.redirect('/');
      });
    
    
      app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
      });
    
      app.route('/register').post(
        (req, res, next) => {
          const hash = bcrypt.hashSync(req.body.password, 12);
          adn.findOne({ username: req.body.username }, function (err, user) {
            if (err) {
              next(err);
            } else if (user) {
              res.redirect('/');
            } else {
              if (req.body.isAdmin == 'on') {
                adn.insertOne({ username: req.body.username, password: hash, isAdmin: true}, (err, doc) => {
                  if (err) {
                    res.redirect('/');
                  } else {
                    next();
                  }
                });
              } else {
                adn.insertOne({ username: req.body.username, password: hash, isAdmin: false}, (err, doc) => {
                  if (err) {
                    res.redirect('/');
                  } else {
                    next();
                  }
                });
              }
              
            }
          });
        },
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
          res.redirect('/logout');
        }
      );
      
      passport.serializeUser((user, done) => {
          done(null, user._id);
      });
    
      passport.deserializeUser((id, done) => {
          adn.findOne({ _id: new ObjectID(id) }, (err, doc) => {
              done(null, doc);
          });
      });   
    
      passport.use(new LocalStrategy(
          (username, password, done) => {
              adn.findOne({username: username}, (err, user) => {
                  console.log("User " + username + " attempted to login");
                  if (err) {return done(err); }
                  if (!user) {return done(null, false);}
                  if (!bcrypt.compareSync(password, user.password)) {return done(null, false);}
                  return done(null, user)
              });
          }
      ));

      app.get('/home', ifAuthenticate ,async  (req, res) => {
        const blog = await (await Blog.find()).reverse()
        const gcc = await (await Gcc.find()).reverse()
        const video = await (await Video.find()).reverse()
        const ts = await (await Ts.find()).reverse()
        const news = await (await News.find()).reverse()
        const inter = await (await Inter.find()).reverse()
        res.render('index', {blog: blog, gcc: gcc, video: video,ts: ts, news: news, inter: inter})
      })

  app.get('/:page/edit/:slug', ifAuthenticate , ensureAuthenticated , async (req, res) => {
    const page = req.params.page
    const slug = req.params.slug
    if (page == 'news') {
      const data = await News.findOne({slug: slug})
      res.render('edit', {data: data, page: page})
    } else if (page == 'blogs') {
      const data = await Blog.findOne({slug: slug})
      res.render('edit', {data: data, page: page})
    } else if (page == 'interview') {
      const data = await Inter.findOne({slug: slug})
      res.render('edit',{data: data, page: page})
    } else if (page == 'gully-cricket-chronicles') {
      const data = await Gcc.findOne({slug: slug})
      res.render('edit',{data: data, page: page})
    } else if (page == 'talent-spotting') {
      const data = await Ts.findOne({slug: slug})
      res.render('edit', {data: data, page: page})
    } else if(page == "video") {
      const data = await Video.findOne({slug: slug})
      res.render('edit', {data: data, page: page})
    }else { res.redirect('/')}
  })

  app.get('/new/post', ensureAuthenticated , async (req, res) => {
    res.render('new-post')
  }) 

  app.get('/login', ifAuthenticate, (req, res)=> {
    if(req.isAuthenticated()){
      res.redirect('/home')
    } else {
      res.render('login')
    } 
  })
      
  app.get('/signup', isAdmin , (req, res)=> {
    res.render('sign-up')
  })

  app.delete('/:page/delete/:id', ensureAuthenticated , async (req,res) => {
    
    const page = req.params.page
    if(page == "news"){
      await News.findByIdAndDelete(req.params.id)
    }else if(page == "blogs"){
      await Blog.findByIdAndDelete(req.params.id)
    }else if(page == "video"){
      await Video.findByIdAndDelete(req.params.id)
    }else if(page == "gully-cricket-chronicles"){
      await Gcc.findByIdAndDelete(req.params.id)
    }else if(page == "interview"){
      await Inter.findByIdAndDelete(req.params.id)
    } else if(page == "talent-spotting"){
      await Ts.findByIdAndDelete(req.params.id)
    }
    res.redirect(`/${page}/explore`)
  })
  
  app.delete('/:page/delete/com/:bid/:cid', ensureAuthenticated, async (req,res) => {
    const page = req.params.page
    if(page == "news"){
      const data = await News.updateOne({"_id": req.params.bid}, {$pull: {"comments": {"_id": req.params.cid}}})
      res.redirect(`/${page}/explore`)
    }else if(page == "blogs"){
      const data = await Blog.updateOne({"_id": req.params.bid}, {$pull: {"comments": {"_id": req.params.cid}}})
      res.redirect(`/${page}/explore`)
    }else if(page == "video"){
      const data = await Video.updateOne({"_id": req.params.bid}, {$pull: {"comments": {"_id": req.params.cid}}})
      res.redirect(`/${page}/explore`)
    }else if(page == "gully-cricket-chronicles"){
      const data = await Gcc.updateOne({"_id": req.params.bid}, {$pull: {"comments": {"_id": req.params.cid}}})
      res.redirect(`/${page}/explore`)
    }else if(page == "interview"){
      const data = await Inter.updateOne({"_id": req.params.bid}, {$pull: {"comments": {"_id": req.params.cid}}})
      res.redirect(`/${page}/explore`)
    } else if(page == "talent-spotting"){
      const data = await Ts.updateOne({"_id": req.params.bid}, {$pull: {"comments": {"_id": req.params.cid}}})
      res.redirect(`/${page}/explore`)
    }
  })

  app.get('/:page/explore', ifAuthenticate , async (req, res) => {
    const page = req.params.page
    if (page == 'news') {
      const data = await (await News.find()).reverse()
      res.render('explore', {page: page, data: data})
    } else if(page == "blogs") {
      const data = await (await Blog.find()).reverse()
      res.render('explore', {page: page, data: data})
    } else if(page == "gully-cricket-chronicles") {
      const data = await (await Gcc.find()).reverse()
      res.render('explore',{page: page, data: data})
    } else if (page == "talent-spotting") {
      const data = await (await Ts.find()).reverse()
      res.render('explore', {page: page, data: data})
    } else if (page == "video") {
      const data = await (await Video.find()).reverse()
      res.render('explore',{page: page, data: data})
    } else if(page == "interview") { 
      const data = await (await Inter.find()).reverse()
      res.render('explore',{page: page, data: data})
    } else {res.redirect('/')}
  })



  app.post('/:page/new/post',ensureAuthenticated , async (req, res) => {
    const page = req.params.page
   
        if(page == "blog" ) {
        req.initial = new Blog()
        let blog = req.initial
        blog.title = req.body.title
        blog.author = req.user.username
        blog.summary = req.body.summary
        blog.date = new Date().toDateString()
        try {
          blog = await blog.save()
          res.redirect(`/blog/new/image/${blog.slug}`)
        } catch (e) {
          console.log(e)
          redirectes.render('new-post', {data: blog ,page:page, error: "Error"})
        }
      } else if(page == "news" ) {
        req.initial = new News()
        let news = req.initial
        news.title = req.body.title
        news.author = req.user.username
        news.summary = req.body.summary
        news.date = new Date().toDateString()
        try {
          news = await news.save()
          res.redirect(`/news/new/image/${news.slug}`)
        } catch (e) {
          console.log(e)
            res.render('new-post', {data: news,page:page, error: "Error"})
        }
      } else if (page == 'video') {
        req.video = new Video()
        let video = req.video
        video.title = req.body.vt
        video.author = req.user.username
        video.link = req.body.link
        video.markdown = req.body.markdown
        video.date = new Date().toDateString()
        try {
          video = await video.save()
          res.redirect(`/video/watch/${video.slug}`)
        } catch (e) {
          console.log(e)
          res.render("new-post", {data : video ,page:page, error: "Error saving video"})
        }
      } else if( page == "gully-cricket-chronicles" ) {
        req.initial = new Gcc()
        let gcc = req.initial
        gcc.title = req.body.title
        gcc.author = req.user.username
        gcc.summary = req.body.summary
        gcc.date = new Date().toDateString()
        try {page
          gcc = await gcc.save()
          res.redirect(`/gully-cricket-chronicles/new/image/${gcc.slug}`)
        } catch (e) {
          console.log(e)
            res.render('new-post', {data: gcc,page:page, error: "Error"})
        }
      } else if(page == "interview" ) {
        req.initial = new Inter()
        let inter = req.initial
        inter.title = req.body.title
        inter.author = req.user.username
        inter.summary = req.body.summary
        inter.date = new Date().toDateString()
        try {
          inter = await inter.save()
          res.redirect(`/interview/new/image/${inter.slug}`)
        } catch (e) {
          console.log(e)
          res.render('new-post', {data: inter,page:page, error: "Error"})
        }
      } else if (page == "talent-spotting") {
        req.ts = new Ts()
        let ts = req.ts
        ts.name = req.body.name
        ts.age = parseInt(req.body.age)
        ts.place = req.body.place
        ts.date = new Date().toDateString()
        ts.summary = req.body.sum
        ts.author = req.user.username
        try {
          ts = await ts.save()
          res.redirect(`/talent-spotting/new/image/${ts.slug}`)
        } catch (e) {
          console.log(e)
          res.render("new-post", {data : ts, page:page, erros : " Error"})
        }
      }
    
  })

app.post('/:page/add/info/:slug', ensureAuthenticated , async (req, res) => {
    const page = req.params.page
      if(page == "blog" ) {
        Blog.findOne({slug: req.params.slug}, async (err, bdata) => {
          bdata.markdown = req.body.markdown
          bdata.mainImg = req.body.image
          if(err) {
            console.log(err)
            res.redirect('/')
          } else {
            const data = await bdata.save()
            res.redirect(`/${page}/read/${data.slug}`)
          }
        })

      } else if(page == "news" ) {
        News.findOne({slug: req.params.slug}, async (err, bdata) => {
          bdata.markdown = req.body.markdown
          bdata.mainImg = req.body.image
          if(err) {
            console.log(err)
            res.redirect('/')
          } else {
            const data = await bdata.save()
            res.redirect(`/${page}/read/${data.slug}`)
          }
          
        })
      } else if( page == "gully-cricket-chronicles" ) {
        Gcc.findOne({slug: req.params.slug}, async (err, bdata) => {
          bdata.markdown = req.body.markdown
          bdata.mainImg = req.body.image
          if(err) {
            console.log(err)
            res.redirect('/')
          } else {
            const data = await bdata.save()
            res.redirect(`/${page}/read/${data.slug}`)
          }
        })
      } else if(page == "interview" ) {
      Inter.findOne({slug: req.params.slug}, async (err, bdata) => {
          bdata.markdown = req.body.markdown
          bdata.mainImg = req.body.image
          if(err) {
            console.log(err)
            res.redirect('/')
          } else {
            const data = await bdata.save()
            res.redirect(`/${page}/read/${data.slug}`)
          }
        })
      } else if (page == "talent-spotting") {
        Ts.findOne({slug: req.params.slug}, async (err, data) => {
          data.markdown = req.body.markdown
          data.mainImg = req.body.image
          if(err) {
            console.log(err)
            res.redirect('/')
          } else {
            const data = await bdata.save()
            res.redirect(`/${page}/read/${data.slug}`)
          }
        })
      } else {res.redirect('/')}
  })

  app.put('/:page/edit/:slug',ensureAuthenticated,  async (req, res) => {
    const page = req.params.page
    if(page == "blogs" ) {
      req.blog = await Blog.findOne({slug: req.params.slug})
      let blog = req.blog
        blog.title = req.body.title
        blog.summary =  req.body.summary
        blog.markdown =  req.body.markdown
        blog.mainImg = req.body.image
        try {
            blog = await blog.save()
            res.redirect(`/${page}/read/${blog.slug}`)
        } catch (e) {
            console.log(e)
            res.render('new-post', {blog: blog , error: "Make sure to fill all the fields"})
        }
    } else if(page == "news" ) {
      req.blog = await News.findOne({slug: req.params.slug})
      let blog = req.blog
        blog.title = req.body.title
        blog.summary =  req.body.summary
        blog.markdown =  req.body.markdown
        blog.mainImg = req.body.image
        try {
            blog = await blog.save()
            res.redirect(`/${page}/read/${blog.slug}`)
        } catch (e) {
            console.log(e)
            res.render('new-post', {blog: blog , error: "Make sure to fill all the fields"})
        }
    } else if (page == 'video') {

      req.blog = await Video.findOne({slug: req.params.slug})
      let blog = req.blog
      blog.title = req.body.vt
      blog.link =  req.body.link
      blog.markdown =  req.body.markdown
      try {
        blog = await blog.save()
        res.redirect(`/video/watch/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.render('new-post', {blog: blog , error: "Make sure to fill all the fields"})
      }

    } else if( page == "gully-cricket-chronicles" ) {
      req.blog = await Gcc.findOne({slug: req.params.slug})
      let blog = req.blog
        blog.title = req.body.title
        blog.summary =  req.body.summary
        blog.markdown =  req.body.markdown
        blog.mainImg = req.body.image
        try {
            blog = await blog.save()
            res.redirect(`/${page}/read/${blog.slug}`)
        } catch (e) {
            console.log(e)
            res.render('new-post', {blog: blog , error: "Make sure to fill all the fields"})
        }
    } else if(page == "interview" ) {
      req.blog = await Inter.findOne({slug: req.params.slug})
      let blog = req.blog
        blog.title = req.body.title
        blog.summary =  req.body.summary
        blog.markdown =  req.body.markdown
        blog.mainImg = req.body.image
        try {
            blog = await blog.save()
            res.redirect(`/${page}/read/${blog.slug}`)
        } catch (e) {
            console.log(e)
            res.render('new-post', {blog: blog , error: "Make sure to fill all the fields"})
        }
    } else if (page == "talent-spotting") {

      req.blog = await Ts.findOne({slug: req.params.slug})
      let blog = req.blog
      blog.name = req.body.name
      blog.age =  req.body.age
      blog.place = req.body.place
      blog.summary = req.body.sum
      blog.markdown = req.body.markdown
      blog.mainImg =  req.body.image
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.render('new-post', {blog: blog , error: "Make sure to fill all the fields"})
      }
      
    }
  })

  app.post('/:page/com/:slug', async (req, res) => {
    const page = req.params.page
    if(page == "blogs" ) {
      req.blog = await Blog.findOne({slug: req.params.slug})
      let blog = req.blog
      const com = req.body.com
      const name = req.body.name
      const comu = new Com({comment: com, name: name})
      blog.comments.push(comu)
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.redirect(`/${page}/read/${blog.slug}`)
      }
    } else if(page == "news" ) {
      req.blog = await News.findOne({slug: req.params.slug})
      let blog = req.blog
      const com = req.body.com
      const name = req.body.name
      const comu = new Com({comment: com, name: name})
      blog.comments.push(comu)
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.redirect(`/${page}/read/${blog.slug}`)
      }
    } else if(page == "video" ) {
      req.blog = await Video.findOne({slug: req.params.slug})
      let blog = req.blog
      const com = req.body.com
      const name = req.body.name
      const comu = new Com({comment: com, name: name})
      blog.comments.push(comu)
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.redirect(`/${page}/read/${blog.slug}`)
      }
    } else if(page == "gully-cricket-chronicles" ) {
      req.blog = await Gcc.findOne({slug: req.params.slug})
      let blog = req.blog
      const com = req.body.com
      const name = req.body.name
      const comu = new Com({comment: com, name: name})
      blog.comments.push(comu)
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.redirect(`/${page}/read/${blog.slug}`)
      }
    } else if(page == "interview" ) {
      req.blog = await Inter.findOne({slug: req.params.slug})
      let blog = req.blog
      const com = req.body.com
      const name = req.body.name
      const comu = new Com({comment: com, name: name})
      blog.comments.push(comu)
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.redirect(`/${page}/read/${blog.slug}`)
      }
    } else if(page == "talent-spotting" ) {
      req.blog = await Ts.findOne({slug: req.params.slug})
      console.log(req.blog)
      let blog = req.blog
      const com = req.body.com
      const name = req.body.name
      const comu = new Com({comment: com, name: name})
      blog.comments.push(comu)
      try {
        blog = await blog.save()
        res.redirect(`/${page}/read/${blog.slug}`)
      } catch (e) {
          console.log(e)
          res.redirect(`/${page}/read/${blog.slug}`)
      }
    }
  })


      app.get('/:page/read/:slug',ifAuthenticate, async (req, res) => {
    const page = req.params.page
    const slug = req.params.slug
    if (page == 'news') {
      const data = await News.findOne({slug: slug})
      res.render('bgin', {data: data, page: page})
    } else if (page == 'blogs') {
      const data = await Blog.findOne({slug: slug})
      res.render('bgin', {data: data, page: page})
    } else if (page == 'interview') {
      const data = await Inter.findOne({slug: slug})
      res.render('bgin', {data: data, page: page})
    } else if (page == 'gully-cricket-chronicles') {
      const data = await Gcc.findOne({slug: slug})
      res.render('bgin', {data: data, page: page})
    } else if (page == 'talent-spotting') {
      const data = await Ts.findOne({slug: slug})
      res.render('ts', {data: data, page: page})
    } else { res.redirect('/')}
  })

  app.get('/video/watch/:slug',ifAuthenticate, async (req, res) => {
    const data = await Video.findOne({slug: req.params.slug})
    const video = await Video.find()
    res.render('video', {data: data, page: video, video:video})
  })

  app.get('/:page/new/post',ensureAuthenticated, ifAuthenticate , (req,res) => {
    const page = req.params.page
    if (page == 'news') {
      res.render('new-post', {page: page, data: new Blog({title: "", summary: ""})})
    } else if(page == "blog") {
      res.render('new-post', {page: page, data: new Blog({title: "", summary: ""})})
    } else if(page == "gully-cricket-chronicles") {
      res.render('new-post', {page: page, data: new Blog({title: "", summary: ""})})
    } else if (page == "talent-spotting") {
      res.render('new-post', {page: page, ts:true ,  data: new Ts({name: "",place:"",  summary: "", age: ""})})
    } else if (page == "video") {
      res.render('new-post', {page: page, data: new Video({title: "", link: "", md: ""})})
    } else if(page == "interview") { 
      res.render('new-post', {page: page, data: new Blog({title: "", summary: ""})})
    } else {res.redirect('/')}
  })

  app.get('/:page/new/image/:slug',ensureAuthenticated, ifAuthenticate ,async (req,res)=> {
    const page = req.params.page
    const img = true
    if (page == "news") {
      const data = await News.findOne({slug: req.params.slug})
      res.render('new-post', {data: data, img:img, page:page})
    } else if (page == "blog") {
      const data = await Blog.findOne({slug: req.params.slug})
      res.render('new-post', {page:page, img:img, data: data})
    } else if (page == "talent-spotting") {
      const data = await Ts.findOne({slug: req.params.slug})
      res.render('new-post', {page:page, img:img, data: data})
    } else if (page == "gully-cricket-chronicles") {
      const data = await Gcc.findOne({slug: req.params.slug})
      res.render('new-post', {page:page, img:img,data: data})
    } else if (page == "interview") {
      const data = await Inter.findOne({slug: req.params.slug})
      res.render('new-post', {page:page,img:img, data: data})
    } else {res.redirect('/')}
  })

  app.get('/:page/add/info/:slug',ensureAuthenticated , ifAuthenticate,  async (req,res)=> {
    const page = req.params.page
    const info = true
    if (page == "news") {
      const data = await News.findOne({slug: req.params.slug})
      res.render('new-post', {data: data, info:info, page:page, md: new Blog({markdown: ""})})
    } else if (page == "blog") {
      const data = await Blog.findOne({slug: req.params.slug})
      res.render('new-post', {data: data, info:info, page:page, md: new Blog({markdown: ""})})
    } else if (page == "talent-spotting") {
      const data = await Ts.findOne({slug: req.params.slug})
      res.render('new-post', {data: data, ts1:true, page:page, md: new Blog({markdown: ""})})
    } else if (page == "gully-cricket-chronicles") {
      const data = await Gcc.findOne({slug: req.params.slug})
      res.render('new-post', {data: data, info:info, page:page, md: new Blog({markdown: ""})})
    } else if (page == "interview") {
      const data = await Inter.findOne({slug: req.params.slug})
      res.render('new-post', {data: data, info:info, page:page , md: new Blog({markdown: ""})})
    } else {res.redirect('/')}
  })

      
    
    }).catch((e) => {
      app.route('/').get((req, res) => {
        res.redirect('/videos/explore');
      });
    });

     

    function isAdmin(req, res, next) {
      if(req.isAuthenticated() && req.user.isAdmin){
        return next();
      } else {
        res.redirect('/')
      }
    } 

    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next()
      }
      res.redirect('/');
    }

    function ifAuthenticate(req, res, next) {
      if(req.isAuthenticated()){
        res.locals.user = true
        next()
      } else {
        return next()
      } 
    }
  
}

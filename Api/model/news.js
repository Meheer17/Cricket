const mongoose = require('mongoose');
const {Schema} = mongoose
const {marked} = require('marked')
const slugify = require('slugify')
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const newsComSchema = new Schema({
  name: String,
  comment: String, 
  date: {type: Date, default: Date.now()}
})

const imageSchema = new Schema({
  link: String
})

const newsSchema = new Schema({

  title: {type: String, required: false},
  mainImg: {type: String},
  author: {type: String},
  images: {type: [imageSchema]},
  summary: {type: String, required: false},
  markdown : {type: String},
  date: {type: Date, required: false},
  comments: [newsComSchema],
  slug: {type: String, required: false, unique: true},
  safeHtml: {type: String}

})

newsSchema.pre('validate', function(next) {

  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true })
  }

  if (this.markdown) {
    this.safeHtml = dompurify.sanitize(marked(this.markdown))
  }

  next()
})

const news = mongoose.model("News", newsSchema)
const newsCom = mongoose.model("c", newsComSchema)
const image = mongoose.model('im', imageSchema)

exports.NewsCom = newsCom 
exports.News = news
exports.Image = image
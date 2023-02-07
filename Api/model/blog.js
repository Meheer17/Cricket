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

const blogSchema = new Schema({

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

blogSchema.pre('validate', function(next) {

  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true })
  }

  if (this.markdown) {
    this.safeHtml = dompurify.sanitize(marked(this.markdown))
  }

  next()
})

const blog = mongoose.model("Blog", blogSchema)

exports.Blog = blog
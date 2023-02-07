const mongoose = require('mongoose'); 
const {Schema} = mongoose;
const {marked} = require('marked');
const slugify = require('slugify');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const newsComSchema = new Schema({
  name: String,
  comment: String, 
  date: {type: Date, default: Date.now()}
})

const videoSchema = new Schema({

  title: {type: String, required: true},
  slug: {type: String, required: true, unique:true},
  author: {type: String},
  link: {type: String, required: true},
  markdown: {type: String, required: true},
  date: {type: String, required: true},
  description: {type: String, required: true},
  comments : [newsComSchema],
  linkimg: {type: String, required: true}

})

videoSchema.pre('validate', function(next) {

  if (this.title) {
    this.slug = slugify(this.title, {lower: true, strict: true})
  }

  if(this.markdown) {
    this.description = dompurify.sanitize(marked(this.markdown))
  }

  if(this.link) {
    this.link = this.link.replace('watch?v=','embed/')
    this.linkimg = this.link.slice(-11) 
  }

  next()

})

const video = mongoose.model('Video', videoSchema)

exports.Video = video
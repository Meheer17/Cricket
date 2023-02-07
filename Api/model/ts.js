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

const tsSchema = new Schema({

  name: {type: String,required: false},
  age: {type: Number, required: false},
  place: {type: String, required: false},
  images: {type: [imageSchema]},
  date: {type: Date, required: false},
  slug: {type: String, unique:true, required: false},
  mainImg: {type: String},
  summary: {type: String, required: false},
  markdown : {type: String},
  comments: [newsComSchema],
  details: {type: String},

})

tsSchema.pre('validate', function (next) {

  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }

  if (this.markdown) {
    this.details = dompurify.sanitize(marked(this.markdown))
  }

  next()

})

const ts = mongoose.model("Talent", tsSchema)

exports.Ts = ts
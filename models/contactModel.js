const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  numbers: {
    type: [Number],
    unique: true,
    required: true
  }
});

contactSchema.index({ numbers: 1 }, { unique: true });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;

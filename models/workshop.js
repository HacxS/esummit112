var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var workshopSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  }, 
  price : {
    type: Number,
    required: true 
  }
});

workshopSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Workshop", workshopSchema);
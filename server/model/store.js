const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  item_src: { type: String, default: null },
  item_name: { type: String, default: null },
  item_price: { type: String, unique: true },
});

module.exports = mongoose.model("store", storeSchema);
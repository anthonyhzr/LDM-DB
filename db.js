// 1ST DRAFT DATA MODEL
const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const passportLocalMongoose = require('passport-local-mongoose');

// users
// * our site requires authentication...
// * so users have a username and password
// * also, we want to have a group of admin users that can manage other users
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    admin: Boolean
});

// study
// * a lab have multiple studies
// * a study has a age range of babies to recruit
const StudySchema = new mongoose.Schema({
    studyName: {type: String, required: true, unique: true},
    startYear: {type: Number, required: true},
    startMonth: {type: Number, required: true},
    startDay: {type: Number, required: true},
    endYear: {type: Number, required: true},
    endMonth: {type: Number, required: true},
    endDay: {type: Number, required: true},
});

// contact history
// * record study result for participant
const StudyResultSchema = new mongoose.Schema({
    study: {type: mongoose.Schema.Types.ObjectId, ref: 'Study'},
    lastContactTime: {type: String, required: true},
    outcome: {type: String, required: true, enum: ['complete', 'follow-up', 'contacted', 'new']},
    userName: {type: String, required: true}
});


// babies
// * our database have many babies
// * each baby will have their parents' information
// * their own information
// * and some comments
const BabySchema = new mongoose.Schema({
    lastName: {type: String, required: true},
    firstName: {type: String, required: true},
    birthdate: {type: String, required: true},
    sex: {type: String, enum: ['Male', 'Female']},
    comment: {type: String},
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Parent'},
    result: [{type: mongoose.Schema.Types.ObjectId, ref: 'Result'}]
});

// parents
// * parents might have multiple babies
// * parents will have contact information and a list of their children/child
const ParentSchema = new mongoose.Schema({
    motherLastName: {type: String, required: true},
    motherFirstName: {type: String, required: true},
    fatherLastName: {type: String, required: true},
    fatherFirstName: {type: String, required: true},
    motherPhoneNo: {type: String},
    motherEmail: {type: String},
    fatherPhoneNo: {type: String},
    fatherEmail: {type: String},
    children: [{type: mongoose.Schema.Types.ObjectId, ref: 'Baby'}]
});

// use plugins (for slug)
UserSchema.plugin(passportLocalMongoose);
StudySchema.plugin(URLSlugs("studyName"));
BabySchema.plugin(URLSlugs("firstName lastName"));
ParentSchema.plugin(URLSlugs("motherFirstName fatherFirstName"));

// register your model
mongoose.model('User', UserSchema);
mongoose.model('Study', StudySchema);
mongoose.model('Baby', BabySchema);
mongoose.model('Parent', ParentSchema);
mongoose.model('Result', StudyResultSchema);



// is the environment variable, NODE_ENV, set to PRODUCTION?
let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
    // if we're in PRODUCTION mode, then read the configuration from a file
    // use blocking file io to do this...
    const fs = require('fs');
    const path = require('path');
    const fn = path.join(__dirname, 'config.json');
    const data = fs.readFileSync(fn);

    // our configuration file will be in json, so parse it and set the
    // connection string appropriately!
    const conf = JSON.parse(data);
    dbconf = conf.dbconf;
} else {
    // if we're not in PRODUCTION mode, then use
    dbconf = 'mongodb://localhost/finalProject';
}

mongoose.connect(dbconf);
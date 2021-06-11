// by Zhuoran Huang

require('./db');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');



const Baby = mongoose.model('Baby');
const Parent = mongoose.model('Parent');
const Study = mongoose.model('Study');
const Result = mongoose.model('Result');
const User = mongoose.model('User');

// enable sessions
const session = require('express-session');
const sessionOptions = {
    secret: 'secret',
    resave: false,
    saveUninitialized: false
};

app.use(session(sessionOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// body parser setup
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

/* PASSPORT LOCAL AUTHENTICATION */
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // now you can use {{user}} in your template!
    res.locals.user = req.session.passport;
    next();
});

const connectEnsureLogin = require('connect-ensure-login');

app.post('/login', (req, res, next) => {
    passport.authenticate('local',
        (err, user, info) => {
            if (err) {
                return next(err);
            }

            if(!user){
                return res.render('index', {message: info.message});
            }

            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }

                return res.redirect('/');
            });

        })(req, res, next);
});

app.get('/login', (req, res) => {
        res.render('index');
    }
);

app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.render('index');
});


app.get('/add/baby', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.render('addBaby');
});

app.post('/add/baby', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const newParent = new Parent({
        fatherLastName: req.body.fl,
        fatherFirstName: req.body.ff,
        fatherPhoneNo: req.body.fp,
        fatherEmail: req.body.fe,
        motherLastName: req.body.ml,
        motherFirstName: req.body.mf,
        motherPhoneNo: req.body.mp,
        motherEmail: req.body.me,
    });

    console.log(newParent);
    newParent.save(function(err){
        if(err){
            return err;
        }
        else{
            console.log(req.body.birthdate);
            const newBaby = new Baby({
                parent: newParent._id,
                firstName: req.body.bf,
                lastName: req.body.bl,
                birthdate: req.body.birthdate,
                sex: req.body.sex,
                comment: req.body.comment
            });
            newBaby.save(function (err){
                if(err){
                    return err;
                }
            });
            console.log(newBaby);
            res.redirect('/');
        }
    });
});

app.get('/record', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    Baby.find({}, function(err, babies){
        if(err){
            return err;
        }
        else{
            res.render('record', {babies:babies});
        }
    });
});

app.get('/currentUser', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    console.log(req.session.passport);
    res.json(req.session.passport);
});

app.get('/studyData', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    Study.find({}, function (err, studies) {
        if (err) {
            res.json({"error": err});
        } else {
            res.json(studies.map(function (ele) {
                return {
                    _id: ele._id,
                    studyName: ele.studyName,
                    startYear: ele.startYear,
                    startMonth: ele.startMonth,
                    startDay: ele.startDay,
                    endYear: ele.endYear,
                    endMonth: ele.endMonth,
                    endDay: ele.endDay,
                };
            }));
        }
    });
});

app.get('/study', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    Study.find({}, function(err, studies){
        if(err){
            return err;
        }
        else{
            res.render('study', {studies:studies});
        }
    });
});

app.get('/add/study', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.render('addStudy');
});

app.post('/add/study', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    console.log('start year:' + req.body.startYear);
    const newStudy = new Study({
        studyName: req.body.studyName,
        startYear: req.body.startYear,
        startMonth: req.body.startMonth,
        startDay: req.body.startDay,
        endYear: req.body.endYear,
        endMonth: req.body.endMonth,
        endDay: req.body.endDay,
    });

    console.log(newStudy);
    newStudy.save(function(err){
        if(err){
            return err;
        }
        else{
            res.redirect('/');
        }
    });
});

app.get('/gmail', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.render('gmail');
});

app.post('/baby/addHistory/:slug', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const outcome = req.body.outcome.split(',');
    console.log(outcome);
    Study.findOne({studyName: outcome[0]}, function(err, study){
        if(err){
            console.log("can't find study");
            res.json({"error": "unable to find study"});
        }
        else{
            console.log(study);
            const newResult = new Result({
                study: study._id,
                lastContactTime: outcome[1],
                outcome: outcome[2],
                userName: outcome[3]
            });
            console.log(newResult);
            newResult.save(function(err, result){
                if(err){
                    res.json({"error":"cannot save result"});
                }
                else{
                    Baby.findOneAndUpdate({slug: req.params.slug}, {
                            "$push": {
                                result: result
                            }
                        }, {
                            "new": true
                        },
                        (err, docs) => {
                            if (err) {
                                res.json({
                                    "error": "The comment was not successfully added."
                                });
                            } else {
                                res.json({
                                    "message": "Change was successful",
                                    "docs": docs
                                });
                            }
                        }
                    );
                }
            });
        }
    });
});

app.get('/baby/detail/:slug', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const slug = req.params.slug;
    Baby.findOne({slug: slug}).populate('parent').exec(function(err, baby){
        if(err){
            return err;
        }
        else{
            console.log(baby);
            res.render('babyDetail',{firstName: baby.firstName, lastName: baby.lastName, sex: baby.sex,
            birthdate: baby.birthdate, fatherLastName: baby.parent.fatherLastName, fatherFirstName: baby.parent.fatherFirstName,
                motherLastName: baby.parent.motherLastName, motherFirstName: baby.parent.motherFirstName,
            fatherPhoneNo: baby.parent.fatherPhoneNo, motherPhoneNo: baby.parent.motherPhoneNo,
                motherEmail: baby.parent.motherEmail, fatherEmail: baby.parent.fatherEmail, comment: baby.comment});
        }
    });
});

app.get('/baby/history/:slug', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const slug = req.params.slug;
    Baby.findOne({slug:slug}).populate({path: 'result', populate: {path: 'study'}}).exec(function(err, baby){
        if(err){
            console.log("can't find baby");
            return err;
        }
        else{
            console.log(baby);
            res.render('contactResult', {babyName: slug, results: baby.result});
        }
    });
});


app.listen(process.env.PORT || 3000);

//User.register({username:'admin', active: false}, 'test');
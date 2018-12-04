import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';
import favicon from 'serve-favicon';
import log4js from 'log4js';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import connect from 'connect';
import jwt from 'express-jwt';
import sessionMongoose from 'session-mongoose';

import config from './src/config';
import mongo from './src/db/mongo';
import mkdirs from './src/common/mkdirs';
import logger from './src/common/logger';
import tools from './src/middlewares/tools';
import jwtauth from './src/middlewares/jwtauth';
import routes from './src/routes';

const app = express();
const mkdirsSync = mkdirs.mkdirsSync;
const SessionStore = sessionMongoose(connect);
const mongodb = new mongo(app, config);
const store = new SessionStore({url: mongodb.dblink});
const auth = new jwtauth();
const __dirname = path.resolve();

// 判断文件夹是否存在, 若不存在则创建之
mkdirsSync(config.upload.tmp);
mkdirsSync(config.upload.path);
// view engine setup
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'hbs');
app.engine('hbs', exphbs({
    layoutsDir: path.join(__dirname, 'src/views/layouts/'),
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        time: Date.now
    }
}));

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(log4js.connectLogger(logger('normal'), {level: 'auto', format: ':method :url :status'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '/public')));

app.use(cookieParser(config.secret));

// set session.
app.use(session({
    store: store,
    cookie: {
        maxAge: 60000,
    },
    resave: false,
    saveUninitialized: true,
    secret: config.secret
}));

app.use(cors());

app.use((req, res, next) => {
    if (req.path.indexOf('/api') === -1) {
        return res.render('index');
    }
    return next();
});

// custom middleware
app.use(/\/api/, tools);
app.use(/^((?!sign\/up|sign\/in|captcha).)+$/, [
    jwt({secret: config.secret}),
    auth.verifyToken.bind(auth)
]);

// 加载路由
routes(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    // res.status(404)
    // res.send('Not Found')
    next(err);
});


// error handlers
// development error handler
if (app.get('env') === 'development') {
    app.use((err, req, res) => {
        res.status(err.status || 500);
        res.render('error', {
            layout: false,
            message: err.message,
            error: err
        });
    });
}

// production error handler
app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
        layout: false,
        message: err.message,
        error: err
    });
});

export default app;